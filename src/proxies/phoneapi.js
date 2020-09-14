const platformClient = require('purecloud-platform-client-v2');

const createWebRTCPhone = async (user) => {
  let apiInstance = new platformClient.TelephonyProvidersEdgeApi();

  const phone = {
    name: `${user.NAME.replace(' ', '_')}_WEBRTC_PHONE`,
    state: 'active',
    site: {
      id: user.site.id,
      name: user.site.name,
      selfUri: user.site.selfUri,
    },
    phoneBaseSettings: {
      id: user.phoneBase.id,
      name: user.phoneBase.name,
      selfUri: user.phoneBase.selfUri,
    },
    lineBaseSettings: {
      id: user.phoneBase.lines[0].id,
      name: user.phoneBase.lines[0].name,
      selfUri: user.phoneBase.lines[0].selfUri,
    },
    phoneMetaBase: {
      id: 'inin_webrtc_softphone.json',
      name: 'PureCloud WebRTC Phone',
    },
    lines: [
      {
        name: user.phoneBase.lines[0].name,
        lineBaseSettings: {
          id: user.phoneBase.lines[0].id,
          name: user.phoneBase.lines[0].name,
          selfUri: user.phoneBase.lines[0].selfUri,
        },
      },
    ],
    capabilities: {
      provisions: false,
      registers: false,
      dualRegisters: false,
      hardwareIdType: 'mac',
      allowReboot: false,
      noRebalance: false,
      noCloudProvisioning: false,
      mediaCodecs: ['audio/opus'],
    },
    webRtcUser: {
      id: user.userId,
      name: user.NAME.replace(' ', '_'),
    },
  };

  try {
    const results = await apiInstance.postTelephonyProvidersEdgesPhones(phone);
    return results;
  } catch (e) {
    console.log(
      `Error has occurred while trying to create a phone for user ${
        user.NAME
      }, error: ${JSON.stringify(e, null, '\t')},
      PHONE: ${JSON.stringify(phone, null, '\t')}
      `
    );
    return null;
  }
};

exports.createWebRTCPhone = createWebRTCPhone;
