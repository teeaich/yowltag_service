import uuid from 'uuid';
import base64 from 'base-64';

import _ from 'lodash';
import * as db from './dynamo';
import * as matchService from './../lib/matchService';

require('util').inspect.defaultOptions.depth = null;

const TableName = 'matches';

export function getMatchesById(id) {
  const params = {
    TableName,
    Key: {
      id,
    },
  };

  return db.get(params);
}

export async function getMatchesByTag(tagId) {
  const params = {
    TableName,
    FilterExpression: '(contains(#tagIds, :tagId))',
    ExpressionAttributeNames: {
      '#tagIds': 'tagIds',
    },
    ExpressionAttributeValues: { ':tagId': tagId },
  };
  const dbData = await db.scan(params);
  return _.orderBy(dbData, m => m.timestamp, 'desc');
}

export function createMatch(args) {
  const params = {
    TableName,
    Item: {
      id: args.id,
      tagIds: args.tag_ids,
      hashKey: args.hash_key,
      rangeKey: args.range_key,
      userIds: args.user_ids,
      lat: args.lat,
      long: args.long,
      timestamp: new Date().getTime().toString(),
      matchStatus: 'pending',
      matchCounter: 0,
    },
  };

  return db.createItem(params);
}

export function updateMatch(args) {
  const params = {
    TableName,
    Key: {
      id: args.id,
    },
    ExpressionAttributeValues: {
      ':matchCounter': args.matchCounter,
    },
    UpdateExpression: 'ADD matchCounter :matchCounter',
    ReturnValues: 'ALL_NEW',
  };

  return db.updateItem(params, args);
}


export function createOrUpdateMatches(ownLocation, paramsArray) {
  return new Promise((resolve, reject) => {
    const promises = paramsArray.map(match =>
      new Promise((innerResolve, innerReject) => {
        try {
          const foundedLocationCoords = JSON.parse(match.foundedLocation.geoJson.S);
          const tagIds = matchService.getArrayOfBothTagIds(match);
          // create the unique id of match from both matched tag Ids
          const matchId = matchService.createUniqueMatchIdFromTagIds(tagIds);

          getMatchesById(matchId)
            .then((foundMatch) => {
              if (foundMatch) {
                updateMatch({
                  id: matchId, matchCounter: 1,
                })
                  .then(dbData => innerResolve(dbData))
                  .catch(error => innerReject(error));
              } else {
                createMatch({
                  id: matchId,
                  tag_ids: tagIds,
                  hash_key: match.foundedLocation.hashKey.N,
                  range_key: match.foundedLocation.rangeKey.S,
                  user_ids: [ownLocation.user, match.foundedLocation.user.S],
                  lat: foundedLocationCoords.coordinates[0],
                  long: foundedLocationCoords.coordinates[1],
                })
                  .then(dbData => innerResolve(dbData))
                  .catch(error => innerReject(error));
              }
            });
        } catch (error) {
          reject(`Could not parse coordinates from foundedLocation or could not create match object: ${error}`);
        }
      }),
    );
    Promise.all(promises)
      .then((allDbData) => {
        resolve(allDbData);
      })
      .catch(error => reject(error));
  });
}
