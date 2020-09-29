const usersapi = require('../../../src/proxies/usersapi');
const { v4: uuidv4 } = require('uuid');
const { UsersApi } = require('purecloud-platform-client-v2');

jest.mock('purecloud-platform-client-v2');

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  UsersApi.mockClear();
});

describe('When working with users: ', () => {
  test('When a call to create users is made, the user should be created with the proper data in place', async () => {
    const mockUserData = {
      NAME: 'Billy Batson',
      EMAIL: 'billy@shazam.com',
      password: 'bl@ck@d@m!s@d0rk',
    };

    UsersApi.mockImplementation(() => {
      return {
        postUser: (user) => {
          return new Promise((resolve, reject) => {
            if (
              user.name === mockUserData.NAME &&
              user.email === mockUserData.EMAIL &&
              user.password === mockUserData.password
            ) {
              resolve(mock_call);
            } else {
              reject();
            }
          });
        },
      };
    });

    await usersapi.createUser(mockUserData);
    expect(UsersApi).toHaveBeenCalledTimes(1);
  });
});
