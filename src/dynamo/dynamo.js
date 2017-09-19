import AWS from 'aws-sdk';

const ddbGeo = require('dynamodb-geo');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ddb = new AWS.DynamoDB();

/*
export function scan(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.scan(params).promise()
      .then(data => resolve(data.Items))
      .catch(err => reject(err)),
  );
}
*/

export async function scan(params) {
  let result;
  try {
    result = await dynamoDb.scan(params).promise();
  } catch (error) {
    console.log(`Error in dynamoDB scan: ${error}`);
    result = error;
  }
  return result.Items;
}


export async function get(params) {
  let result;
  try {
    result = await dynamoDb.get(params).promise();
  } catch (error) {
    console.log(`Error in dynamoDB get: ${error}`);
    result = error;
  }
  return result.Item;
}

export async function createItem(params) {
  let result = params.Item;
  try {
    await dynamoDb.put(params).promise();
  } catch (error) {
    console.log(`Error in dynamoDB put: ${error}`);
    result = error;
  }
  return result;
}

export async function createLocation(params, TableName) {
  const configDdb = new ddbGeo.GeoDataManagerConfiguration(ddb, TableName);
  const locationManager = new ddbGeo.GeoDataManager(configDdb);
  try {
    await locationManager.putPoint(params).promise();
  } catch (error) {
    console.log(`Error in createLocation: ${error}`);
    return error;
  }
  return params;
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
      for (let i = 0, itemToAdd = null;
           i < BATCH_SIZE && (itemToAdd = featureParams.shift());
           i++) {
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

export async function updateItem(params, args) {
  let result;
  try {
    await dynamoDb.update(params).promise();
    result = args;
  } catch (error) {
    console.log(`Error in dynamoDB update: ${error}`);
    result = error;
  }
  return result;
}

export function deleteItem(params, args) {
  return new Promise((resolve, reject) =>
    dynamoDb.delete(params).promise()
      .then(() => resolve(args))
      .catch(err => reject(err)),
  );
}
