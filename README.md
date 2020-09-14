# Introduction

Welcome to the user-provisioning-scripts-js repo. This repo contains a node.js-based command line script that will take a comma-separated

1. Create a user in the Genesys Cloud platform.
2. Assign the user to a group within Genesys Cloud.
3. Assign the user to a specific role within Genesys Cloud.
4. Create a WebRTC phone for the user and then assign the newly created phone as the default station for the user.

## Installing and running the code

All code was run using node version 14.3.0. The code should work with Node 11 and above. To run the code you need to first:

1. Ensure that node 11 are higher is running on your server.
2. Run npm i to install all of the pacakges and dependencies.
3. Setup a OAuth Client Credential grant in your OAUTH instance. For purposes of this tutorial, the OAuth Client was configured with the Communicate Admin and Telephony Admin roles.

4. Set the following environment variables:

   - GENESYS_CLIENT_ID=<<YOUR CLIENT ID>>
   - GENESYS_CLIENT_SECRET=<<YOUR CLIENT SECRET>>

   **Note**: You can also set the above environment variables in .env file.

5. To run the test cases, you can run: npm run test
6. To run the actual code, you can change to the src directory and run: node index.js ../data/userdata.csv

   **Note**: This code will create the users against your organization, assign them to a group and a role so please be aware of this and be careful. This code is a tutorial for how to provision users. It has mininmal error handling and no rollback logic if something goes wrong.

## Code Organization

    data/                   <= Contains a single csv file mapping out the user fields to map
    docs/                   <= The tutorial documents that will be rendered on our developer center.
    src/
      index.js              <= The starting point for launching the process.
      provisiong.js         <= The "business logic" that carries out the overall process
      proxies/              <= Each major API has their own proxy class that abstracts away
                               how we call each GenesysCloud API.  This allows us to hide
                               whether we call things with the Javascript API, REST API or whether we want to wrapper code.
    tests/
      unit/                 <= All of our test cases we use to test our application.  All
                               our unit tests are written using the Jest framework.
