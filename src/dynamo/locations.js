import uuid from 'uuid';
import AWS from 'aws-sdk';
import async from 'async';
import _ from 'lodash';
import * as db from './dynamo';
import * as dbTags from './tags';
import * as tagService from './../lib/tagService';
import * as matchService from './../lib/matchService';

require('util').inspect.defaultOptions.depth = null;

const TableName = 'locations';

/**
 *
 * @param dbLocation
 * @param isRaw - only locationRaw elements have the hashs
 * @returns {{hash_key: (*|hashKey|{N}),
  * range_key: (*|string),
  * lat: (*|number),
  * long: (*|Glacier.long|StorageGateway.long|number|string|CloudFront.long),
  * user: (boolean|*)}}
 */
function buildLocation(dbLocation, isRaw) {
  const hashKey = dbLocation.PutItemInput.Item.hashKey;
  const locationResult = {
    hash_key: hashKey ? hashKey.N : 0,
    range_key: dbLocation.RangeKeyValue.S,
    lat: dbLocation.GeoPoint.latitude,
    long: dbLocation.GeoPoint.longitude,
    user: dbLocation.PutItemInput.Item.user.S,
    timestamp: dbLocation.PutItemInput.Item.timestamp.S,
  };
  if (isRaw) locationResult.hashs = dbLocation.PutItemInput.Item.tags.SS;
  return locationResult;
}

function buildLocationForRecord(dbLocationRecord) {
  return {
    hash_key: 0,
    range_key: '0',
    lat: dbLocationRecord.lat,
    long: dbLocationRecord.long,
    user: dbLocationRecord.user,
    timestamp: dbLocationRecord.timestamp,
  };
}

export function getTagsFromIntersectionLocation(singleTagArray, foundedLocationTagArray) {
  return _.intersectionBy(singleTagArray, foundedLocationTagArray, 'hashs');
}

export function buildLocationsForMatch(foundedCompleteIntersectionInfo) {
  return foundedCompleteIntersectionInfo.map((intersectionLocation) => {
    const coordinatesParsed = JSON.parse(intersectionLocation.foundedLocation.geoJson.S);
    const hashsFromIntersectionLocation =
      getTagsFromIntersectionLocation(
        intersectionLocation.tags,
        tagService.transformTagsFromDB(intersectionLocation.foundedLocation.tags),
      );
    return {
      hash_key: intersectionLocation.foundedLocation.hashKey.N,
      range_key: intersectionLocation.foundedLocation.rangeKey.S,
      lat: coordinatesParsed.coordinates[1],
      long: coordinatesParsed.coordinates[0],
      user: intersectionLocation.foundedLocation.user.S,
      hashs: tagService.transformTagsForView(hashsFromIntersectionLocation),
    };
  });
}

/**
 * Unfortunatly another function is needed to build the location when querying
 * directly the db
 * @param dbLocation
 * @returns {{hash_key: (*|hashKey|{N}),
 * range_key: (*|string|rangeKey|{S}), lat, long, user, timestamp}}
 */
function buildSingleLocation(dbLocation) {
  const geoJson = JSON.parse(dbLocation.geoJson);
  return {
    hash_key: dbLocation.hashKey,
    range_key: dbLocation.rangeKey,
    lat: geoJson.coordinates[1],
    long: geoJson.coordinates[0],
    user: dbLocation.user,
    timestamp: dbLocation.timestamp,
  };
}

/**
 *
 * @param dbLocations
 * @param isRaw -
 */
function buildLocations(dbLocations, isRaw) {
  return dbLocations.map(l => buildLocation(l, isRaw));
}

function buildSingleLocations(dbLocations) {
  return dbLocations.map(l => buildSingleLocation(l));
}

function buildLocationsForRecord(dbLocations) {
  return dbLocations.map(l => buildLocationForRecord(l));
}

