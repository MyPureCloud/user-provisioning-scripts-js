const platformClient = require('purecloud-platform-client-v2');
const retry = require('@lifeomic/attempt').retry;

let rolesMap = new Map();

/*
    The getAuthorizationRoleByLogicalName() will look up a role based on its logical name from GenesysCloud from Genesys Cloud 
*/
const getAuthorizationRoleByLogicalName = async (logicalName) => {
  let opts = {
    name: logicalName,
  };

  let apiInstance = new platformClient.AuthorizationApi();

  try {
    const results = await apiInstance.getAuthorizationRoles(opts);

    const role = {
      id: results.entities[0].id,
      name: results.entities[0].name,
    };

    if (results != null) {
      rolesMap[role.name] = role;
      return {...role};
    }

    return null;
  } catch (err) {
    console.log(
      `Error while retrieving role with name: ${logicalName}: ${JSON.stringify(
        err,
        null,
        '\t'
      )}`
    );
    return null;
  }
};

/* Retrieves a role based on is role name*/
const getRoleByName = async (roleName) => {
  const results = rolesMap[roleName];
  if (results != null) {
    return results;
  } else {
    const resultsLookup = await getAuthorizationRoleByLogicalName(roleName);
    return resultsLookup;
  }
};

/* Return a list of roles for all roles returned*/
const getRoleIds = () => {
  const roleIds = new Set(Object.keys(rolesMap).map((key) => rolesMap[key].id));
  return [...roleIds];
};

/*
   Adds a user to a role.  Note, I am using retry logic on this call because we can have multiple users (remember we are asynchronous)
   and GenesysCloud uses an optimistic lock scheme to protect from multiple threads updating the same record at the same time.  
   So, if we get any kind of error on our calls, we will retry 5 times with an expotential back off on the calls
*/
const addUsersToARole = async (roleId, userIds) => {
  let apiInstance = new platformClient.AuthorizationApi();

  try {
    const results = await retry(
      async (context) => {
        await apiInstance.putAuthorizationRoleUsersAdd(roleId, userIds);
      },
      {delay: 200, factor: 2, maxAttempts: 5} //Need to log errors on retry
    );
  } catch (e) {
    console.log(
      `Error occurred while trying add users to a role ${JSON.stringify(
        userIds,
        null,
        '\t'
      )}, error: ${JSON.stringify(e, null, '\t')}`
    );
  }
};

exports.getRoleIds = getRoleIds;
exports.getRoleByName = getRoleByName;
exports.addUsersToARole = addUsersToARole;
