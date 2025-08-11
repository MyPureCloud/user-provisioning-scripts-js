jest.mock("../../src/proxies/groupsapi.js");
jest.mock("../../src/proxies/rolesapi.js");
jest.mock("../../src/proxies/usersapi.js");
jest.mock("../../src/proxies/phonebaseapi.js");
jest.mock("../../src/proxies/sitesapi.js");

import { v4 as uuidv4 } from "uuid";
import * as provision from "../../src/provision.js";
import * as groupsApiProxy from "../../src/proxies/groupsapi.js";
import * as rolesApiProxy from "../../src/proxies/rolesapi.js";
import * as usersApiProxy from "../../src/proxies/usersapi.js";
import * as phonebaseApiProxy from "../../src/proxies/phonebaseapi.js";
import * as sitesApiProxy from "../../src/proxies/sitesapi.js";

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  groupsApiProxy.addUsersToAGroup.mockClear();
  groupsApiProxy.getGroupIds.mockClear();

  rolesApiProxy.addUsersToARole.mockClear();
  rolesApiProxy.getRoleIds.mockClear();

  usersApiProxy.createUser.mockClear();
  groupsApiProxy.getGroupByName.mockClear();
  rolesApiProxy.getRoleByName.mockClear();
  sitesApiProxy.getSiteByName.mockClear();
});

describe("When processing user records: ", () => {
  test("When a call to createUser() is made, the user will created and then group, site, role, and phonebase info will be added to the user record", async () => {
    const mockCreateUserId = uuidv4();
    const mockGroupId = uuidv4();
    const mockSiteId = uuidv4();
    const mockRoleId = uuidv4();
    const mockPhoneBaseId = uuidv4();

    usersApiProxy.createUser = jest.fn(async (user) => {
      return new Promise((resolve) =>
        resolve({
          id: mockCreateUserId,
          name: user.NAME,
        })
      );
    });

    groupsApiProxy.getGroupByName = jest.fn(async (groupName) => {
      return new Promise((resolve) =>
        resolve({
          id: mockGroupId,
          name: groupName,
        })
      );
    });

    sitesApiProxy.getSiteByName = jest.fn(async (siteName) => {
      return new Promise((resolve) =>
        resolve({
          id: mockSiteId,
          name: siteName,
        })
      );
    });

    rolesApiProxy.getRoleByName = jest.fn(async (roleName) => {
      return new Promise((resolve) =>
        resolve({
          id: mockRoleId,
          name: roleName,
        })
      );
    });

    phonebaseApiProxy.getPhoneBaseByName = jest.fn(async (phoneBaseName) => {
      return new Promise((resolve) =>
        resolve({
          id: mockPhoneBaseId,
          name: phoneBaseName,
        })
      );
    });

    const userInput = {
      NAME: "jerry_rice@bellvue.com",
      GROUP: "Annuities",
      SITENAME: "North America",
      ROLE: "Communicate",
      PHONEBASE: "WebRtc Phone",
    };

    const userOutputs = await provision.createUser(userInput);
    expect(usersApiProxy.createUser).toHaveBeenCalledTimes(1);
    expect(groupsApiProxy.getGroupByName).toHaveBeenCalledTimes(1);
    expect(rolesApiProxy.getRoleByName).toHaveBeenCalledTimes(1);
    expect(sitesApiProxy.getSiteByName).toHaveBeenCalledTimes(1);
    expect(phonebaseApiProxy.getPhoneBaseByName).toHaveBeenCalledTimes(1);

    expect(userOutputs).toBeDefined();
    expect(userOutputs.id).toBe(mockCreateUserId);
    expect(userOutputs.group.id).toBe(mockGroupId);
    expect(userOutputs.role.id).toBe(mockRoleId);
    expect(userOutputs.site.id).toBe(mockSiteId);
    expect(userOutputs.phonebase.id).toBe(mockPhoneBaseId);
    expect(userOutputs.NAME).toBe(userInput.NAME);
    expect(userOutputs.GROUP).toBe(userInput.GROUP);
    expect(userOutputs.SITENAME).toBe(userInput.SITENAME);
    expect(userOutputs.ROLE).toBe(userInput.ROLE);
    expect(userOutputs.PHONEBASE).toBe(userInput.PHONEBASE);
  });

  test("When users are added to a group the users are sorted and placed into the correct group", async () => {
    const groupId1 = uuidv4();
    const groupId2 = uuidv4();
    const mockGroupIds = [groupId1, groupId2];
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const userId3 = uuidv4();

    const mockUsersFromFile = [
      { name: "Clark Kent", id: userId1, group: { id: groupId1 } },
      { name: "Lois Lane", id: userId2, group: { id: groupId1 } },
      { name: "Jimmy Olson", id: userId3, group: { id: groupId2 } },
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

  test("When users are added to a role the users are sorted and placed in the correct role", async () => {
    const roleId1 = uuidv4();
    const roleId2 = uuidv4();
    const mockRoleIds = [roleId1, roleId2];
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const userId3 = uuidv4();

    const mockUsersFromFile = [
      { name: "Clark Kent", id: userId1, role: { id: roleId1 } },
      { name: "Lois Lane", id: userId2, role: { id: roleId1 } },
      { name: "Jimmy Olson", id: userId3, role: { id: roleId2 } },
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
