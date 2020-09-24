const platformClient = require('purecloud-platform-client-v2');

const sitesMap = {};

/*
    The getSiteByLogicalName() will look up a site based on its logical name from GenesysCloud from Genesys Cloud 
*/
const getSiteByLogicalName = async (logicalName) => {
  let opts = {
    name: logicalName,
  };

  let apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  try {
    const results = await apiInstance.getTelephonyProvidersEdgesSites(opts);

    const site = {
      id: results.entities[0].id,
      name: results.entities[0].name,
      primarySites: results.entities[0].primarySites,
    };

    if (results != null) {
      sitesMap[site.name] = site;
      return {...site};
    }

    return null;
  } catch (err) {
    console.log(
      `Error while retrieving site with name: ${logicalName}: ${JSON.stringify(
        err,
        null,
        '\t'
      )}`
    );
    return null;
  }
};

const getSiteByName = async (siteName) => {
  const results = sitesMap[siteName];
  if (results != null) {
    return results;
  } else {
    const resultsLookup = await getSiteByLogicalName(siteName);
    return resultsLookup;
  }
};

exports.getSiteByName = getSiteByName;
