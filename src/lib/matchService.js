/**
 * Created by ht3597 on 20.06.2017.
 */
import _ from 'lodash';
import * as tagService from './tagService';

const ddbGeo = require('dynamodb-geo');
const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB();
const configDdb = new ddbGeo.GeoDataManagerConfiguration(ddb, 'locations');
const geoDataManager = new ddbGeo.GeoDataManager(configDdb);
const radius = 300;

export function sortAndFilterByUniqUser(foundedLocations) {
  const sortedByTimestamp = _.orderBy(foundedLocations, l => l.timestamp.S, 'desc');
  return _.sortedUniqBy(sortedByTimestamp, l => l.user.S);
}

export function queryAndFindMatches(ownLocation) {
  return new Promise((resolve, reject) => {
    const query = {
      RadiusInMeter: radius,
      CenterPoint: {
        latitude: ownLocation.lat,
        longitude: ownLocation.long,
      },
    };
    if (ownLocation.user) {
      query.QueryInput = {
        FilterExpression: '#user <> :user',
        ExpressionAttributeNames: {
          '#user': 'user',
        },
        ExpressionAttributeValues: {
          ':user': { S: ownLocation.user },
        },
      };
    }
    geoDataManager.queryRadius(query)
      .then((foundedLocations) => {
        console.log(`Your own location is: ${JSON.stringify(ownLocation)}`);
        console.log(`Without tag filter/unique user entries found ${foundedLocations.length} locations.`);
        console.log(`Without tag filter/unique user entries found following locations ${JSON.stringify(foundedLocations)}.`);
        const foundedLocationFilteredByUniqueUserEntries =
          sortAndFilterByUniqUser(foundedLocations);
        console.log(`Without tag filter but filtered unique user entries found ${foundedLocationFilteredByUniqueUserEntries.length} locations.`);
        console.log(`Without tag filter but filtered unique user entries found following locations ${JSON.stringify(foundedLocationFilteredByUniqueUserEntries)}.`);
        tagService.findMatchingTags(ownLocation, foundedLocationFilteredByUniqueUserEntries)
          .then(({ filteredLocations, foundedCompleteIntersectionInfo }) => {
            console.log(`With tag filter/unique user entries found ${filteredLocations.length} locations.`);
            console.log(`With tag filter/unique user entries found following locations ${JSON.stringify(filteredLocations)}.`);
            console.log(`Final result of completeIntersectionInfo ${JSON.stringify(foundedCompleteIntersectionInfo)}`);

            resolve(foundedCompleteIntersectionInfo);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
