const groupsapi = require('../../../src/proxies/groupsapi');
const utils = require('../../utils');
const {GroupsApi} = require('purecloud-platform-client-v2');

jest.mock('purecloud-platform-client-v2');

const buildMultiGroupMock = (groups, pageCount) => {
  return {
    entities: [
      {
        id: groups[0].id,
        name: groups[0].name,
        dateModified: '2020-09-08T13:23:55Z',
        memberCount: 10,
        state: 'active',
        version: 520,
        type: 'official',
        rulesVisible: true,
        visibility: 'public',
        chat: {
          jabberId: '5f3883f8130b94165bf37a3c@conference.hollywoo.orgspan.com',
        },
        owners: [
          {
            id: '3c57c76a-3e96-424a-a6c1-1706b64bf9dc',
            selfUri: '/api/v2/users/3c57c76a-3e96-424a-a6c1-1706b64bf9dc',
          },
        ],
        selfUri: `/api/v2/groups/${groups[0].id}`,
      },
      {
        id: groups[1].id,
        name: groups[1].name,
        dateModified: '2020-09-06T13:38:43Z',
        memberCount: 22,
        state: 'active',
        version: 48,
        type: 'official',
        rulesVisible: true,
        visibility: 'public',
        chat: {
          jabberId: '58053781faf9ec1b45431e35@conference.hollywoo.orgspan.com',
        },
        owners: [
          {
            id: '9ed7d9f6-0c59-4360-ac54-40dd35eb9c2f',
            selfUri: '/api/v2/users/9ed7d9f6-0c59-4360-ac54-40dd35eb9c2f',
          },
        ],
        selfUri: `/api/v2/groups/${groups[1].id}`,
      },
    ],
    pageSize: 25,
    pageNumber: 1,
    total: 9,
    firstUri: '/api/v2/groups?pageSize=25&pageNumber=1',
    selfUri: '/api/v2/groups?pageSize=25&pageNumber=1',
    lastUri: '/api/v2/groups?pageSize=25&pageNumber=1',
    pageCount: pageCount,
  };
};

const buildGroupMock = (group) => {
  return {
    entities: [
      {
        id: group.id,
        name: group.name,
        dateModified: '2020-08-31T20:41:30Z',
        memberCount: 70,
        state: 'active',
        version: 311,
        type: 'official',
        rulesVisible: true,
        visibility: 'public',
        chat: {
          jabberId: '5f3883f8130b94165bf37a3c@conference.hollywoo.orgspan.com',
        },
        owners: [
          {
            id: '3c57c76a-3e96-424a-a6c1-1706b64bf9dc',
            selfUri: '/api/v2/users/3c57c76a-3e96-424a-a6c1-1706b64bf9dc',
          },
        ],
        selfUri: `/api/v2/groups/${group.id}`,
      },
    ],
  };
};

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  GroupsApi.mockClear();
});

describe('When retrieving groups: ', () => {
  test('When a call to getGroups() and the underlying genesys cloud api throws an exception, we should not get that page of data in our final results ', async () => {
    GroupsApi.mockImplementation(() => {
      return {
        getGroups: (opts) => {
          throw 'An error was encountered';
        },
      };
    });

    const results = await groupsapi.getGroupByName('Discourse');
    expect(results).toBeDefined();
    expect(Object.keys(results)).toHaveLength(0);
    expect(GroupsApi).toHaveBeenCalledTimes(1);
  });

  test('When a call to getGroupByName(), it should a return the specific group record ', async () => {
    const targetGroup = {id: utils.generateUUID(), name: 'Annuities'};

    const mock_call = buildGroupMock(targetGroup, 1);

    expected_result = {id: targetGroup.id, name: targetGroup.name};

    GroupsApi.mockImplementation(() => {
      return {
        getGroups: (opts) => {
          return new Promise((resolve, reject) => {
            resolve(mock_call);
          });
        },
      };
    });

    let results = await groupsapi.getGroupByName('Annuities');
    expect(results).toBeDefined();
    expect(results.id).toBe(targetGroup.id);
    expect(results.name).toBe(targetGroup.name);

    results = await groupsapi.getGroupByName('Annuities');
    expect(GroupsApi).toHaveBeenCalledTimes(1); //Checking to make sure we read from the cache on the second call.

    expect(results).toBeDefined();
    expect(results.id).toBe(targetGroup.id);
    expect(results.name).toBe(targetGroup.name);
  });

  test('When a call to getGroupByName() and there are multiple pages returned by the genesys cloud api, we should return an aggregated resultset', async () => {
    const groups_page_1 = [
      {id: utils.generateUUID(), name: 'Annuities'},
      {id: utils.generateUUID(), name: 'Discourse'},
    ];

    const groups_page_2 = [
      {id: utils.generateUUID(), name: 'IRA'},
      {id: utils.generateUUID(), name: '401K'},
    ];

    const mock_call_1 = buildMultiGroupMock(groups_page_1, 2);
    const mock_call_2 = buildMultiGroupMock(groups_page_2, 2);

    expected_results = {
      'Annuities': groups_page_1[0].id,
      'Discourse': groups_page_1[1].id,
      'IRA': groups_page_2[0].id,
      '401K': groups_page_2[1].id,
    };

    callCount = 0;

    GroupsApi.mockImplementation(() => {
      return {
        getGroups: (opt) => {
          callCount++;
          return new Promise((resolve, reject) => {
            if (callCount === 2) {
              resolve(mock_call_2);
            } else {
              resolve(mock_call_1);
            }
          });
        },
      };
    });

    const discourseResults = await groupsapi.getGroupByName('Discourse');
    const iraResults = await groupsapi.getGroupByName('IRA');
    expect(discourseResults.id).toBe(groups_page_1[1].id);
    expect(iraResults.id).toBe(groups_page_2[0].id);

    expect(GroupsApi).toHaveBeenCalledTimes(2);
  });

  test('When addUsersToAGroup() is called, we should add all of the users passed in should be mapped to their group and added to the role in GenesysCloud', async () => {
    const annuitiesGroupId = utils.generateUUID();
    const iraGroupId = utils.generateUUID();

    //Generating user ids so we can check them in our mock.
    const userId1 = utils.generateUUID();
    const userId2 = utils.generateUUID();

    //So with this mock we are going to check and see if the passed in users ids match what we are expecting.  If they don't we want to reject the request
    GroupsApi.mockImplementation(() => {
      return {
        getGroup: async (groupId) => {
          return new Promise((resolve, request) => {
            resolve({version: '100'});
          });
        },
        postGroupMembers: async (groupId, body) => {
          return new Promise((resolve, reject) => {
            if (
              body.memberIds != null &&
              body.memberIds.length == 2 &&
              body.memberIds.includes(userId1) &&
              body.memberIds.includes(userId2)
            ) {
              resolve(null);
            } else {
              reject(null);
            }
          });
        },
      };
    });

    await groupsapi.addUsersToAGroup(annuitiesGroupId, [userId1, userId2]);
    expect(GroupsApi).toHaveBeenCalledTimes(1);
  });
});
