const dotenv = require('dotenv');
const authApiProxy = require('./proxies/authenticateapi');
const provision = require('./provision');

dotenv.config();
const filename = process.argv[2];

//Main function
(async () => {
  console.log(`Starting the user provisioner to parse csv file ${filename}`);
  const token = await authApiProxy.authenticate(
                        process.env.GENESYS_CLIENT_ID, 
                        process.env.GENESYS_CLIENT_SECRET,
                        process.env.GENESYS_ORG_REGION);

  //console.log(`token: ${JSON.stringify(token, null, 4)}`);
  await provision.createUsers(filename);
})();
