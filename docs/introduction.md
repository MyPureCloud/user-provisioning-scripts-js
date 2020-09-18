# Introduction

Welcome to our User Provisioning developer guide. Our goal with this developer guide, is to provide working examples of how you can use the Genesys Cloud SDK to carry out common user management tasks. In this development guide we will build a node.js based script that will:

1. Authenticate the script using an OAuth Client Grant for Genesys Cloud.
2. Create a user using the Genesys Cloud User API.
3. Assign the created user a chat group a security role.
4. Create a WebRTC phone that will allow the created user account to make outbound calls.

In addition, to the mechanics involved with calling the API, this developer guide will walk through common development tasks you must think of when working with the GenesysCloud APIs, including:

1.  API rate limiting
2.  API fair usage policies
3.  Dealing with eventual consistency

# Architectural Overview

\
The User Provisioning developer guide is a node.js script that parses a CSV file of user information and then calls a variety of Genesys Cloud APIs to create users. The diagram below highlights the general flow of the script along with the APIs it is calling.

![User Provisioning Architecture diagram]("resources/images/user_provisioning_arch_intro.png")

This diagram is meant to be a general map of the process and will be used throughout the developer guide. If we take a look at diagram above, everything starts with a CSV file full of user data. That file will be read by the `src/index.js` file and launch the process of creating a user, assigning them a group and a role, and then creating a WebRtc phone for the user.

Each of these steps map to a different module that discusses what the code script is doing in detail. (The numbers in the diagram map to the modules listed below). The modules for this developer guide are:

1. Module 1: Authenticating and parsing the user file **(Need links to the modules here)**
2. Module 2: Creating users in Genesys Cloud **(Need links to the modules here)**
3. Module 3: Assigning users to chat groups and roles **(Need links to the modules here)**
4. Module 4: Creating a Webrtc phone **(Need links to the modules here)**

Below each module is a list of the GenesysCloud JavaScript APIs we are going to use in the module.

# Pre-requisites

\
Node version 11 or higher.

# Installing and running the code

All code was run using node version 14.3.0. The code should work with Node 11 and above. To run the code you need to first:

1. Ensure that node 11 are higher is running on your server.
2. Run `npm i` to install all of the pacakges and dependencies.
3. Setup a OAuth Client Credential grant in your OAUTH instance. For purposes of this tutorial, the OAuth Client was configured with the Communicate Admin and Telephony Admin roles.

4. Set the following environment variables:

   - GENESYS_CLIENT_ID=<<YOUR CLIENT ID>>
   - GENESYS_CLIENT_SECRET=<<YOUR CLIENT SECRET>>

   **Note**: You can also set the above environment variables in .env file.

5. To run the test cases, you can run: `npm run test`
6. To run the actual code, you can change to the src directory and run: `node index.js ../data/userdata.csv`

   **Note**: This code will create the users against your organization, assign them to a group and a role so please be aware of this and be careful. This code is a tutorial for how to provision users. It has mininmal error handling and no rollback logic if something goes wrong.

# Code Organization

\
All of the code for this project is logged under the src tree. All unit tests are located under the test directory.

```
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
```

# Additional Material

1. Creating an [OAuth Client Credential Grant](https://help.mypurecloud.com/articles/create-an-oauth-client/)
2. Genesys [JavaScript SDK](https://developer.mypurecloud.com/api/rest/client-libraries/javascript/)
