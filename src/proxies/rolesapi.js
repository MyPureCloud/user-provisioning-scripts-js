const platformClient = require('purecloud-platform-client-v2');
const { retry } = require('@lifeomic/attempt');

let rolesMap = {};

/*
    The getAuthorizationRoleByLogicalName() will look up a role based on its logical name from GenesysCloud from Genesys Cloud 
*/
async function getAuthorizationRoleByLogicalName(logicalName) {
  let opts = {
    name: logicalName,
  };

  let apiInstance = new platformClient.AuthorizationApi();

  try {
    const results = await apiInstance.getAuthorizationRoles(opts);

    if (results != null) {
      const role = {
        id: results.entities[0].id,
        name: results.entities[0].name,
      };

      rolesMap[role.name] = role;
      return { ...role };
    }

    return null;
  } catch (error) {
    console.log(`Error while retrieving role with name: ${logicalName}`);
    return null;
  }
};

/* Retrieves a role based on is role name*/
async function getRoleByName(roleName) {
  if (!(roleName in rolesMap)) { await getAuthorizationRoleByLogicalName(roleName); }
  return rolesMap[roleName];
};

/* Return a list of roles for all roles returned*/
function getRoleIds() {
  return Object.values(rolesMap).map(value => value.id)
};

async function addUsersToARole(roleId, userIds) {
  let apiInstance = new platformClient.AuthorizationApi();

  try {
    await retry(
      async (context) => {
        await apiInstance.putAuthorizationRoleUsersAdd(roleId, userIds);
      },
      { delay: 200, factor: 2, maxAttempts: 5 }
    );
  } catch (e) {
    console.error(`Error occurred while trying add users to a role.`, roleId, userIds, e);
  }
};

exports.getRoleIds = getRoleIds;
exports.getRoleByName = getRoleByName;
exports.addUsersToARole = addUsersToARole;
