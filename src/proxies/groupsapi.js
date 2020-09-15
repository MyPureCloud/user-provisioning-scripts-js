const platformClient = require('purecloud-platform-client-v2');
const retry = require('@lifeomic/attempt').retry;

let groupsMap = new Map();
/*
    The getGroup() function will make a call to the platformClient.getGroups() call passing in target page number.
*/
const getGroup = async (pageNum) => {
  let opts = {
    pageSize: 50,
    pageNumber: pageNum,
  };

  let apiInstance = new platformClient.GroupsApi();

  try {
    results = await apiInstance.getGroups(opts);
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

/*
  The getGroups() call is going to retrieve all of the groups within the org and then map the logical name (e.g. the human readable name) to the Genesys Cloud Group GUID.  Later when we have to
  add a user to a group we are going to look up the Genesys Cloud GUID for the group by is logical name.  Note:  You have to be aware of whether or not the API call might expect to returns the results using
  pagination and code accordingly to.  In the code below, I paginate over each page, looking up the values for all pages.  I flatten the results into 1 big list and then build a map containing just the logical 
  name for the group and the GUID.
*/
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

const getGroupByName = async (groupName) => {
  if (groupsMap[groupName] != null) {
    return groupsMap[groupName];
  } else {
    await getGroups();
    return {...groupsMap[groupName]};
  }
};

/*
   Adds a user to a group.  Note: I am using retry logic on this call because we can have multiple users (remember we are asynchronous)
   and GenesysCloud uses an optimistic lock scheme to protect from multiple threads updating the same record at the same time.  
   So, if we get any kind of error on our calls, we will retry 5 times with an expotential back off on the calls
*/
const addUsersToAGroup = async (groupId, userIds) => {
  let apiInstance = new platformClient.GroupsApi();

  /*If we need to retry we always need to reread the groupVersion for the record*/
  try {
    const groupVersion = (await apiInstance.getGroup(groupId)).version;
    const results = await retry(
      async (context) => {
        await apiInstance.postGroupMembers(groupId, {
          memberIds: userIds,
          version: groupVersion,
        });
      },
      {delay: 200, factor: 2, maxAttempts: 5}
    );
  } catch (e) {
    console.log(
      `Error occurred while trying create group for user ${JSON.stringify(
        userIds,
        null,
        '\t'
      )}, error: ${JSON.stringify(e, null, '\t')}`
    );
  }
};

/* Return a list of Group Ids*/
const getGroupIds = () => {
  const groupIds = new Set(
    Object.keys(groupsMap).map((key) => groupsMap[key].id)
  );
  return [...groupIds];
};

exports.getGroupIds = getGroupIds;
exports.getGroupByName = getGroupByName; //Not ideal because the getGroupId has an implicit dependenc on getGroups
exports.addUsersToAGroup = addUsersToAGroup;
