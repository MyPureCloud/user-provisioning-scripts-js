import dotenv from "dotenv";
import authApiProxy from "./proxies/authenticateapi.js";
import { createUsersService } from "./provision.js";

//Used for the express HTTP listener
import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 3000;

dotenv.config();
const filename = process.argv[2];

const response = await authApiProxy.authenticate(
  process.env.GENESYS_CLIENT_ID,
  process.env.GENESYS_CLIENT_SECRET,
  process.env.GENESYS_ORG_REGION
);

console.log(`token: ${JSON.stringify(response, null, 4)}`);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/user", async (req, res) => {
  await createUsersService(req.body);
  res.statusCode = 202;
  res.send({ status: "Accepted" });
});

app.listen(port, () => {
  console.log(`User provisioning listening at http://localhost:${port}`);
});
