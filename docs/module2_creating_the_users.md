# Overview

In this module we are going to cover the second part of user-provisioning process: user creation.

![User Provisioning Module 2 Architecture diagram]("resources/images/mod_2_1_user_provisioning_arch_overview.png")

For the provisioning script in this developer starting guide, we need to take 3 actions to create a user.
The diagram below illustrates these 3 steps.

![User Provisioning Module 2 Creating the user diagram]("resources/images/mod_2_2_parsing_user_creation_process.png")

1.  **Parse the user records out of a CSV file**. This is going to involve very little code as we will be using the `csv-parser` [1] library to parse our CSV file containing the user data.

2.  **Create the user record in Genesys Cloud**. Once we have parsed a user record from the CSV file, we will use the Genesys Cloud `User` api to create the record.

3.  **Look up Genesys Cloud Objects by a logical name**. This provisioning does more then create the just create the user record. It also assigns the user to a group, assigns them a role and creates a WebRTC phone. When we do these actions, we will to look up several Genesys Cloud objects by their logical name and then use data from these objects to finish the user-provisioning tasks. 

All of the code that carries out the user provisioning process is found in the `src/provisioning.js` file. The key function that we are going to look at from this modules is the `createUsers()` function. The code for this function is shown below.

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

Let's go ahead and start unpacking this code.

# Parsing the CSV File

To parse the CSV file we are going to use the `csv-parser` library. This library will take a csv filename and will parse each record in the file into a JavaScript object containing the data. The keys in the JavaScript object will be derived from the first-line of the csv file. If you look in the `data` directory of this project, you will find an example csv file called `userdata.csv`. The csv-parser library does not read the whole record in at a time. Instead, it will read one record at at time and will send a `data` event.

```javascript
fs.createReadStream(filename)
    .pipe(csv())
    .on('data', async (user) => {resultPromises.push(createUser(user))
```

When a `data` event is received we are going to create a user using the `user` record passed into the call and the `createUser()` function found in the `src/provisioning.js file`.

```javascript
async function createUser(user) {
  const createdUser = await usersApiProxy.createUser(user);
  user.id = createdUser.id;
  user.group = await groupsApiProxy.getGroupByName(user.GROUP);
  user.site = await sitesApiProxy.getSiteByName(user.SITENAME);
  user.role = await rolesApiProxy.getRoleByName(user.ROLE);
  user.phonebase = await phoneBaseApiProxy.getPhoneBaseByName(user.PHONEBASE);

  return user;
}
```

The `createUser()` function is an asynchronous function that carries out the creation of the user in Genesys Cloud. After as user is created, we will need to lookup several additional pieces of information by the logical names of the object stored in the CSV file (e.g. GROUP, SITENAME, ROLE, PHONEBASE).  We will be walking through how to look up various Genesys Cloud objects by their logical name later on in this document.  

//TODO **need a link to the glossary file.**
**Note**: As reminder, the glossary file contains the business definitions for site, group, role and phonebase 

Let's look at what is actually involved with creating a user account in the Genesys Cloud platform.

# Creating the user record in Genesys cloud

The actual creation of the user occurs in the `src/proxies/userapi.js` class. Shown below is the `createUser()` function from `userapi.js`.

```Javascript
const platformClient = require('purecloud-platform-client-v2');

async function createUser(userInfo) {
  apiInstance = new platformClient.UsersApi();

  const user = {
    name: userInfo.NAME,
    email: userInfo.EMAIL,
    password: userInfo.password,
  };

  try {
    return await apiInstance.postUsers(user);
  } catch (e) {
    console.error(`Error has occurred while trying to create user ${userInfo.name}`, e);

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
    return await apiInstance.postUsers(user);
  } catch (e) {
    console.error(`Error has occurred while trying to create user ${userInfo.name}`, e);

    return null;
  }
```

Since this call is an asynchronous call, we have to use an `await` keyword and then surround the call to the `apiInstance.postUsers(user)` with a `try..catch{}` statement. If we successfully retrieve a value, we return it immediately. We then log an error out to the console and let a `null` value be returned from the `createUser()` function call.

**Note**: For purposes of this developer starting guide, we always return `null` on a failed function call and then filter out in the calling code any null values. In a real application, you might want to have a more robust error handling process. So, please do not use the error handling done in the code as an idiomatic example of how to handle errors.

### Callout: Deleting Users

