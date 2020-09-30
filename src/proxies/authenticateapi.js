const platformClient = require('purecloud-platform-client-v2');

/*
   The authenticate function is going to take the OAuth client id and secret and get a OAuth client credential token
   that will be used for all of the Javascript API calls.
*/
async function authenticate(clientId, clientSecret) {
  const client = platformClient.ApiClient.instance;

  try {
    return await client.loginClientCredentialsGrant(clientId, clientSecret);
  } catch (e) {
    console.error(`Authentication error has occurred.`, e);
    process.exit(1);
  }
};

exports.authenticate = authenticate;
