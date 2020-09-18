# Overview

This module will cover how to authenticate the user-provisioning script with Genesys Cloud using the JavaScript API.

In terms of the overall architecture, the diagram below will show the specific spot in the process we will be working in for this module:

![User Provisioning Module 1 diagram]("resources/images/user_provisioning_auth_module1.png")

## Authenticating with the Genesys Cloud

Genesys Cloud uses the OAuth2 2.0 specification [1] to handle all authentication requests coming from a third-party applications or services. For the user provisioning script, we will be using an OAuth 2.0 client (credential grant). The OAuth credential grant is the appropriate form of authentication to use when using an application, script or service needs to communicate with Genesys Cloud. The diagram below illustrates how an OAuth 2.0 client credential grant occurs within Genesys Cloud.

![User Provisioning Module 1 diagram]("resources/images/user_provisioning_outh_client_credential_grant_module.png")

You can see that using an OAuth credential grant requires 5 steps:

1. With an OAuth 2.0 client credential grant, a Genesys Cloud administrato sets up an OAuth client in Genesys Cloud and then provides the developers script/service with the client id and client secret that is created at the time the OAuth client was configured. The configuring of the OAuth Client for an application or service is a one-time setup.

2. The developer then configures the script (in our case the user-provisioning script), to have access to the client id and client secret. These values are usually accessed by the script via configuration file, environment variables or a secrets repository.

3. When the script (or service), needs to authenticate they present this client id and client secret to Genesys Cloud's OAuth service and if these two items are valid, Genesys Cloud will return an OAuth token that can then be presented with each request made to Genesys Cloud.

**Note: Asking for a token does not happen with every call to Genesys Cloud**

4. When the script wants to carry out an action with Genesys Cloud, it will present the OAuth token along with the request. Genesys Cloud will inspect the OAuth token.

5. If the OAuth token is valid (e.g. it has not expired or been tampered with), Genesys Cloud will let the request through to the targeted API. If the token is invalid, Genesys Cloud will return a 401 (Unauthorized) HTTP status code.

**Call Out** An OAuth authentication token has a limited shelf life and will expire. It is the responsiblity of the applicaiton or script to be able re-authenticate when a token expires.

While this seems a lot of work, in practice if you use the Genesys Cloud SDKs, the process of authentication is extremely simple.

Let's take a look at the `src/user-provisioning.js` file and watch how we are perform authentication against Genesys Cloud and then begin the provisioning process.

```javascript
const dotenv = require('dotenv');
const authApiProxy = require('./proxies/authenticateapi');
const provision = require('./provision');

dotenv.config();
const filename = process.argv[2];

//Main function.  Wrappering it with async to ensure that all async..await calls are properly fullfill
(async () => {
  console.log(`Starting the user provisioner to parse csv file ${filename}`);
  const token = await authApiProxy.authenticate(
    process.env.GENESYS_CLIENT_ID,
    process.env.GENESYS_CLIENT_SECRET
  );

  console.log(`token: ${JSON.stringify(token, null, '\t')}`);
  await provision.createUsers(filename);
})();
```

For purposes of the user-provisioning scripts, we wrap all of the calls out to the Genesys Cloud API's in proxy classes that will perform the calls against the SDK. So to begin the authentication process we call the `authApiProxy.authenticate()` method:

```javascript
const token = await authApiProxy.authenticate(
  process.env.GENESYS_CLIENT_ID,
  process.env.GENESYS_CLIENT_SECRET
);
```

For the `user-provisioning.js` script we pull the OAuth client id and OAuth client secret directly from an environment variable and pass them to `authApiProxy.authenticate()`.
The source code for the `authenticate()` function can be found at the `proxies/authenticateapi.js` file.

```javascript
const platformClient = require('purecloud-platform-client-v2');

/*
   The authenticate function is going to take the OAuth client id and secret and get a OAuth client credential token
   that will be used for all of the Javascript API calls.
*/
const authenticate = async (clientId, clientSecret) => {
  const client = platformClient.ApiClient.instance;

  try {
    const authData = await client.loginClientCredentialsGrant(
      clientId,
      clientSecret
    );
    return authData;
  } catch (e) {
    console.log(`Authentication error has occurred -> ${e}`);
    process.exit();
  }
};

exports.authenticate = authenticate;
```

