const platformClient = require('purecloud-platform-client-v2');

/*
   The authenticate function is going to take the OAuth client id and secret and get a OAuth client credential token
   that will be used for all of the Javascript API calls.
*/
const authenticate = async (clientId, clientSecret) => {
  const client = platformClient.ApiClient.instance;

  try {
    const authData = await client.loginClientCredentialsGrant(
      clientId,
      clientSecret
    );
    return authData;
  } catch (e) {
    console.log(`Authentication error has occurred -> ${e}`);
    process.exit();
  }
};

exports.authenticate = authenticate;
