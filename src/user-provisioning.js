const dotenv = require('dotenv');
const authApiProxy = require('./proxies/authenticateapi');
const provision = require('./provision');

dotenv.config();
const filename = process.argv[2];

//Main function.  Wrappering it with async to ensure that all async..await calls are properly fullfille

(async () => {
  console.log(`Starting the user provisioner to parse csv file ${filename}`);
  const token = await authApiProxy.authenticate(
    process.env.GENESYS_CLIENT_ID,
    process.env.GENESYS_CLIENT_SECRET
  );

  console.log(`token: ${JSON.stringify(token, null, '\t')}`);
  await provision.createUsers(filename);
})();