There are three keys things to takeaway from the code above. First, in order to use the Genesys Cloud API (formerly known as PureCloud) we need to import the `purecloud-platform-client-v2' into our. This is done via the following code:

```javascript
const platformClient = require('purecloud-platform-client-v2');
```

This is done at the top of every js file that is going to use the API. Second, we need to retrieve an instance of the class in the Genesys Cloud Javascript SDK we are going to use. The Genesys Cloud API is grouped into classes based on their functionality and mirrors how the Genesys Cloud REST APIs are organized. You can see this organization of REST APIs in the Developer Center API documents[2] or via the Developer Tools API explorer [3].
So, in the `authenticate()` method we need to retrieve an instance of the `ApiClient`.

```javascript
const client = platformClient.ApiClient.instance;
```

Now with the client instance at hand, we can authenticate using `loginClientCredentialsGrant()` method on the client instance, passing the client id and secret.

```javascript
const authData = await client.loginClientCredentialsGrant(
  clientId,
  clientSecret
);
return authData;
```

**Note:** The Genesys Cloud JavaScript SDK returns JavaScript `Promise` on all of its SDK calls. This means that when make a call against the API you must use either the `Promises.then().catch()` approach for processing the results of the call or you must an `async/await` approach.

Most of the code in this developer starting guide will use the `async/await` approach. Once the authentication process has successfully completed, an token will be returned.

At this point the Genesys Cloud Javascript SDK will cache the token and use it on every SDK call. You do not need to do any thing else with the token unless it expires. If a token expires, your SDK will need to re-authenticate using its client id and client secret.

## OAuth Token Expiration

When an OAuth is client is setup in Genesys Cloud, the admininstrator will configure how long (in seconds) the token will be valid for this specific OAuth client. When `loginClientCredentialsGrant()` is called you will retrieve an `AuthData` object containing the following information:

1. **accessToken**: The OAuth token that will be presented on each SDK call.
2. **tokenExpiryTime**: The number of seconds the token will expire
3. **tokenExpiryTimeString**: The GMT date/time the token will expire

If you were to log the data within the `AuthData` object using a `` console.log(`token: ${JSON.stringify(token, null, '\t')}`); ``, you would see output that might look something like this:

```javascript
token: {
        "accessToken": "pwxIgt61u6M4ARHcMz-1h5fTv073I2LbQAz50InVfMzDDv0vy9Ecaw0JYjgjy3Dyul7ULvTUAWU1p5IFDSy02A",
        "tokenExpiryTime": 1600538659506,
        "tokenExpiryTimeString": "Sat, 19 Sep 2020 18:04:19 GMT"
}
```

**NOTE TO REVIEW**: WHAT FORMAT IS tokenExpiryTime in (seconds, millisecndon, the value does not convert to anything meaningful. Wonder if we are dealing with an integer overflow issues)

At this point, the user-provisioning script is now authenticated and can begin the process of creating users.

# OAuth Client and Token Best Practices

Before we wrap up this module, we do need spend some time thinking about how to set up and use OAuth clients. New developers usually just setup a single OAuth client with a large number of privileges and they are off writing code. They reuse the same OAuth client across all of their integrations and do not clearly separate real-time integrations with batch job integrations. This can be problematic as lets say one of your batch scripts begins getting rate-limited or acting in abusive manner towards a Genesys Cloud service or resource.

A Genesys Cloud on-call support engineer will have to evaluate the risk your OAuth client is causing to the overall platform health and may decide as part of their playbooks to revoke the misbehaving OAuth Clients credentials until the issue can be resolved. If multiple integrations share the same OAuth client, this can take down your entire Call Center. So this is why it is critical to think through how you are going to structure your OAuth Clients. Here are some general guidelines:

However, you need to think about your OAuth client configuration and setup from a operational perspective.
Specifically, how you setup and segerate your OAuth clients to represent specific types of work being done

1. **Do not group batch integrations and real-time integrations under the same OAuth client**. Often times batch jobs will be the thing that can either create a rate-limiting situation or unearth a performance problem in Genesys Cloud.
2. **For new scripts or services, consider setting up an a separate OAuth client for them so that they can easily be shutdown without impacting existing operations.** Personally, I recommend setting a separate OAuth client for each integration or service you provide.
3. **Provide a clear, descriptive name and description for your OAuth client**. In the event there is an incident with a script using your token, the Genesys Cloud on-call support engineers will look at your OAuth client's name and description to help ascertain the risks of shutting down the client.
4. **Do not over-privilege your OAuth client**. While an OAuth token will expire, if the OAuth token is hijacked or compromised, and the OAuth client that issues the token has more privileges then it needs, this will cause an unnecessary risk to your Genesys Cloud account and the data in it.
5. **Be aggressive with your token time-outs**. While you can set your tokens to timeout for up to 24 hours, this can increase the surface an attacker has to (ab)use a token before it expires.
6. **Do not setup the multiple OAuth Clients to sidestep Genesys Cloud rate-limits**. OAuth Clients have a rate limit of 300 requests per minute. [4] Do not attempt to setup multiple OAuth Clients that your application uses to side step. This is considered abusive behavior and may result in all of your OAuth Clients credentials revoked.

# Summary

# References

1. [OAuth 2 Overview](https://developer.mypurecloud.com/api/rest/authorization/index.html#access_tokens)
2. [Developer Center API Guide](https://developer.mypurecloud.com/api/rest/v2/)
3. [API Explorer](https://developer.mypurecloud.com/developer-tools/#/api-explorer)
4. [API Rate Limits](https://developer.mypurecloud.com/api/rest/tips/#api_rate_limiting)
