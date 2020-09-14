# User Provisioning

This is the prelimary outline for the fullblown tutorial. This outline will eventually be removed once the tutorial is completed.

## Introduction

1. What we are trying to accomplish
2. Architectural Overview
   - Authenticating the script
   - Creating the users
   - Assign the user to a group, roles and sites
   - Creating the WebRTC phones
3. Pre-requisites
   Node 11.
4. Installing the code
   NPM install
   Docker install

## Module 1: How the script runs and authenticates the user

1. Use an OAuth client id
2. Token returned is only good for the time on the clinet. If you were to write some kind
   of daemon you would not to inspect token and make sure the token is renewed.
3. Oauth client is limited to 300 calls a minute
4. Don't split the client ids to get around this limitation

## Module 2: Creating the users

1.  Looking up sites, groups and roles

- Logical name lookup vs. group lookup
- Caching the results. Single lookup vs. complete lookup
- Call out that emails will be sent to user and users will be forced to change their password before they can actually do anything
- Call out around deleting users

## Module 3: Assign the users to groups and roles

1. Assigning the users to a group

- What is a group
- In our code example the group alredy exists so we need to lookup the guiid
- Getting the group version
- Why are we submitting users to a group in batch.
  - Our groups API expects users to be submitted in a batch.
  - Submitting one user at a time can run into problems with per minute rate limits
  - Submitting one user at a time can into problems with our fair usage APIs.
  - We use re

2.  Assigning the user to a role. (Why do we need a role? Roles control permissions and we are using the communicare role to)

## Module 4: Create WebRTC Phones

1.  What is the relationship between phone bases -> phones and stations
2.  What is the relationship between sites -> phones <- users.
3.  Creating the phone
4.  Assigning the station
5.  Confirming everything works
