# Introduction

Welcome to the Genesys CloudUser Provisioning developer starting guide. Our goal with this developer starting guide, is to provide working examples of how you can use the Genesys Cloud API and its corresponding SDKs to carry out common user management tasks. In this development guide we will build a node.js based script that will:

1. Authenticate the script using an OAuth 2.0 client credential grant with Genesys Cloud.
2. Create a user using the Genesys Cloud User API.
3. Assign the created user a chat group and a security role.
4. Create a WebRTC phone that will allow the created user account to make outbound calls.

In addition, to the mechanics involved with calling the API, this developer guide will walk through common development tasks you must think of when working with the Genesys Cloud APIs, including:

1.  API rate limiting
2.  API fair usage policies
3.  Relationship between Genesys Cloud Resources
4.  Eventual consistency and its role in persisting Genesys Cloud resources

# Architectural Overview

To demonstrate how to provision and manage users, we are going to create a user provisioning script that will create a user, assign them to a chat group, assign them to a role and then create a WebRTC phone for them. The diagram below highlights the general flow of this script along with the APIs it is calling.

![User Provisioning Architecture diagram]("mod_0_0_user_provisioning_arch_overview.png")

This diagram is meant to be a general map of the process and will be used throughout the developer guide. If we take a look at diagram above, everything starts with a CSV file full of user data. That file will be read by the `src/user-provisioning.js` file and launch the process of creating a user, assigning them a group and a role, and then creating a WebRTC phone for the user.

Each of these steps in the diagram map to a different module of this developer starting guide. Each module discusses what the code in script is doing in detail. (The numbers in the diagram map to the modules listed below). The modules for guide are:

1. Module 1: Authenticating and parsing the user file **(Need links to the modules here)**
2. Module 2: Creating users in Genesys Cloud **(Need links to the modules here)**
3. Module 3: Assigning users to chat groups and roles **(Need links to the modules here)**
4. Module 4: Creating a WebRTC phone **(Need links to the modules here)**

**Note**: In the diagram, along with each module we also list the Genesys Cloud JavaScript APIs we are going to use for that module.

# Pre-requisites

\
Node version 11 or higher.

# Installing and running the code

All code was run using node version 11. To run the code you need to:

1. Ensure that node 11 are higher is running on the machine where you will run this code.
2. Run `npm i` to install all of the packages and dependencies.
3. Setup a OAuth client credential grant in your Genesys Cloud organization. For purposes of this tutorial, the OAuth Client was configured with the `Communicate Admin` and `Telephony Admin` roles.

4. Set the following environment variables:

   - GENESYS_CLIENT_ID=<<YOUR CLIENT ID>>
   - GENESYS_CLIENT_SECRET=<<YOUR CLIENT SECRET>>

5. To run the test cases, you can run: `npm run test`
6. To run the actual code, you can change to the `src` directory and run: `node user-provisioning.js ../data/userdata.csv`

   **Note**: This code will create the users against your organization, assign them to a group and a role so please be aware of this and be careful. This code is a tutorial for how to provision users. It has minimal error handling and no rollback logic if something goes wrong.

7. As an alternative to the `user-provisioning.js` script, there is a `user-provisioning-service.js` script that will allow you to run the "create user" code found in the script as a REST-based service. To run the code as a REST service, you can change to the `src` directory and run `node user-provisioning-service.js.` Once the service is started you can create a user by using a `POST http://localhost:3000/user`. The body for the service call is shown below:

```javascript
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

# Code Organization

All of the code for this project is logged under the `src` directory. All unit tests are located under the `tests` directory.

```
    data/                   <= Contains a single csv file mapping out the user fields to map
    docs/                   <= The tutorial documents that will be rendered on our developer center.
    src/
      user-provisioning.js  <= The starting point for launching the process as batch script.
      user-provisioning-service.js <= The starting point for running the process as a REST service.
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
