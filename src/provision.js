const csv = require('csv-parser');
const fs = require('fs');

const platformClient = require('purecloud-platform-client-v2');
const groupsApiProxy = require('./proxies/groupsapi');
const usersApiProxy = require('./proxies/usersapi');
const sitesApiProxy = require('./proxies/sitesapi');
const phoneBaseApiProxy = require('./proxies/phonebaseapi');
const phoneApiProxy = require('./proxies/phoneapi');
const rolesApiProxy = require('./proxies/rolesapi');
const stationsApiProxy = require('./proxies/stationsapi');

/*Takes a list of users (sourced from a csv file) and assigns them to a chat group*/
const assignUsersToGroups = async (users) => {
  const groupIds = groupsApiProxy.getGroupIds();

  groupIds.forEach(async (groupId) => {
    //Find each user in a group
    const userIdsInGroup = users
      .filter((user) => groupId === user.groupId)
      .map((user) => user.userId);

    if (userIdsInGroup.length > 0) {
      try {
        await groupsApiProxy.addUsersToAGroup(groupId, userIdsInGroup);
      } catch (e) {
        console.log(
          `Error in assignUsersToGroup: ${JSON.stringify(e, null, '\t')}`
        );
      }
    }
  });
};

/*Takes a list of users (sourced from a csv file) and assigns them a role*/
const assignUsersToRoles = async (users) => {
  const roleIds = rolesApiProxy.getRoleIds();

  roleIds.forEach(async (roleId) => {
    //Find each user in a role
    const userIdsInRole = users
      .filter((user) => roleId === user.roleId)
      .map((user) => user.userId);

    if (userIdsInRole.length > 0) {
      try {
        await rolesApiProxy.addUsersToARole(roleId, userIdsInRole);
      } catch (e) {
        console.log(
          `Error in assignUsersToRoles: ${JSON.stringify(e, null, '\t')}`
        );
      }
    }
  });
};

/*
  The loadUsers function will parse the csv file in question and then create
  the user. 

  The code is going to use a scatter/pattern.  As each CSV record is read via a stream,
  it will call create the user.  After each CREATE API is called, it will push a promise into the
  the resultsPromise array.  Then, once the file is completely process, the code will WAIT for all promises to resolve.
*/
const createUsers = async (filename) => {
  let resultPromises = [];

  console.log('Beginning user creation');
  fs.createReadStream(filename)
    .pipe(csv())
    .on('data', async (user) => {
      resultPromises.push(
        //We push the promise heres
        usersApiProxy.createUser(user).then(async (userResult) => {
          //Here is where we create the user.
          user['userId'] = userResult.id;
          user['groupId'] = (
            await groupsApiProxy.getGroupByName(user.GROUP)
          ).id;
          user['site'] = await sitesApiProxy.getSiteByName(user.SITENAME);
          user['roleId'] = (await rolesApiProxy.getRoleByName(user.ROLE)).id;
          user['phoneBase'] = await phoneBaseApiProxy.getPhoneBaseByName(
            user.PHONEBASE
          );

          return user;
        })
      );
    })
    .on('end', async () => {
      const users = await Promise.all(resultPromises); //We wait for all of the promises to resolve
      console.log(`User creation is completed`);

      console.log(`Assigning users to groups`);
      await assignUsersToGroups(users);

      console.log(`Assigning users to roles`);
      await assignUsersToRoles(users);

      console.log(`Creating phones for users`);
      users.map(async (user) => {
        await phoneApiProxy.createWebRTCPhone(user);
        await stationsApiProxy.assignUserToWebRtcPhone(user.userId);
      });
    });
};

const createUsersService = async (userRequest) => {
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
    console.log(`Creating a user`);
    const userResults = await usersApiProxy.createUser(user);
    user.userId = userResults.id;
    user.groupId = (await groupsApiProxy.getGroupByName(user.GROUP)).id;
    user.site = await sitesApiProxy.getSiteByName(user.SITENAME);
    user.roleId = (await rolesApiProxy.getRoleByName(user.ROLE)).id;
    user.phoneBase = await phoneBaseApiProxy.getPhoneBaseByName(user.PHONEBASE);

    const users = [user];
    console.log(`Assigning users to groups`);
    await assignUsersToGroups(users);

    console.log(`Assigning users to roles`);
    await assignUsersToRoles(users);

    console.log(`Creating phones for users`);
    users.map(async (userRecord) => {
      await phoneApiProxy.createWebRTCPhone(userRecord);
      await stationsApiProxy.assignUserToWebRtcPhone(userRecord.userId);
    });
  } catch (e) {
    console.log(e);
  }
};

exports.createUsers = createUsers;
exports.createUsersService = createUsersService;
exports.assignUsersToGroups = assignUsersToGroups;
exports.assignUsersToRoles = assignUsersToRoles;
