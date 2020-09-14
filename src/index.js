const dotenv = require('dotenv');
const authApiProxy = require('./proxies/authenticateapi');
const provision = require('./provision');

//Main function.  Wrappering it with async to ensure that all async..await calls are properly fullfilled
(async () => {
  dotenv.config();
  const filename = process.argv[2];

  const accessToken = await authApiProxy.authenticate(
    process.env.GENESYS_CLIENT_ID,
    process.env.GENESYS_CLIENT_SECRET
  );

  await provision.createUsers(filename);
})();
