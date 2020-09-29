One of the biggest challenges in getting started working in Genesys Cloud (and even in the telephony field) is learning the language and terms used within the platform.  For this developer starting guide we will define the following terms as this:

1. **User**:  A user is any individual who can log into the Genesys Cloud Application. 

2. **Group**:  Groups are communities within your organization based on common skills, relationships, location, or other information.  A group will have a chat room associated with it. A user can belong to one or more groups.

3. **Role**: A role represents a set of permissions a user is allowed to perform within in Genesys Cloud.  For instance, if you have agent role assigned to the user, the individual would be able to make and receive phone calls.  A supervisor role has permission to run certain reports.  While Genesys Cloud has a set of pre-defined roles, an organization can setup new roles.

4. **Site**:  A site is the home for a collection of phones.  A site will define routing and telephony rules for the phones within it.  A phone will be assigned to a site and then a phone can be assigned to user.  In order to create a phone, you have to know what site it is going to belong to.

5.  **Phonebase**:  A phonebase is a template describing the telephony properties for a specific model of phone.  When you create a phone you need to specify the phonebase for the phone.  The WebRTC phonebase used in this example is a standard phonebase included within Genesys Cloud.  After a phone is created within Genesys Cloud, many of the telephony properties for the phone can be overwritten.

6. **WebRTC Phone**.  A WebRTC phone is a specific type of phone that can be assigned and created for the user.  It is a non-physical phone that allows the user to make and received phone calls from within Genesys Cloud using the WebRTC protocol.  Phones can only be assigned to one user at a time.