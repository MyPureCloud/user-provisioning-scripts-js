# Overview

In this module we are going to cover the second part of user-provisioning process, user creation.

![User Provisioning Module 2 Architecture diagram]("resources/images/mod_2_1_user_provisioning_arch_overview.png")

For the provisioning script in this developer starting guide, we need to take 3 actions to create a user.
The diagram below illustrates these 3 steps.

![User Provisioning Module 2 Creating the user diagram]("resources/images/mod_2_2_parsing_user_creation_process.png")

1.  **Parse the user records out of a CSV file**. This is going to involve very little code as we will be using the `csv-parser` [1] library to parse our CSV file containing the user data.

2.  **Create the user record in Genesys Cloud**. Once we have parsed a user record from the CSV file, we will use the Genesys Cloud `User` api to create the record.

3.  **Looking up Genesys Cloud Objects by Logical Name**. This provisioning does more then create the just create the user record. It also assigns the user to a group, assigns them a role and creates a WebRTC phone. When we do these actions, we will to look up several Genesys Cloud objects by their logical name and then use data from theses objects to finish the user-provisioning tasks. We will do this by logical name lookup immediately after we create the user record.

So all of the code that carries out the user provisioning process is found in the `src/provisioning.js` file. The key function that we are going to look at from this modules is the `createUsers()` function. The code for this function is shown below

```javascript
const createUsers = async (filename) => {
  let resultPromises = [];

  console.log('Beginning user creation');
  fs.createReadStream(filename)
    .pipe(csv())
    .on('data', async (user) => {
      resultPromises.push(
        usersApiProxy.createUser(user).then(async (userResult) => {
          //Here is where we create the user.
          user['userId'] = userResult.id;
          user['groupId'] = (
            await groupsApiProxy.getGroupByName(user.GROUP)
          ).id;
          user['site'] = await sitesApiProxy.getSiteByName(user.SITENAME);
          user['roleId'] = (await rolesApiProxy.getRoleByName(user.ROLE)).id;
          user['phoneBase'] = await phoneBaseApiProxy.getPhoneBaseByName(
            user.PHONEBASE
          );

          return user;
        })
      );
    })
    .on('end', async () => {
      //NOTE THERE IS MORE CODE HERE THAT WILL BE COVERED IN THE NEXT FUNCTION
    });
};
```

Lets go ahead and start unpacking the code above.

# Parsing the CSV File

To parse the CSV file we are going to use the `csv-parser` library. This library will take a csv filename and will parse each record in the file into a JavaScript object containing the data. The keys in the JavaScript object will be derived from the first-line of the csv file If you look in the `data` directory of this project, you will find an example csv file call `userdata.csv`. Now the csv-parser library does not read the whole record in at a time. Instead, it will read one record at at time and will trigger a `data`.

```javascript
fs.createReadStream(filename)
    .pipe(csv())
    .on('data', async (user) => { ... }
```

When this `data` event is triggered. it will invoke the callback passed into the `.on('data')` event handler.

```javascript
 .on('data', async (user) => {
      resultPromises.push(
        //We push the promise heres
        usersApiProxy.createUser(user).then(async (userResult) => { ... }
   ...
        )
 }
```

There is a lot going on in this code. When a `data` event is received we are going to create a user using the `user` record passed into the call and the `usersApiProxy.createUser()` function.

```javascript
usersApiProxy.createUser(user).then(async (userResult) => { ... }
```

The `createUser()` function is an asynchronous function and after it is done processing the creation of the user record, we need to do additional work to prep the individual user for next step work. Since the `createUser()` function is asynchronous we do not want to hold up the node event-loop waiting for the the `createUser()` call to complete. So we are going to collect all of the promises from the call into array called `resultPromises`. The end result of this, is that as we process user creations, we will end up with a collection of promises() that must be fulfilled before we can do any additional work.

So lets look at what is actually involved with creating a user account in the Genesys Cloud platform.

# Creating the user record in Genesys cloud

The actual creation of the user occurs in the `src/proxies/userapi.js` class. Shown below is the `createUser()` function from `userapi.js`.

```Javascript
const createUser = async (userInfo) => {
  apiInstance = new platformClient.UsersApi();

  const user = {
    name: userInfo.NAME,
    email: userInfo.EMAIL,
    password: userInfo.PASSWORD,
  };

  try {
    const result = await apiInstance.postUsers(user);
    return result;
  } catch (e) {
    console.log(
      `Error has occurred while trying to create user ${
        userInfo.name
      }, error: ${JSON.stringify(e)}`
    );

    return null;
  }
};
```

