import AWS from 'aws-sdk';

const ddbGeo = require('dynamodb-geo');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ddb = new AWS.DynamoDB();

export function scan(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.scan(params).promise()
      .then(data => resolve(data.Items))
      .catch(err => reject(err)),
  );
}

export function get(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.get(params).promise()
      .then(data => resolve(data.Item))
      .catch(err => reject(err)),
  );
}

export function createItem(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.put(params).promise()
      .then(() => resolve(params.Item))
      .catch(err => reject(err)),
  );
}

export function createLocation(params, TableName) {
  const configDdb = new ddbGeo.GeoDataManagerConfiguration(ddb, TableName);
  const locationManager = new ddbGeo.GeoDataManager(configDdb);
  return new Promise((resolve, reject) =>
    locationManager.putPoint(params).promise()
      .then(() => {
        resolve(params);
      })
      .catch(err => reject(err)),
  );
}

export function createLocationsFromGeoJson(featureParams, TableName) {
  const configDdb = new ddbGeo.GeoDataManagerConfiguration(ddb, TableName);
  const locationManager = new ddbGeo.GeoDataManager(configDdb);
  return new Promise((resolve, reject) => {
    const BATCH_SIZE = 25;
    const WAIT_BETWEEN_BATCHES_MS = 1000;
    let currentBatch = 1;
    const clonedFeatureParams = JSON.parse(JSON.stringify(featureParams));

    function resumeWriting() {
      if (featureParams.length === 0) {
        return resolve(clonedFeatureParams);
      }
      const thisBatch = [];
      for (let i = 0, itemToAdd = null; i < BATCH_SIZE && (itemToAdd = featureParams.shift()); i++) {
        thisBatch.push(itemToAdd);
      }
      console.log(`This batch output: ${JSON.stringify(thisBatch)}`);
      console.log('Writing batch ' + (currentBatch++) + '/' + Math.ceil(clonedFeatureParams.length / BATCH_SIZE));
      return locationManager.batchWritePoints(thisBatch).promise()
        .then(() => {
          return new Promise((innerResolve) => {
            setInterval(innerResolve, WAIT_BETWEEN_BATCHES_MS);
          });
        })
        .then(() => resumeWriting());
    }

    return resumeWriting().catch((error) => {
      console.warn(error);
    });
  });
}

export function updateItem(params, args) {
  return new Promise((resolve, reject) =>
    dynamoDb.update(params).promise()
      .then(() => resolve(args))
      .catch(err => reject(err)),
  );
}

export function deleteItem(params, args) {
  return new Promise((resolve, reject) =>
    dynamoDb.delete(params).promise()
      .then(() => resolve(args))
      .catch(err => reject(err)),
  );
}
