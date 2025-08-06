import platformClient from 'purecloud-platform-client-v2';

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
    const sites = await apiInstance.getTelephonyProvidersEdgesSites(opts);

    if (sites != null) {
      const site = {
        id: sites.entities[0].id,
        name: sites.entities[0].name,
        primarySites: sites.entities[0].primarySites,
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
  if (!(siteName in sitesMap)) { await getSiteByLogicalName(siteName) }
  return { ...sitesMap[siteName] };
};


export { getSiteByName };
