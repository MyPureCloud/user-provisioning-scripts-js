const platformClient = require('purecloud-platform-client-v2');

async function createWebRTCPhone(user) {
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
      id: user.phonebase.id,
      name: user.phonebase.name,
      selfUri: user.phonebase.selfUri,
    },
    lineBaseSettings: {
      id: user.phonebase.lines[0].id,
      name: user.phonebase.lines[0].name,
      selfUri: user.phonebase.lines[0].selfUri,
    },
    phoneMetaBase: {
      id: 'inin_webrtc_softphone.json',
      name: 'PureCloud WebRTC Phone',
    },
    lines: [
      {
        name: user.phonebase.lines[0].name,
        lineBaseSettings: {
          id: user.phonebase.lines[0].id,
          name: user.phonebase.lines[0].name,
          selfUri: user.phonebase.lines[0].selfUri,
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
      id: user.id,
      name: user.NAME.replace(' ', '_'),
    },
  };

  try {
    return await apiInstance.postTelephonyProvidersEdgesPhones(phone);
  } catch (e) {
    console.err0r(`Error has occurred while trying to create a phone for user.`, user, phone, e);
    return null;
  }
};

exports.createWebRTCPhone = createWebRTCPhone;