The first thing we do in the above code is get an instance of the `UsersApi` object.

```javascript
apiInstance = new platformClient.UsersApi();
```

Then we have to build a JavaScript object containing the values we want to pass to the create api call on the `UserApis` object.

```JavaScript
const user = {
    name: userInfo.NAME,
    email: userInfo.EMAIL,
    password: userInfo.PASSWORD,
};
```

We then call the `apiInstance.postUsers()` function from our `apiInstance` object (which is of type `UsersApi`).

```javascript
try {
   const result = await apiInstance.postUsers(user);
   return result;
 } catch (e) {
   console.log(
     `Error has occurred while trying to create user ${
       userInfo.name
     }, error: ${JSON.stringify(e)}`
   );

   return null;
```

Since this call is an asynchronous call, we have to use an `await` keyword and then surround the call to the `apiInstance.postUsers(user)` with a `try..catch{}` statement. If we successfully retrieve a value, we return it immediately. We then log an error out to the console and let a `null` value be returned from the `createUser()` function call.

**Note**: For purposes of this developer starting guide, we always return `null` on a failed function call and then filter out in the calling code any null values. In a real application, you might want to have a more robust error handling process. So, please do not use the error handling done in the code as an idiomatic example of how to handle errors.

### Callout: Deleting Users

Congratulations, if you ran this script and the `postUsers()` api was called, you will have created some users. Now, lets say you want to delete these users and re-run this script. There a few things you need to know about how Genesys Cloud deals with user deletion.

1. The Genesys Cloud `UserApi deleteUser()` function (which the Genesys Cloud UI uses) does not actually "hard" delete the user account. Instead the Genesys Cloud server "soft" deletes the user record.
2. Instead the user's status is marked as deleted and the user does not show up in the UI unless you explicitly search using the "delete" state in the UI.
3. Users that are "soft" deleted will not be purged from the platform and will remain their in perpetuity.
4. While a user create does generate a unique GUIID, the email address used in the username is also considered unique and if you try to "re-create" a user with the same email as a user who is in a deleted status, the create user code will fail with an HTTP 400 status code and a message about conflicting users.
5. If you want to restore the user you need to update the user using a `patchUser()` call in the SDK (or the route in the API) and the `state` field on the passed in `User` objects to be in `active` state.

# Looking up Genesys Cloud Objects by Logical Name

So far we have covered the creation of a Genesys Cloud user using the API. However, we want to do more then create a user, we also want to add that user to a chat group, assign them a security role and create a WebRTC phone for the user. In our csv file, we reference the group, the role, site and phonebase information by a logical name that is understandable to a human being. However, in Genesys Cloud almost all API interactions involving Genesys Cloud resources are accessed through a GUID. GUID (or UUID) is an acronym for 'Globally Unique Identifier' (or 'Universally Unique Identifier'). It is a 128-bit integer number used to identify resources. In Genesys Cloud we use GUID's to provide a unique key for created objects.

So, if we revisit our `createUser()` function from the `src/provision.js` script you can see that right after we create the user, we add some additional fields to the user object that will be user later on when we have to assign the user to groups and a role and create a WebRTC phone.

```javascript
usersApiProxy.createUser(user).then(async (userResult) => {
  //Here is where we create the user.
  user['userId'] = userResult.id;                                                   //Map the GUID for the create user back to the original user object
  user['groupId'] = (await groupsApiProxy.getGroupByName(user.GROUP)).id;           //Lookup the group GUID by logical name
  user['site'] = await sitesApiProxy.getSiteByName(user.SITENAME);                  //Lookup the site  by logical name
  user['roleId'] = (await rolesApiProxy.getRoleByName(user.ROLE)).id;               //Lookup the role GUID by logical name
  user['phoneBase'] = await phoneBaseApiProxy.getPhoneBaseByName(user.PHONEBASE);   //Lookup the phonebase by logical name

  return user;
}
```

Each of these lookups are calling to functions that were written to call the Genesys Cloud JavaScript SDK. We are not going to go through each of these calls in detail.
Instead we are only going to look at the `groupsApiProxy.getGroupByName()` and the `sitesApiProxy.getSiteByName()`. The reason for this is that the API for looking up Group information
follows a slightly different pattern then the site, role and phonebase calls. Looking at the site lookup code will allow you to understand the role and phonebase lookups.

The Group API does not provide the ability to lookup records by a logical name field. Therefore, we have to lookup all the groups in the organization and then search through the results
for the group we are targeting. This style of lookup requires that we have to understand how to paginate across a Genesys Cloud result set. The Sites, Role, and Phonebase APIs allow us to search
for a specific record by name.

