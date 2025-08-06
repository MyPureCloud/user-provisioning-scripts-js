import csv from "csv-parser";
import fs from "fs";

import * as groupsApiProxy from "./proxies/groupsapi.js";
import * as usersApiProxy from "./proxies/usersapi.js";
import * as sitesApiProxy from "./proxies/sitesapi.js";
import * as phoneBaseApiProxy from "./proxies/phonebaseapi.js";
import * as phoneApiProxy from "./proxies/phoneapi.js";
import * as rolesApiProxy from "./proxies/rolesapi.js";
import * as stationsApiProxy from "./proxies/stationsapi.js";

/**
 * Takes a list of users (sourced from a csv file) and assigns them to a chat group
 * @param {*} users
 */
async function assignUsersToGroups(users) {
  for (const groupId of groupsApiProxy.getGroupIds()) {
    const userIdsInGroup = users
      .filter((user) => groupId === user.group.id)
      .map((user) => user.id);

    if (userIdsInGroup.length > 0) {
      try {
        await groupsApiProxy.addUsersToAGroup(groupId, userIdsInGroup);
      } catch (e) {
        console.error(`Error in assignUsersToGroup`, user, e);
      }
    }
  }
}

/*Takes a list of users (sourced from a csv file) and assigns them a role*/
async function assignUsersToRoles(users) {
  for (const roleId of rolesApiProxy.getRoleIds()) {
    const userIdsInRole = users
      .filter((user) => roleId === user.role.id)
      .map((user) => user.id);

    if (userIdsInRole.length > 0) {
      try {
        await rolesApiProxy.addUsersToARole(roleId, userIdsInRole);
      } catch (e) {
        console.error(`Error in assignUsersToRoles`, users, e);
      }
    }
  }
}

/**
 * Creates an indivdiual user in Genesys Cloud and then looks up additional information
 * for the user.  (e.g. group, site, role and phonebase)
 * @param {*} user
 */
async function createUser(user) {
  const createdUser = await usersApiProxy.createUser(user);
  user.id = createdUser.id;
  user.group = await groupsApiProxy.getGroupByName(user.GROUP);
  user.site = await sitesApiProxy.getSiteByName(user.SITENAME);
  user.role = await rolesApiProxy.getRoleByName(user.ROLE);
  user.phonebase = await phoneBaseApiProxy.getPhoneBaseByName(user.PHONEBASE);

  return user;
}

/**
 * Takes a list of users from the createUser() function and assigns the users to a group, a role and a site.
 * @param {*} users
 */
async function postUserCreation(users) {
  console.log(`Assigning users to groups`);
  await assignUsersToGroups(users);

  console.log(`Assigning users to roles`);
  await assignUsersToRoles(users);

  console.log(`Creating phones for users`);
  for (const user of users) {
    await phoneApiProxy.createWebRTCPhone(user);
    await stationsApiProxy.assignUserToWebRtcPhone(user.id);
  }
  console.log(`User creation complete`);
}

/*
  The createUsers function will parse the csv file in question and then create
  the user. 

  The code is going to use a scatter/pattern.  As each CSV record is read via a stream,
  it will call create the user.  After each createUser function is called, it will push a promise into the
  the resultsPromise array.  Then, once the file is completely process, the code will WAIT for all promises to resolve.
*/
async function createUsers(filename) {
  let resultPromises = [];

  console.log("Beginning user creation");
  fs.createReadStream(filename)
    .pipe(csv())
    .on("data", async (user) => {
      resultPromises.push(createUser(user));
    })
    .on("end", async () => {
      const users = await Promise.all(resultPromises); //We wait for all of the promises to resolve
      await postUserCreation(users);
    });
}

/**
 * Called from the Express web service. This function will create a single user and assign them
 * to a group, role and then create a webrtc phone for them.
 * @param {*} userRequest
 */
async function createUsersService(userRequest) {
  const user = {
    NAME: userRequest.name,
    EMAIL: userRequest.email,
    PASSWORD: userRequest.password,
    GROUP: userRequest.group,
    ROLE: userRequest.role,
    SITENAME: userRequest.sitename,
    PHONEBASE: userRequest.phonebase,
  };

  try {
    console.log(`Creating a user: ${JSON.stringify(user, null, 4)}`);
    const userResults = await createUser(user);

    const users = [userResults];
    console.log(`User created: ${JSON.stringify(userResults, null, 4)}`);
    await postUserCreation(users);
  } catch (e) {
    console.error(e);
  }
}

export {
  createUser,
  createUsers,
  createUsersService,
  assignUsersToGroups,
  assignUsersToRoles,
};
