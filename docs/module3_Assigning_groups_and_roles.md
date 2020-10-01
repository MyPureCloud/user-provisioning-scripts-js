# Overview

In this module we are going to assign our created users the group and roles defined within our CSV file.  These two steps are shown below in the architectural diagram for this developer starting guide.

![User Provisioning Module 3 Architecture diagram]("resources/images/mod_3_1_user_provisioning_arch_overview.png")

If you remember from the last module, we start all work on creating and provisioning the user in the `src/provisioning.js` file.  The entry point for this work is the `createUser()` function.

```javascript
async function createUsers(filename) {
  let resultPromises = [];

  console.log('Beginning user creation');
  fs.createReadStream(filename)
    .pipe(csv())
    .on('data', async (user) => {
      resultPromises.push(createUser(user))
    })
    .on('end', async () => {
      const users = await Promise.all(resultPromises); //We wait for all of the promises to resolve
      await postUserCreation(users);
    });
}
```

In the code above, we create a user every time we processed a `data` event received from our csv parser.  When we received a `data` event we passed the parsed record to the `createUser()` function and created a Genesys Cloud user. 

```javascript
.on('data', async (user) => {
  resultPromises.push(createUser(user))
})
```

However, since the `createUser()` function is asynchronous, we don't wait for the function to finish processing the creation of the Genesys Cloud user.  Instead, we return a JavaScript `Promise` from the `createUser()` function and push it into an array called `resultPromises`.

While the `data` event is emitted when the cvs parser parses a single user record, the csv parser will also emit an `end` event when all of the records in the CSV file have been processed.  This `end` event is where we going to invoke the logic that will assign users to a group, assign them a role and create a webRTC phone for them.

```javascript
.on('end', async () => {
  const users = await Promise.all(resultPromises); //We wait for all of the promises to resolve
  await postUserCreation(users);
});
```

When an `end` event is received, we use a JavaScript `Promises.all()` function to block any further processing until all of the `createUser()` requests are fulfilled.  

```javascript
const users = await Promise.all(resultPromises); 
```

The use of the `Promises.all()` ensures that we don't try to add any users to a group, role or phone until we know all of the user requests have been processed.

###CALLOUT## //TODO Need to put this in a callout
You might be asking yourself why we don't assign the user's to a group or role as they each individual user is created.  The answer is that some of our APIs are geared towards bulk processing of requests.  As you will see in later on in the module, the group and role APIs expect assignments to be done in bulk and calling theses API with a single record is highly inefficient.

After all of the promises in `resultPromises` has been completed we begin our work of assigning groups and roles by calling the `postUserCreation()` function.  This function is shown below.

```javascript
async function postUserCreation(users) {
  console.log(`Assigning users to groups`);
  await assignUsersToGroups(users);

  console.log(`Assigning users to roles`);
  await assignUsersToRoles(users);

  console.log(`Creating phones for users`);
  for (user of users) {
    await phoneApiProxy.createWebRTCPhone(user);
    await stationsApiProxy.assignUserToWebRtcPhone(user.id);
  }
}
```

This function is really just a control function that carries out each in step in the post "create user" process.  For this module we are going to look only at the `assignUsersToGroups()` and `assignUsersToRoles()` functions.  The process of creating WebRTC phone will be done in the next module.

# Assigning users to a group

The `assignsUsersToGroups()` is sent an array of all users created by the create process.  The `assignUsersToGroups()` function does two things.  First, the code walks through all of the groups in your organization and then maps the users created earlier from the `createUser` process into the groups they belong to.  Second, the `assignUsersToGroups()` then calls the `groupsApiProxy.addUsersToAGroup()` function.  This function uses the Genesys Cloud `Groups` API to actually assign the user to the group. [1]

```javascript
async function assignUsersToGroups(users) {
  for (groupId of groupsApiProxy.getGroupIds()) {
    const userIdsInGroup = users
      .filter((user) => groupId === user.group.id)
      .map((user) => user.id);

    if (userIdsInGroup.length > 0) {
      try {
        await groupsApiProxy.addUsersToAGroup(groupId, userIdsInGroup);
      } catch (e) {
        console.error(`Error in assignUsersToGroup`, user, e);
      }
    }
  }
};
```

In the code above, we start our processing by retrieving a list of all the unique groups ids for the groups in your organization.  

**Note:** from the previous module, all of the groups in your organization were retrieved when you had to lookup the groups in your organization by a logical name.  

The `groupsApiProxy.getGroupIds()` call returns all of the unique group ids from the group records.  We iterate through each of these group ids to begin the group assignment process.

```javascript
for (groupId of groupsApiProxy.getGroupIds()) {
```
For each iterated groupId, we walk through the user list passed in and retrieve a list of all the users whose group id matches the group id being iterated on.

```javascript
const userIdsInGroup = users
      .filter((user) => groupId === user.group.id)
      .map((user) => user.id);
```

