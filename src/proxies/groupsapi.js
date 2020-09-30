const platformClient = require('purecloud-platform-client-v2');
const { retry } = require('@lifeomic/attempt');
const { response } = require('express');

let groupsMap = {};

/*
    The getGroup() function will make a call to the platformClient.getGroups() call passing in target page number.
*/
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

/*
  The getGroups() call is going to retrieve all of the groups within the org and then map the logical name (e.g. the human readable name) to the Genesys Cloud Group GUID.  Later when we have to
  add a user to a group we are going to look up the Genesys Cloud GUID for the group by is logical name.  Note:  You have to be aware of whether or not the API call might expect to returns the results using
  pagination and code accordingly to.  In the code below, I paginate over each page, looking up the values for all pages.  I flatten the results into 1 big list and then build a map containing just the logical 
  name for the group and the GUID.
*/
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

async function getGroupByName(groupName) {
  if (groupsMap[groupName] == null) {
    await getGroups();
  }
  return { ...groupsMap[groupName] };
}


/*
   Adds a user to a group.  Note: I am using retry logic on this call because we can have multiple users (remember we are asynchronous)
   and GenesysCloud uses an optimistic lock scheme to protect from multiple threads updating the same record at the same time.  
   So, if we get any kind of error on our calls, we will retry 5 times with an expotential back off on the calls
*/
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

      /* We are doing a retry here not so much because we are afraid of rate-limiting, but because the groups api
         exposes a version field.  If we get an error we are going to assume it is a versioning error and re-read the 
         group version and try to resubmit the error.
      */
      { delay: 200, factor: 2, maxAttempts: 5 }
    );
  } catch (e) {
    console.error(`Error occurred while trying create group for user.`, groupid, userIds, e);
  }
};

/* Return a list of Group Ids*/
function getGroupIds() {
  return Object.values(groupsMap).map(value => value.id)
};

exports.getGroupIds = getGroupIds;
exports.getGroupByName = getGroupByName;
exports.addUsersToAGroup = addUsersToAGroup;
