const sitesapi = require('../../../src/proxies/sitesapi');
const utils = require('../../utils');
const {TelephonyProvidersEdgeApi} = require('purecloud-platform-client-v2');

jest.mock('purecloud-platform-client-v2');

const buildSiteMock = (site) => {
  return {
    entities: [
      {
        id: site.id,
        name: site.name,
        version: 1,
        dateCreated: '2018-05-18T18:58:46.175Z',
        dateModified: '2018-05-18T18:58:46.175Z',
        modifiedBy: '873a36e6-26f6-4c49-909c-ce125b209abe',
        createdBy: '873a36e6-26f6-4c49-909c-ce125b209abe',
        state: 'active',
        modifiedByApp: 'public-api-v2/2184 (i-0165f642433826cfa)',
        createdByApp: 'public-api-v2/2184 (i-0165f642433826cfa)',
        primarySites: [],
        secondarySites: [],
        primaryEdges: [],
        secondaryEdges: [],
        edges: [
          {
            id: 'aede4a6b-8ae3-4add-9668-ccdc2f277461',
            state: 'active',
            physicalEdge: false,
            managed: false,
            offlineConfigCalled: false,
            selfUri:
              '/api/v2/telephony/providers/edges/aede4a6b-8ae3-4add-9668-ccdc2f277461',
          },
        ],
        edgeAutoUpdateConfig: {
          timeZone: 'America/Indianapolis',
          rrule: 'FREQ=DAILY',
          start: '2018-05-18T02:00:00.000',
          end: '2018-05-18T05:00:00.000',
        },
        mediaRegionsUseLatencyBased: false,
        edgeGroup: {
          id: '31d82dff-c252-48c0-a315-c95f7d499b63',
          state: 'active',
          managed: false,
          hybrid: false,
          selfUri:
            '/api/v2/telephony/providers/edges/edgegroups/31d82dff-c252-48c0-a315-c95f7d499b63',
        },
        location: {
          id: '15dde698-6f00-4284-bc0d-46366bb74463',
          name: 'Indianapolis',
          selfUri: '/api/v2/locations/15dde698-6f00-4284-bc0d-46366bb74463',
        },
        managed: false,
        selfUri:
          '/api/v2/telephony/providers/edges/sites/77d3da28-c4d8-40da-8c47-4ab66d4c0501',
      },
    ],
  };
};

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  TelephonyProvidersEdgeApi.mockClear();
});

describe('When retrieving sites: ', () => {
  test('When a call to getSiteByName() and the underlying genesys cloud api throws an exception, we should return a null', async () => {
    TelephonyProvidersEdgeApi.mockImplementation(() => {
      return {
        getTelephonyProvidersEdgesSites: (opts) => {
          throw 'An error was encountered';
        },
      };
    });

    const results = await sitesapi.getSiteByName();
    expect(results).toBe(null);
    expect(TelephonyProvidersEdgeApi).toHaveBeenCalledTimes(1);
  });

  test('When a call to getSiteByName, it should a return the specific site record ', async () => {
    const targetSite = {id: utils.generateUUID(), name: 'Indianapolis'};

    const mock_call = buildSiteMock(targetSite, 1);

    expected_result = {id: targetSite.id, name: targetSite.name};

    TelephonyProvidersEdgeApi.mockImplementation(() => {
      return {
        getTelephonyProvidersEdgesSites: (opts) => {
          return new Promise((resolve, reject) => {
            resolve(mock_call);
          });
        },
      };
    });

    let results = await sitesapi.getSiteByName('Indianapolis');
    expect(results).toBeDefined();
    expect(results.id).toBe(targetSite.id);
    expect(results.name).toBe(targetSite.name);

    results = await sitesapi.getSiteByName('Indianapolis');
    expect(TelephonyProvidersEdgeApi).toHaveBeenCalledTimes(1); //Checking to make sure we read from the cache on the second call.

    expect(results).toBeDefined();
    expect(results.id).toBe(targetSite.id);
    expect(results.name).toBe(targetSite.name);
  });
});
