const platformClient = require('purecloud-platform-client-v2');

async function createUser(userInfo) {
  apiInstance = new platformClient.UsersApi();

  const user = {
    name: userInfo.NAME,
    email: userInfo.EMAIL,
    password: userInfo.password,
  };

  try {
    const result = await apiInstance.postUsers(user);
    return result;
  } catch (e) {
    console.log(
      `Error has occurred while trying to create user ${
        userInfo.name
      }, error: ${JSON.stringify(e)}`
    );

    return null;
  }
}

exports.createUser = createUser;
