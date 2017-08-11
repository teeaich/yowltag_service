import uuid from 'uuid';
import _ from 'lodash';
import * as db from './dynamo';

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

export function getMatchesByTag(tagId) {
  const params = {
    TableName,
    FilterExpression: '(contains(#tagIds, :tagId))',
    ExpressionAttributeNames: {
      '#tagIds': 'tagIds',
    },
    ExpressionAttributeValues: { ':tagId': tagId },
  };
  return new Promise((resolve, reject) => {
    db.scan(params)
      .then((dbData) => {
        resolve(_.orderBy(dbData, m => m.timestamp, 'desc'));
      })
      .catch(error => reject(error));
  });
}

export function createMatch(args) {
  const params = {
    TableName,
    Item: {
      id: uuid(),
      tagIds: args.tag_ids,
      hashKey: args.hash_key,
      rangeKey: args.range_key,
      userIds: args.user_ids,
      lat: args.lat,
      long: args.long,
      timestamp: new Date().getTime().toString(),
    },
  };

  return db.createItem(params);
}

export function createMatches(ownLocation, paramsArray) {
  return new Promise((resolve, reject) => {
    const promises = paramsArray.map((match) => {
      let createMatchPromise;
      try {
        const foundedLocationCoords = JSON.parse(match.foundedLocation.geoJson.S);
        const { hashs, id } = match.tags[0];
        createMatchPromise = createMatch({
          tag_ids: [
            id,
            match.foundedLocation.tags.L.find(
              hashElement => hashElement.M.hashs.S === hashs).M.id.S,
          ],
          hash_key: match.foundedLocation.hashKey.N,
          range_key: match.foundedLocation.rangeKey.S,
          user_ids: [ownLocation.user, match.foundedLocation.user.S],
          lat: foundedLocationCoords.coordinates[0],
          long: foundedLocationCoords.coordinates[1],
        });
      } catch (error) {
        reject(`Could not parse coordinates  from foundedLocation or could not create match object: ${error}`);
      }
      return createMatchPromise;
    });
    Promise.all(promises)
      .then((allDbData) => {
        resolve(allDbData);
      })
      .catch(error => reject(error));
  });
}