If we had any users from our list of created users that match this group id, we then assign them in Genesys Cloud to that group via the `groupsApiProxy.addUsersToAGroup()` function.

The code for the `addUsersToAGroup()` function can be found in `src/proxies/groupsapi.js`.

```javascript
async function addUsersToAGroup(groupId, userIds) {
  let apiInstance = new platformClient.GroupsApi();

  /*If we need to retry we always need to reread the groupVersion for the record*/
  try {
    await retry(
      async () => {
        const groupVersion = (await apiInstance.getGroup(groupId)).version;
        await apiInstance.postGroupMembers(groupId, {
          memberIds: userIds,
          version: groupVersion,
        });
      },
    );
  } catch (e) {
    console.error(`Error occurred while trying create group for user.`, groupid, userIds, e);
  }
};
```

The `addUsersToAGroup()` function has a lot of activity going on in it.  The first thing you might notice is that we are "wrapping" the call to the `Groups` API in a function called `retry()`.  The `retry()` function is from a third-party library called `attempt`.[2]  This library wraps a function so that if an error is thrown from the wrapped function, the `retry()` function will attempt to call it again, using the Javascript literal object passed in as a parameter to control the retry behavior.

```javascript
{ delay: 200, factor: 2, maxAttempts: 5 }
```

These parameters will tell the `retry()` function that if an error is thrown, to wait 200 milliseconds before trying to call the function again, double the length of time to wait between each attempt and to retry the function call 5 times.  

**The question is why are we using this `retry()` function here?**

The `Groups` API is one of the first APIs written for Genesys Cloud.  The developers of the API implemented an optimistic locking mechanism in their API that ensured that if two different callers try to update a group at the same time, one of the calls will fail.  

If you look in the code below, before we assign the users to a group, we need to look up the group version for that group and pass it into the `apiInstance.postGroupMembers()`. To enforce optimistic locking, if the version passed in is not greater than the current version stored on the group record, the call will fail.  The `retry()` function call is making sure we retry on any failure (including optimistic locking).  If we get beyond five failed calls, the `retry()` logic will throw the exception it was retrying on.

```javascript
const groupVersion = (await apiInstance.getGroup(groupId)).version;
await apiInstance.postGroupMembers(groupId, {
    memberIds: userIds,
    version: groupVersion,
  });
},
```

**Authors Note** //TODO figure out what to do on author callout
The author has raised tickets with the development teams that owns the `Groups` API.  The version number on a platform API exposes an internal data structure to the consumer and needlessly complicates consumption of the API.  It is the author's hope that this will addressed in the future and the version attribute and public exposure of the optimistic locking behavior will be deprecated.

Now that we have assigned users to a groups lets take a look at what needs to be done to assign users to a role.

# Assigning users to a role 

Fortunately, the code for assigning a users to a role is very similar to assigning a users to a group.  Let's take a look at the `assignUsersToRoles()` function found in the `src/provisioning.js` file.


```javascript
async function assignUsersToRoles(users) {
  for (roleId of rolesApiProxy.getRoleIds()) {
    const userIdsInRole = users
      .filter((user) => roleId === user.role.id)
      .map((user) => user.id);

    if (userIdsInRole.length > 0) {
      try {
        await rolesApiProxy.addUsersToARole(roleId, userIdsInRole);
      } catch (e) {
        console.error(`Error in assignUsersToRoles`, users, e);
      }
    }
  }
};
```

The code first iterates through all of the roles currently retrieved as users were created.  It then goes through each role id in our list: `for (roleId of rolesApiProxy.getRoleIds())`, maps the users that were created to the roles associated with them.  Once this mapping occurs, it calls the `rolesApiProxy.addUsersToARole()` function in the `src/proxies/rolesapi.js` file.

```javascript
async function addUsersToARole(roleId, userIds) {
  let apiInstance = new platformClient.AuthorizationApi();

  try {
    await apiInstance.putAuthorizationRoleUsersAdd(roleId, userIds);
  } catch (e) {
    console.error(`Error occurred while trying add users to a role.`, roleId, userIds, e);
  }
};
```

The function creates a new instance of the `AuthorizationApi()` class.[3]  

```javascript
let apiInstance = new platformClient.AuthorizationApi();
```

Once we get an instance of this class, we use the `putAuthorizationRoleUserId()` to map the users to the role in Genesys Cloud.

```javascript
await apiInstance.putAuthorizationRoleUsersAdd(roleId, userIds);
```

# Summary
In this module looked at how:

1. To assign our created users to a chat group using the `Groups` API.
2. Use the`attempt/retry()` function to work around some of the idiosyncrasies of the `Groups` API.
3. Assigned a user to a role using the `Authorizations` Api.

The next module will be the final step in this developer starting guide, creating a WebRTC phone and assigning it to the user.

# References

1. [Groups API](https://developer.mypurecloud.com/api/rest/v2/groups/)
2. [Attempt](https://github.com/lifeomic/attempt)
3. [Authorization API](https://developer.mypurecloud.com/api/rest/v2/authorization/)