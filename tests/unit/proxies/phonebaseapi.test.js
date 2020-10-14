const phonebaseapi = require('../../../src/proxies/phonebaseapi');
const { v4: uuidv4 } = require('uuid');
const { TelephonyProvidersEdgeApi } = require('purecloud-platform-client-v2');

jest.mock('purecloud-platform-client-v2');

const buildPhoneBaseMock = (phoneBase) => {
  return {
    entities: [
      {
        id: phoneBase.id,
        name: phoneBase.name,
        state: 'active',
        phoneMetaBase: {
          id: 'inin_webrtc_softphone.json',
          name: 'PureCloud WebRTC Phone',
        },
        lines: [
          {
            id: 'c0e1873d-1f9e-4158-8662-cf8c8849a621',
            state: 'active',
            selfUri:
              '/api/v2/telephony/providers/edges/linebasesettings/c0e1873d-1f9e-4158-8662-cf8c8849a621',
          },
        ],
        properties: {
          phone_label: {
            value: {
              instance: 'PureCloud WebRTC Phone',
            },
          },
          phone_maxLineKeys: {
            value: {
              instance: 1,
            },
          },
          phone_media_codecs: {
            value: {
              instance: ['audio/opus'],
            },
          },
        },
        capabilities: {
          provisions: false,
          registers: false,
          dualRegisters: false,
          hardwareIdType: 'mac',
          allowReboot: false,
          noRebalance: false,
          noCloudProvisioning: false,
          mediaCodecs: ['audio/opus'],
          cdm: true,
        },
        selfUri: `/api/v2/telephony/providers/edges/phonebasesettings/${phoneBase.id}`,
      },
    ],
  };
};

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  TelephonyProvidersEdgeApi.mockClear();
});

describe('When retrieving phonebase information: ', () => {
  test('When a call to getPhoneBaseByName() and the underlying genesys cloud api throws an exception, we should return a null', async () => {
    TelephonyProvidersEdgeApi.mockImplementation(() => {
      return {
        getTelephonyProvidersEdgesPhonebasesettings: (opts) => {
          throw 'An error was encountered';
        },
      };
    });

    const results = await phonebaseapi.getPhoneBaseByName('AmyName');
    expect(TelephonyProvidersEdgeApi).toHaveBeenCalledTimes(1);
  });

  test('When a call to getPhoneBaseByName(), it should a return the specific phone record ', async () => {
    const targetPhoneBase = { id: uuidv4(), name: 'WebRTC Phone' };

    const mock_call = buildPhoneBaseMock(targetPhoneBase);

    expected_result = { id: targetPhoneBase.id, name: targetPhoneBase.name };

    TelephonyProvidersEdgeApi.mockImplementation(() => {
      return {
        getTelephonyProvidersEdgesPhonebasesettings: (opts) => {
          return new Promise((resolve, reject) => {
            resolve(mock_call);
          });
        },
      };
    });

    let results = await phonebaseapi.getPhoneBaseByName('WebRTC Phone');
    expect(results).toBeDefined();
    expect(results.id).toBe(targetPhoneBase.id);
    expect(results.name).toBe(targetPhoneBase.name);

    results = await phonebaseapi.getPhoneBaseByName('WebRTC Phone');
    expect(TelephonyProvidersEdgeApi).toHaveBeenCalledTimes(1); //Checking to make sure we read from the cache on the second call.

    expect(results).toBeDefined();
    expect(results.id).toBe(targetPhoneBase.id);
    expect(results.name).toBe(targetPhoneBase.name);
  });
});
