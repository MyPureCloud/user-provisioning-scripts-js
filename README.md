# Introduction

Welcome to the user-provisioning-scripts-js repo. This repo contains a node.js-based command line script that will take a comma-separated

1. Create a user in the Genesys Cloud platform.
2. Assign the user to a group within Genesys Cloud.
3. Assign the user to a specific role within Genesys Cloud.
4. Create a WebRTC phone for the user and then assign the newly created phone as the default station for the user.

## Installing and running the code

All code was run using node version 14.3.0. The code should work with Node 11 and above. To run the code you need to first:

1. Ensure that node 14 or higher is running on your server.
2. Run `npm i` to install all of the packages and dependencies.
3. Setup a OAuth client Credential grant in your OAUTH instance. For the purposes of this tutorial, an OAuth client was configured with the Communicate Admin and Telephony Admin roles.

4. Set the following environment variables:

   - GENESYS_CLIENT_ID=`<<YOUR CLIENT ID>>`
   - GENESYS_CLIENT_SECRET=`<<YOUR CLIENT SECRET>>`
   - GENESYS_ORG_REGION=`<<YOUR GENESYS CLOUD ORG REGION>>`

   **Notes**:
   - The GENESYS_ORG_REGION is the AWS Region where your Genesys Cloud org is hosted (eg. us-east-1). For more info on the regions and how to identify them, consult the [Platform API](https://developer.mypurecloud.com/api/rest/#authentication) page.
   - You can also set the above environment variables in .env file.

5. To run the test cases, you can run: `npm run test`
6. To run the actual code, you can change to the src directory and run: `node user-provisioning.js ../data/userdata.csv`

   **Notes**:
   - This code creates a user in your actual organization and assigns the user to a group and a role. Be aware that this tutorial code shows how to provision users in your own environment. It has minimal error handling and no rollback logic if something goes wrong.
   - As an alternative, the `user-provisioning-service.js` script enables you to run the create user code as a REST-based service. See Step 7, below, for instructions.

7. To use the alternative `user-provisioning-service.js` script, which enables you to run the script's create-user code as a REST-based service, use the following procedure:
  a. Change to the `src` directory and then run `node user-provisioning-service.js.`
  b. After the service is started, send a `POST http://localhost:3000/user` request. The request body for the service call is shown below:

```json
{
  "NAME": "value",
  "EMAIL": "value",
  "PASSWORD": "value",
  "GROUP": "value",
  "ROLE": "value",
  "SITENAME": "value",
  "PHONEBASE": "value"
}
```

## Code Organization

All of the code for this project is logged under the src tree. All unit tests are located under the test directory.

```
    data/                   <= Contains a single csv file mapping out the user fields to map
    src/
      index.js              <= The starting point for launching the process.
      provisiong.js         <= The "business logic" that carries out the overall process
      proxies/              <= Each major API has their own proxy class that abstracts away
                               how we call each GenesysCloud API.  This allows us to hide
                               whether we call things with the Javascript API, REST API or whether we want to wrapper code.
    tests/
      unit/                 <= All of our test cases we use to test our application.  All
                               our unit tests are written using the Jest framework.
```