Congratulations, if you ran this script and the `postUsers()` api was called, you will have created some users. Now, lets say you want to delete these users and re-run this script. There a few things you need to know about how Genesys Cloud deals with user deletion.

1. The Genesys Cloud `UserApi deleteUser()` function (which the Genesys Cloud UI uses) does not actually "hard" delete the user account. Instead the Genesys Cloud server "soft" deletes the user record.
2. A soft delete marks the user's status as deleted.  The user does not show up in the UI unless you explicitly search using the "delete" state in the UI.
3. Users that are "soft" deleted will not be purged from the platform and will remain their in perpetuity.
4. While a user create does generate a unique GUIID, the email address used in the username is also considered unique and if you try to "re-create" a user with the same email as a user who is in a deleted status, the create user code will fail with an HTTP 400 status code and a message about conflicting users.
5. If you want to restore the user you need to update the user using a `patchUser()` call in the SDK (or the route in the API) and the `state` field on the passed in `User` objects to be in `active` state.

# Looking up Genesys Cloud Objects by Logical Name

So far we have covered the creation of a Genesys Cloud user using the API. However, we want to do more then create a user, we also want to add that user to a chat group, assign them a security role and create a WebRTC phone for the user. In our csv file, we reference the chat group, the role, site and phonebase information by a logical name that is understandable to a human being. However, in Genesys Cloud almost all API interactions involving Genesys Cloud resources are accessed through a GUID. GUID (or UUID) is an acronym for 'Globally Unique Identifier' (or 'Universally Unique Identifier'). It is a 128-bit integer number used to identify resources. In Genesys Cloud we use GUID's to provide a unique key for created objects.

If we revisit our `createUser()` function from the `src/provision.js` script you can see that right after we create the user, we add some additional fields to the user object that will be user later on when we have to assign the user to groups and a role and create a WebRTC phone.

```javascript
  user.id = createdUser.id;
  user.group = await groupsApiProxy.getGroupByName(user.GROUP);
  user.site = await sitesApiProxy.getSiteByName(user.SITENAME);
  user.role = await rolesApiProxy.getRoleByName(user.ROLE);
  user.phonebase = await phoneBaseApiProxy.getPhoneBaseByName(user.PHONEBASE);
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
async function getGroupByName(groupName) {
  if (groupsMap[groupName] == null) {
    await getGroups();
  }
  return { ...groupsMap[groupName] };
}

```

In the function, we are checking to see if group name we are trying to look up already exists in a Javascript literal object called `groupsMap`. If the value already exists in the groupsMap instance, we will return the value we will return the instance without calling out to Genesys Cloud. If the value does not exist, we are then going to lookup all of the groups in the org by calling the `getGroups()` function in the `groupsapi.js` file

**Note**: This `groupsMap` variable is scoped outside of the function and is considered global (and private to the namespace). The declaration for groupsMap and is declared at the top of the `groupsapi.js` file.

The `getGroups()` function is shown here:

```javascript
async function getGroups() {
  let groups = [];

  let i = 1;
  let pageCount = 0;
  do {
    const group = await getGroup(i);

    if (group != null) {
      pageCount = group.pageCount;
      groups.push(group.entities);
    }

    i++;
  }
  while (i <= pageCount);

  groups
    .flat(1)
    .filter((value) => value != null)
    .forEach((value) => { groupsMap[value.name] = value; });

  //Cloning the internal representation to keep the data immutable
  return { ...groupsMap };
}
```

So the `getGroups()` function is a pretty big function, but it's primary purpose is to really handle pages of data that might returned from our Genesys Cloud API. The first line of this function is going to declare an array that will hold the results for all of the calls out to the groups API.

```javascript
let groups = [];
```

Next, we are going to retrieve our data data. To do this we are get to call `getGroup(`) function in the `groupsapi.js`, passing in as a parameter the page number we want to retrieve.

```javascript
let i = 1;
  let pageCount = 0;
  do {
    const group = await getGroup(i);

    if (group != null) {
      pageCount = group.pageCount;
      groups.push(group.entities);
    }

    i++;
  }
  while (i <= pageCount);
  ```

In the above chunk of code, we use a `do..while{}` loop to retrieve the first page of data using the `getGroup()` function to look up a single page of group data for the organization.  The `getGroup()` function is shown below.

