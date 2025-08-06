import dotenv from "dotenv";
import authApiProxy from "./proxies/authenticateapi.js";
import { createUsers } from "./provision.js";

dotenv.config();
const filename = process.argv[2];

//Main function
(async () => {
  console.log(`Starting the user provisioner to parse csv file ${filename}`);
  const token = await authApiProxy.authenticate(
    process.env.GENESYS_CLIENT_ID,
    process.env.GENESYS_CLIENT_SECRET,
    process.env.GENESYS_ORG_REGION
  );

  console.log(`token: ${JSON.stringify(token, null, 4)}`);
  await createUsers(filename);
})();
