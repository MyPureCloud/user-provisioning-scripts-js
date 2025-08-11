import platformClient from 'purecloud-platform-client-v2';

let phoneBasesMap = {};

/*
    The getPhoneBaseByLogicalName() will look up a phonebase based on its logical name from GenesysCloud 
*/
async function getPhoneBaseByLogicalName(logicalName) {
  let opts = {
    name: logicalName,
  };

  let apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  try {
    const phoneBases = await apiInstance.getTelephonyProvidersEdgesPhonebasesettings(opts);

    if (phoneBases != null) {
      const phoneBase = {
        id: phoneBases.entities[0].id,
        name: phoneBases.entities[0].name,
        lines: phoneBases.entities[0].lines,
      };

      phoneBasesMap[phoneBase.name] = phoneBase;
      return { ...phoneBase };
    }

    return null;
  } catch (e) {
    console.error(`Error while retrieving phonebase with name: ${logicalName}`, e);
    return null;
  }
};

async function getPhoneBaseByName(phoneBaseName) {
  if (!(phoneBaseName in phoneBasesMap)) { await getPhoneBaseByLogicalName(phoneBaseName); }
  return { ...phoneBasesMap[phoneBaseName] }
};

export { getPhoneBaseByName };