// TODO check how different are the ownLocation for SNS and for all other graphql realted queries
// TODO the transformTo and transformFrom function ae completely broken
export function getLocationsMatch(args) {
  return new Promise((resolve, reject) => {
    const ownLocation = {
      lat: args.lat,
      long: args.long,
    };
    if (!args.tags_raw && !args.tags && !args.user) {
      reject('You have to provide property tags or tags_raw when no user property is provided.');
    }
    /**
     * There is no tags property
     * Try to get the tags with query for user
     */
    if (!args.tags_raw && !args.tags && args.user) {
      dbTags.getTagsByUser(args.user)
        .then((dbData) => {
          console.log(`Found tags by user query (${args.user}) for location parameter: ${JSON.stringify(args)}`);
          ownLocation.user = args.user;
          ownLocation.tags_raw = tagService.transformTagsForDB(dbData);
          console.log(ownLocation);
          matchService.queryAndFindMatches(ownLocation)
            .then(result => resolve(buildLocationsForMatch(result)))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    }
    /**
     * If tags_raw property is provided - use it
     */
    if (args.tags_raw) {
      console.log(`Found tags in tags_raw property for location parameter: ${JSON.stringify(args)}`);
      ownLocation.tags_raw = args.tags_raw;
      matchService.queryAndFindMatches(ownLocation)
        .then(result => resolve(buildLocationsForMatch(result)))
        .catch(error => reject(error));
    }
  });
}

export async function getLocationsById(args) {
  const params = {
    TableName,
    Key: {
      hashKey: args.hash_key,
      rangeKey: args.range_key,
    },
    AttributesToGet: [
      'hashKey',
      'rangeKey',
      'geoJson',
      'tags',
      'timestamp',
      'user',
    ],
  };

  const dbData = await db.get(params);
  return buildSingleLocation(dbData);
}

export async function getLocationsByUser(userId) {
  const params = {
    TableName,
    FilterExpression: '#user = :user_id',
    ExpressionAttributeNames: {
      '#user': 'user',
    },
    ExpressionAttributeValues: { ':user_id': userId },
  };
  const dbData = await db.scan(params);
  return buildSingleLocations(dbData);
}

export function createLocation(args) {
  // get the current tags and hashs from user from DB and then save this
  // exit the save when no tags/hashs are available
  return new Promise((resolve, reject) => {
    dbTags.getTagsByUser(args.user)
      .then((tagsData) => {
        const hashsForDB = tagService.transformTagsForDB(tagsData);
        const locationParams = {
          // Use this to ensure uniqueness of the hash/range pairs.
          RangeKeyValue: { S: uuid.v4() },
          // An object specifying latitutde and longitude as plain numbers.
          // Used to build the geohash, the hashkey and geojson data
          GeoPoint: {
            latitude: args.lat,
            longitude: args.long,
          },
          // Passed through to the underlying DynamoDB.putItem request.
          // TableName is filled in for you.
          PutItemInput: {
            Item: { // The primary key, geohash and geojson data is filled in for you
              // Specify attribute values using { type: value } objects, like the DynamoDB API.
              user: { S: args.user },
              tags: hashsForDB,
              timestamp: { S: new Date().getTime().toString() },
            },
          },
        };
        db.createLocation(locationParams, TableName)
          .then((dbData) => {
            console.log(`Saved location in DB with following data: ${JSON.stringify(dbData)}`);
            const sns = new AWS.SNS();
            const accountId = process.env.ACCOUNT_ID;
            const region = process.env.AWS_REGION;
            const message = {
              meta: 'triggering match Lambda',
              data: dbData,
            };
            const snsParams = {
              Message: JSON.stringify(message),
              TopicArn: `arn:aws:sns:${region}:${accountId}:dispatcher`,
            };
            console.log(`Throw SNS with following data: ${JSON.stringify(snsParams)}`);
            sns.publish(snsParams, (error) => {
              if (error) {
                reject(error);
              }
              return resolve(buildLocation(dbData));
            });
          })
          .catch(err => reject(err));
      })
      .catch(error => reject(`${error}: Error in getting tagsByUser query.`));
  });
}

export async function createLocationRecord(args) {
  const params = {
    TableName: 'records',
    Item: {
      id: uuid(),
      user: args.user,
      lat: args.lat,
      long: args.long,
      dataObject: args.dataObject,
      name: args.name,
      timestamp: new Date().getTime().toString(),
    },
  };

  const dbData = await db.createItem(params);
  return buildLocationForRecord(dbData);
}


export function createLocationsWithGeoJson(args) {
  const features = args.featureCollection.features;
  console.log(`Creating locations with following arguments: ${JSON.stringify(features)}`);
  const featuresParams = features.map((feature) => {
    let tags = false;
    /**
     * has the input the original tags property (array with tags?)
     * then transform to base64 and use this
     * otherwise tags_raw is putted in with already base64 strings
     */
    if (feature.properties.tags) {
      tags = tagService.transformTagsForDB(feature.properties.tags);
    }
    /**
     * last chance to get the tags when nothing is provided
     * get tags from the hopefully available user in db
     */
    if (!feature.properties.tags && !feature.properties.tags_raw) {
      tags = dbTags.getTagsByUser(feature.properties.user);
    }
    /**
     * check if user is provided
     */
    const user = feature.properties.user;
    console.log('Iterateration of creating geoJSON');
    return {
      RangeKeyValue: { S: uuid.v4() }, // Use this to ensure uniqueness of the hash/range pairs.
      // An object specifying latitutde and longitude as plain numbers.
      // Used to build the geohash, the hashkey and geojson data
      GeoPoint: {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      },
      // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
      PutItemInput: {
        Item: { // The primary key, geohash and geojson data is filled in for you
          // Specify attribute values using { type: value } objects, like the DynamoDB API.
          user: { S: user || uuid.v4() },
          tags: { SS: tags || feature.properties.tags_raw },
          timestamp: { S: new Date().getTime().toString() },
        },
      },
    };
  });
  return new Promise((resolve, reject) => {
    db.createLocationsFromGeoJson(featuresParams, TableName)
      .then(dbData => resolve(buildLocations(dbData, true)))
      .catch(error => reject(error));
  });
}

export function updateLocation(args) {
  const params = {
    TableName: 'locations',
    Key: {
      id: args.id,
    },
    ExpressionAttributeValues: {
      ':long': args.long,
      ':lat': args.lat,
      ':user': args.user,
    },
    UpdateExpression: 'SET long = :long, lat = :lat, user = :user',
    ReturnValues: 'ALL_NEW',
  };

  return db.updateItem(params, args);
}

export function deleteLocation(args) {
  const params = {
    TableName,
    Key: {
      hashKey: args.hash_key,
      rangeKey: args.range_key,
    },
  };

  return db.deleteItem(params, args);
}

export function cleanupLocations(newestLocations) {
  return new Promise((resolve, reject) => {
    async.eachLimit(newestLocations, 10, (l, cb) => {
      if (l.eventName === 'INSERT' && l.dynamodb.NewImage) {
        const newLocationEntry = l.dynamodb.NewImage;
        console.log(`Cleanup new INSERT entry of new location: ${JSON.stringify(newLocationEntry)}`);
        const user = newLocationEntry.user.S;
        getLocationsByUser(user)
          .then((foundedLocationsForUser) => {
            console.log(`Found ${foundedLocationsForUser.length} locations for user ${user}`);
            const sortedByTimestamp = _.orderBy(foundedLocationsForUser, location => location.timestamp, 'desc');
            const toBeDeletedLocations =
              _.takeRight(sortedByTimestamp, sortedByTimestamp.length - 5);
            console.log(`Found ${toBeDeletedLocations.length} locations for user ${user} that must be deleted`);
            const deletePromises = toBeDeletedLocations.map(toBeDeletedLocation =>
              new Promise((deleteResolve, deleteReject) => {
                const keysOfLocation = {
                  hash_key: toBeDeletedLocation.hash_key,
                  range_key: toBeDeletedLocation.range_key,
                };
                deleteLocation(keysOfLocation)
                  .then((dbData) => {
                    console.log(`Successfull deleted location: ${JSON.stringify(dbData)}`);
                    deleteResolve(dbData);
                  })
                  .catch((error) => {
                    deleteReject(error);
                  });
              }));
            Promise.all(deletePromises)
              .then(() => {
                console.log(`Successfully process cleanupLocations event for user ${user}`);
                cb();
              })
              .catch((error) => {
                cb(`${error}: Error deleting all locations of user ${user}`);
              });
          });
      } else {
        console.log(`Ignore the event type: ${l.eventName}`);
        cb();
      }
    }, (error) => {
      if (error) {
        console.log(`${error}: Error in cleaning up the locations`);
        reject(`${error}: Error in cleaning up the locations`);
      } else {
        resolve(`Finish cleaning up events of location: ${JSON.stringify(newestLocations)}`);
      }
    });
  });
}
