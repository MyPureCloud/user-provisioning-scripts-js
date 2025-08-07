import platformClient from 'purecloud-platform-client-v2';
import { retry } from '@lifeomic/attempt';

/*
    When you create a web rtc phone you do not automatically associate it with the user.
    The getStationByWebRtcUserId() will look up the station for the web rtc phone and
    return it so that we can then assign the user to it.
*/
async function getStationByWebRtcUserId(userId) {
  let opts = {
    webRtcUserId: userId,
  };

  let apiInstance = new platformClient.StationsApi();

  try {
    const results = await retry(
      async () => {
        const stations = await apiInstance.getStations(opts);
        /*If we cant find a station then throw an exception.  This will trigger a retry*/
        if (stations.entities.length === 0) {
          throw new Error('No station found, retrying');
        }

        return stations;
      },
      /*
      Why the retry logic here.  When we create a web rtc phone, we index the created station in our search engine.
      When we lookup a station by name, the search engine can be behind in index the record so we retry several times until
      we find the station or give up.  In this case we wait a second between calls and give up after 6 times.
    */
      { delay: 1000, factor: 1, maxAttempts: 6 }
    );

    const station = {
      id: results.entities[0].id,
      webRtcUserId: results.entities[0].webRtcUserId,
      name: results.entities[0].name,
    };

    return station;
  } catch (err) {
    console.log(`Error while retrieving station with userId: ${userId}: ${JSON.stringify(err, null, 4)}`);
    return null;
  }
};

/*
   Assigns a user to their webrtc phone so that when they login, they will automatically have a webrtc phone assigned to them
*/
async function assignUserToWebRtcPhone(userId) {
  try {
    /*Get the station*/
    const station = await getStationByWebRtcUserId(userId);

    let apiInstance = new platformClient.UsersApi();

    /*Assign the station*/
    await apiInstance.putUserStationDefaultstationStationId(userId, station.id);
  } catch (e) {
    console.error(`Error occurred while assigning default station for userId ${userId}`, e);
  }
};

export { assignUserToWebRtcPhone };
