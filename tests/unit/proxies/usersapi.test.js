jest.mock('purecloud-platform-client-v2');

import * as usersapi from '../../../src/proxies/usersapi.js';
import { v4 as uuidv4 } from 'uuid';
import platformClient from 'purecloud-platform-client-v2';
const { UsersApi } = platformClient;

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