```javascript
async function getGroup(pageNum) {
  const opts = {
    pageSize: 100,
    pageNumber: pageNum,
  };

  const apiInstance = new platformClient.GroupsApi();

  try {
    return await apiInstance.getGroups(opts);
  } catch (e) {
    console.log(`Error while retrieving group for page number: ${pageNum}: ${JSON.stringify(e, null, 4)}`);
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
try {
    return await apiInstance.getGroups(opts);
  } catch (e) {
    console.log(`Error while retrieving group for page number: ${pageNum}: ${JSON.stringify(e, null, 4)}`);
    return null;
  }
```

This code will return one page of data group data that looks this:

```javascript
{
  entities: [
        {
          //group data
        },
        {
          //group data 
        }  
      ],
  pageSize: 100,
  pageNumber: 1,
  total: 2,
  firstUri: '/api/v2/groups?pageSize=100&pageNumber=1',
  selfUri: '/api/v2/groups?pageSize=100&pageNumber=1',
  lastUri: '/api/v2/groups?pageSize=100&pageNumber=1',
  pageCount: 1,
}
```

Each individual group record returned in the call is contained within the `entities` attribute.  We are not going to look at the individual fields returned from the `getGroups()`.  These values are documented in the API call.  Instead we want to look at the pagination values returned in the above record.  When iterating through the pages we care about the `pageNumber` and `pageCount` fields.  The `pageNumber` field represents the page we are currently on.  The `pageCount` field is the total number of pages that are available to be returned.  So in the `getGroups()`. To retrieve all of the group data we get the first page of data and then we check to see if the first page is null. Remember, a `null` value in this context means an error occurred looking up the record.  If the value is not `null` we push the first page into the `groups` array and set our pageCount variable being used in our `do..while{}` look to be the same value as `group.pageCount()`.

```javascript
 if (group != null) {
      pageCount = group.pageCount;
      groups.push(group.entities);
}
```

As we retrieve a page we add the results to the `groups` array.  Once we have retrieved all of the pages, we should now have an a arrays within the `groups` array.  Remember, each page of data retrieves X number of records from the Genesys Cloud.  To make this array more searchable, we are going to flatten the array so that it is one-dimensional instead of two.  We will then filter out any `null` values and add an entry to the `groupsMap` object using the group name as the key and storing the individual record as a value.

```javascript
groups
    .flat(1)
    .filter((value) => value != null)
    .forEach((value) => { groupsMap[value.name] = value; });
```

The last action we take in the `getGroups()` function is to return a copy of the `groupsMap`object back to the caller of the function.

```javascript
return {...groupsMap};
```  

### Optimizing your API usage through caching
In the function `getGroupByName()` you can see we are storing records in a JavaScript literal object to avoid repeated calls to the `Groups` API.  Why are we caching this data instead of just calling the `Groups` API every time we need to read the data.  There are three reasons:

1.  **Performance**.  Every time we make a distributed call, we are adding overhead to our application because the code has to call "off-box" to retrieve data.  If the dataset you are using is relatively small and does not change on a regular basis (e.g. group names-> to group ids), it makes more sense to cache the data if the values in the cache going to be "read" on a regular basis.

2.  **API Rate Limits**.  Genesys Cloud imposes an API rate limit of 300 calls per minute per OAuth client. This rate limit may change in the future so always reference the API rate limit documents on the developer center before beginning any new development efforts.[4]  Rate limiting is put in place by Genesys Cloud to prevent a single customer from negatively impacting the platform by issuing a high volume of calls in a a very short time period.  Be aware that when your OAuth client hits a rate limit, it will start receiving 429 HTTP status codes.  Your application should back off on its call volume until the rate limits have subsided. Again reference the developer center [4] for more specifics on rate limits and back-off strategies. 

3.  **API Fair Usage Policies**.  While API rate limits protect the Genesys Cloud platform from abusive bursts of traffic in a very short-time period, Genesys Cloud also implements a monthly fair use policy on all API calls to ensure a consistent experience for all customers.  The API fair usage policies are based on the number and type of Genesys Cloud seats you have purchased.  The goal is not to monetize the number of API calls, but rather ensure that Genesys Cloud computing resources are made fairly available to all customers.  Unlike the API rate limits, the API fair usage policies is shared amongst all of your OAuth Clients.  

**Note:**  Unlike the API rate limits, if you go over your allocated fair usage policy, you will be assessed overage charges.  For the details around the overage charges, please refer to the Genesys Cloud API Fair Usage policy. [5]  If you would like to see how much API usage you have consumed for the month, please refer to the API View Usage [5] page in the Genesys Cloud help documents. 

