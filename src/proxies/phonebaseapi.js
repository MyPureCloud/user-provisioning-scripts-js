const platformClient = require('purecloud-platform-client-v2');

let phoneBasesMap = new Map();

/*
    The getPhoneBaseByLogicalName() will look up a phonebase based on its logical name from GenesysCloud 
*/
const getPhoneBaseByLogicalName = async (logicalName) => {
  let opts = {
    name: logicalName,
  };

  let apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  try {
    const results = await apiInstance.getTelephonyProvidersEdgesPhonebasesettings(
      opts
    );

    const phoneBase = {
      id: results.entities[0].id,
      name: results.entities[0].name,
      lines: results.entities[0].lines,
    };

    if (results != null) {
      phoneBasesMap[phoneBase.name] = phoneBase;
      return {...phoneBase};
    }

    return null;
  } catch (err) {
    console.log(
      `Error while retrieving phonebase with name: ${logicalName}: ${JSON.stringify(
        err,
        null,
        '\t'
      )}`
    );
    return null;
  }
};

const getPhoneBaseByName = async (phoneBaseName) => {
  const results = phoneBasesMap[phoneBaseName];
  if (results != null) {
    return results;
  } else {
    const resultsLookup = await getPhoneBaseByLogicalName(phoneBaseName);
    return resultsLookup;
  }
};

exports.getPhoneBaseByName = getPhoneBaseByName;
