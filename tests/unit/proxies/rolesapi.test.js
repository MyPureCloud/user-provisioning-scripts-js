const rolesapi = require('../../../src/proxies/rolesapi');
const { v4: uuidv4 } = require('uuid');
const { AuthorizationApi } = require('purecloud-platform-client-v2');

jest.mock('purecloud-platform-client-v2');

const buildRoleMock = (role) => {
  return {
    entities: [
      {
        id: role.id,
        name: role.name,
        description: 'Directory - accountAdmin',
        permissions: [],
        permissionPolicies: [],
        userCount: 0,
        base: false,
        default: false,
        selfUri: `/api/v2/authorization/roles/${role.id}`,
      },
    ],
  };
};

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  AuthorizationApi.mockClear();
});

describe('When retrieving roles: ', () => {
  test('When a call to getRoleByName() and the underlying genesys cloud api throws an exception, we should return a null', async () => {
    AuthorizationApi.mockImplementation(() => {
      return {
        getAuthorizationRoles: (opts) => {
          throw new Error('`An error was encountered in the roles API');
        },
      };
    });

    const results = await rolesapi.getRoleByName('accountAdmin');
    expect(AuthorizationApi).toHaveBeenCalledTimes(1);
  });

  test('When a call to getRoleByName, it should a return the specificRole record ', async () => {
    const targetRole = { id: uuidv4(), name: 'accountAdmin' };

    const mock_call = buildRoleMock(targetRole, 1);

    expected_result = { id: targetRole.id, name: targetRole.name };

    AuthorizationApi.mockImplementation(() => {
      return {
        getAuthorizationRoles: (opts) => {
          return new Promise((resolve, reject) => {
            resolve(mock_call);
          });
        },
      };
    });

    let results = await rolesapi.getRoleByName('accountAdmin');
    expect(results).toBeDefined();
    expect(results.id).toBe(targetRole.id);
    expect(results.name).toBe(targetRole.name);

    results = await rolesapi.getRoleByName('accountAdmin');
    expect(AuthorizationApi).toHaveBeenCalledTimes(1); //Checking to make sure we read from the cache on the second call.

    expect(results).toBeDefined();
    expect(results.id).toBe(targetRole.id);
    expect(results.name).toBe(targetRole.name);
  });

  test('When addUsersToARole is called, we should add all of the users passed in should be mapped to their role and added to the role in Genesyscloud', async () => {
    const communicateRoleId = uuidv4();
    const agentRoleId = uuidv4();

    //Generating user ids so we can check them in our mock.
    const userId1 = uuidv4();
    const userId2 = uuidv4();

    //So with this mock we are going to check and see if the passed in users ids match what we are expecting.  If they don't we want to reject the request
    AuthorizationApi.mockImplementation(() => {
      return {
        putAuthorizationRoleUsersAdd: async (roleId, userIds) => {
          return new Promise((resolve, reject) => {
            if (
              userIds != null &&
              userIds.length == 2 &&
              userIds.includes(userId1) &&
              userIds.includes(userId2)
            ) {
              resolve(null);
            } else {
              reject(null);
            }
          });
        },
      };
    });

    await rolesapi.addUsersToARole(communicateRoleId, [userId1, userId2]);
    expect(AuthorizationApi).toHaveBeenCalledTimes(1);
  });
});
