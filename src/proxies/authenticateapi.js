const platformClient = require('purecloud-platform-client-v2');

/*
   The authenticate function is going to take the OAuth client id and secret and get a OAuth client credential token
   that will be used for all of the Javascript API calls.
*/
async function authenticate(clientId, clientSecret, orgRegion) {
  const client = platformClient.ApiClient.instance;

 //Optional remove the comment below to set the environment if accessing a region other than mypurecloud.com https://developer.genesys.cloud/devapps/sdk/javascript
 //client.setEnvironment(platformClient.PureCloudRegionHosts.eu_west_2);

  const environment = platformClient.PureCloudRegionHosts[orgRegion];
  
  if(environment) client.setEnvironment(environment);
  
  try {
    return await client.loginClientCredentialsGrant(clientId, clientSecret);
  } catch (e) {
    console.error(`Authentication error has occurred.`, e);
    process.exit(1);
  }
};

exports.authenticate = authenticate;