## Looking up Site by a logical name

In the previous sections, we talked about how to look up group information and how to navigate the pagination model used in the Genesys Cloud APIs.  We are now going to look at how we can retrieve site information by a logical name.  As stated earlier in this module, we are **not** going to walkthrough how to lookup site information, because the role and phonebase calls follow the exact same patterns as the site lookup.

So lets begin by looking at the `getSiteByName()` function in the `src/proxies/sitesapi.js` file.

```javascript
async function getSiteByName(siteName) {
  if (!(siteName in sitesMap)) { await getSiteByLogicalName(siteName) }
  return { ...sitesMap[siteName] };
};

```

This code follows the same pattern as the groups lookup.  It checks to see if the site value is in a cache (e.g. ```sitesMap``) and if it can not find the value in the cache, it attempts to look it up via the Genesys Cloud `Sites` api.  The difference between the groups and sites lookup can be seen inside the `getSiteByNameLogicalName()` function call.

```javascript
async function getSiteByLogicalName(logicalName) {
  const opts = {
    name: logicalName,
  };

  const apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  try {
    const sites = await apiInstance.getTelephonyProvidersEdgesSites(opts);

    if (sites != null) {
      const site = {
        id: sites.entities[0].id,
        name: sites.entities[0].name,
        primarySites: sites.entities[0].primarySites,
      };

      sitesMap[site.name] = site;
      return { ...site };
    }

    return null;
  } catch (err) {
    console.error(`Error while retrieving site with name: ${logicalName}.`, err);
    return null;
  }
};
```

In the object code we define a Javascript literal Object called `opts` with a single parameter called `name`.

```javascript
  const opts = {
    name: logicalName,
  };
```

Most of the Genesys Cloud APIs that return a collection of core Genesys Cloud resources (e.g. sites, roles, phonebase) will provide additional query parameters that will allow you to pull back only instances that match the values specified in the query parameters. The ```name``` parameter is the most common parameter on these APIs. So when we call the Sites API [6], by passing in the above Object, we will get back the following result:

```javascript
{
  entities: [
        {
          //site data
        }  
      ],
  pageSize: 25,
  pageNumber: 1,
  total: 1,
  firstUri: '/api/v2/sites?pageSize=100&pageNumber=1',
  selfUri: '/api/v2/sites?pageSize=100&pageNumber=1',
  lastUri: '/api/v2/sites?pageSize=100&pageNumber=1',
  pageCount: 1,
}
```

To pull out the site record, we need to pull the first record form the `entities` object on the returned payload.

```javascript
const site = {
  id: sites.entities[0].id,
  name: sites.entities[0].name,
  primarySites: sites.entities[0].primarySites,
};
```

The site data is then placed in the `sitesMap` and the `site` object is returned.

```javascript 
sitesMap[site.name] = site;
return { ...site };
}
```

At this point we have gone through all of the code we needed to create a Genesys Cloud user and retrieved all the data necessary to add that a user to a group, assign them a role and then create a WebRTC phone for them.  In the next module, we are going to show the APIs needed to assign the created users to groups and roles.

# Summary
This module covered the tasks involved with creating a user in Genesys Cloud.  Specifically we:

1. Used the User API to create a user.
2. Examined how to lookup up Genesys Cloud objects by a logical name. 
3. Reviewed where and when we should use caching.  We also looked at the Genesys Cloud API Rate limits and Genesys Cloud Fair Use policy.
4. Reviewed how and when to use pagination when dealing with lookups that return large amounts of data.
5. Reviewed how to use query parameters with Genesys Cloud objects to perform single item lookups of common Genesys Cloud objects (e.g. site, roles, etc...)

# References

1. [csv-parser library](https://www.npmjs.com/package/csv-parser)
2. [Genesys Cloud User API Docs](https://developer.mypurecloud.com/api/rest/v2/users/)
3. [Genesys Cloud Groups API Docs](https://developer.mypurecloud.com/api/rest/v2/groups/)
4. [Genesys Cloud API Rate Limits](https://developer.mypurecloud.com/api/rest/rate_limits.html)
5. [Genesys Cloud API Fair Usage Policies](https://help.mypurecloud.com/articles/api-overage-charge/)
6. [Genesys Cloud Sites API Docs](https://developer.mypurecloud.com/api/rest/v2/sites/)
