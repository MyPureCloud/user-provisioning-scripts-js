const utils = require('../utils');
const provision = require('../../src/provision');
const groupsApiProxy = require('../../src/proxies/groupsapi');
const rolesApiProxy = require('../../src/proxies/rolesapi');

jest.mock('../../src/proxies/groupsapi');
jest.mock('../../src/proxies/rolesapi');

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  groupsApiProxy.addUsersToAGroup.mockClear();
  groupsApiProxy.getGroupIds.mockClear();

  rolesApiProxy.addUsersToARole.mockClear();
  rolesApiProxy.getRoleIds.mockClear();
});

describe('When processing user records: ', () => {
  test('When users are added to a group the users are sorted and placed into the correct group', async () => {
    const groupId1 = utils.generateUUID();
    const groupId2 = utils.generateUUID();
    const mockGroupIds = [groupId1, groupId2];
    const userId1 = utils.generateUUID();
    const userId2 = utils.generateUUID();
    const userId3 = utils.generateUUID();

    const mockUsersFromFile = [
      {name: 'Clark Kent', userId: userId1, groupId: groupId1},
      {name: 'Lois Lane', userId: userId2, groupId: groupId1},
      {name: 'Jimmy Olson', userId: userId3, groupId: groupId2},
    ];

    groupsApiProxy.getGroupIds = jest.fn(() => {
      return mockGroupIds;
    });

    groupsApiProxy.addUsersToAGroup = jest.fn(
      async (groupId, userIdsInGroup) => {
        return new Promise((resolve, reject) => {
          if (
            (groupId === groupId1 &&
              userIdsInGroup.includes(userId1) &&
              userIdsInGroup.includes(userId2)) ||
            (groupId === groupId2 && userIdsInGroup.includes(userId3))
          ) {
            resolve(null);
          } else {
            reject(null);
          }
        });
      }
    );

    await provision.assignUsersToGroups(mockUsersFromFile);
    expect(groupsApiProxy.getGroupIds).toHaveBeenCalledTimes(1);
    expect(groupsApiProxy.addUsersToAGroup).toHaveBeenCalledTimes(2);
  });

  test('When users are added to a role the users are sorted and placed in the correct role', async () => {
    const roleId1 = utils.generateUUID();
    const roleId2 = utils.generateUUID();
    const mockRoleIds = [roleId1, roleId2];
    const userId1 = utils.generateUUID();
    const userId2 = utils.generateUUID();
    const userId3 = utils.generateUUID();

    const mockUsersFromFile = [
      {name: 'Clark Kent', userId: userId1, roleId: roleId1},
      {name: 'Lois Lane', userId: userId2, roleId: roleId1},
      {name: 'Jimmy Olson', userId: userId3, roleId: roleId2},
    ];

    rolesApiProxy.getRoleIds = jest.fn(() => {
      return mockRoleIds;
    });

    rolesApiProxy.addUsersToARole = jest.fn(async (roleId, userIdsInRole) => {
      return new Promise((resolve, reject) => {
        if (
          (roleId === roleId1 &&
            userIdsInRole.includes(userId1) &&
            userIdsInRole.includes(userId2)) ||
          (roleId === roleId2 && userIdsInRole.includes(userId3))
        ) {
          resolve(null);
        } else {
          reject(null);
        }
      });
    });

    await provision.assignUsersToRoles(mockUsersFromFile);
    expect(rolesApiProxy.getRoleIds).toHaveBeenCalledTimes(1);
    expect(rolesApiProxy.addUsersToARole).toHaveBeenCalledTimes(2);
  });
});
