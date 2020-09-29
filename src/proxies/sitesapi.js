const platformClient = require('purecloud-platform-client-v2');

const sitesMap = {};

/*
    The getSiteByLogicalName() will look up a site based on its logical name from GenesysCloud from Genesys Cloud 
*/
async function getSiteByLogicalName(logicalName) {
  const opts = {
    name: logicalName,
  };

  const apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  try {
    const results = await apiInstance.getTelephonyProvidersEdgesSites(opts);

    if (results != null) {
      const site = {
        id: results.entities[0].id,
        name: results.entities[0].name,
        primarySites: results.entities[0].primarySites,
      };

      sitesMap[site.name] = site;
      return { ...site };
    }

    return null;
  } catch (err) {
    console.error(`Error while retrieving site with name: ${logicalName}.`, err);
    return null;
  }
};

async function getSiteByName(siteName) {
  //Potential race condition using the in or !=null if you are mutating because two calls could come in at the same time and one could be done
  //before the data is loaded.  Its fine if the data is not mutating results
  if (!(siteName in sitesMap)) { await getSiteByLogicalName(siteName) }
  return { ...sitesMap[siteName] };
};


exports.getSiteByName = getSiteByName;
