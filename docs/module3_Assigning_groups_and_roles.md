## Module 3: Assigning users to chat groups and roles

1. Assigning the users to a group

- What is a group
- In our code example the group alredy exists so we need to lookup the guid
- Getting the group version
- Why are we submitting users to a group in batch.
  - Our groups API expects users to be submitted in a batch.
  - Submitting one user at a time can run into problems with per minute rate limits
  - Submitting one user at a time can into problems with our fair usage APIs.

2.  Assigning the user to a role. (Why do we need a role? Roles control permissions and we are using the communicare role to)