During the course of the discussion around looking up logical names, we will also cover why it is important to cache your lookups to help optimize how many Genesys Cloud API calls you are making per minute
(e.g. API Rate Limiting) and how many calls you are making overall (e.g. API Fair Use)

## Looking up Group Name

We are going to start our exploration of looking up Group Name using the Groups API[3]. To begin our discussion, we are going to look at the `getGroupByName()` function found inside the `src/proxies/groupsapi.js` file.

```javascript
const getGroupByName = async (groupName) => {
  if (groupsMap[groupName] != null) {
    return groupsMap[groupName];
  } else {
    await getGroups();
    return {...groupsMap[groupName]};
  }
};
```

In the function, we are checking to see if group name we are trying to look up already exists in a Javascript literal object called `groupsMap`. If the value already exists in the groupsMap instance, we will return the value we will return the instance without calling out to Genesys Cloud. If the value does not exist, we are then going to lookup all of the groups in the org by calling the `getGroups()` function in the `groupsapi.js` file

**Note**: This `groupsMap` variable is scoped outside of the function and is considered global (and private to the namespace). The declaration for groupsMap and is declared at the top of the `groupsapi.js` file.

The `getGroups()` function is shown here:

```javascript
async function getGroups() {
  let groups = [];

  //Do the first call and push the results to an array
  group = await getGroup(1);
  group != null ? groups.push(group.entities) : null;

  //If the count is greater then 1 then go through and look up the result of the pages.
  if (group != null && group.pageCount > 1) {
    for (let i = 2; i <= group.pageCount; i += 1) {
      group = await getGroup(i);
      group != null ? groups.push(group.entities) : null;
    }
  }

  groups
    .flat(1) //Each result contains an array of records.  flat(1) will flatten this array of arrays one level deep
    .filter((value) => value != null)
    .map((value) => {
      //Map through each result and extrace the logical name and the guid into a map
      groupsMap[value.name] = value;
    });

  //Cloning the internal representation to keep the data immutable
  return {...groupsMap};
}
```

So the getGroups() function is a pretty big function, but it's primary purpose is to really handle pages of data that might returned from our Genesys Cloud API. The first line of this function is going to declare an array that will hold the results for all of the calls out to the groups API.

```javascript
let groups = [];
```

Next, we are going to retrieve our first page of data. To do this we are get to call function in the `groupsapi.js` file call getGroup(), passing in as a parameter the page number we want to retrieve.

```javascript
group = await getGroup(1);
```

The `getGroup()` function looks up a single page of group data for the organization. The `getGroup()` function is shown below.

```javascript
const getGroup = async (pageNum) => {
  const opts = {
    pageSize: 100,
    pageNumber: pageNum,
  };

  const apiInstance = new platformClient.GroupsApi();

  try {
    const results = await apiInstance.getGroups(opts);
    return results;
  } catch (e) {
    console.log(
      `Error while retrieving group for page number: ${pageNum}: ${JSON.stringify(
        e,
        null,
        '\t'
      )}`
    );
    return null;
  }
};
```

In this function we are setting up a JavaScript literal object (called `opts`) that will hold query parameters that can be used to control how much data we can retrieve per page and the page number we want to receive.

```javascript
const opts = {
  pageSize: 100,
  pageNumber: pageNum,
};
```

Genesys Cloud will allow you to return between 25 - 100 records per page. When retrieving data for a script or service, I recommend retrieving the maximum number of records per page to cut down on the number of API calls you have to make. After you have set up you query options, the call to retrieve the page is pretty straightforward, with a `GroupsApi` object being instantiated and the `getGroups()` method on the instance being called.

```javascript
const apiInstance = new platformClient.GroupsApi();

try {
  const results = await apiInstance.getGroups(opts);
  return results;
} catch (e) {
  console.log(
    `Error while retrieving group for page number: ${pageNum}: ${JSON.stringify(
      e,
      null,
      '\t'
    )}`
  );
  return null;
}
```

This code will return one page of data Group data that looks this:

```javascript

```

### Optimizing your API usage through caching

### Pagination and Genesys Cloud

## Looking up Site Name

### API Rate Limiting

### API Fair Use

<br/><br/>

# Summary

# References

1. [csv-parser library](https://www.npmjs.com/package/csv-parser)
2. [Genesys Cloud User API Docs](https://developer.mypurecloud.com/api/rest/v2/users/)
3. [Genesys Cloud Groups API Docs](https://developer.mypurecloud.com/api/rest/v2/groups/)
