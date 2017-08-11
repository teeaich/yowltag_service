/**
 * Created by ht3597 on 13.06.2017.
 */

require('util').inspect.defaultOptions.depth = null;
const ddbGeo = require('dynamodb-geo');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const ddb = new AWS.DynamoDB();
const configDdb = new ddbGeo.GeoDataManagerConfiguration(ddb, 'locations');
const locationManager = new ddbGeo.GeoDataManager(configDdb);

locationManager.queryRadius({
  RadiusInMeter: 300,
  CenterPoint: {
    // this is home
    latitude: 50.077549,
    longitude: 8.222009,
  },
  QueryInput: {
    FilterExpression: '#user <> :user',
    ExpressionAttributeNames: {
      '#user': 'user',
    },
    ExpressionAttributeValues: {
      ':user': { S: '540ef351-d8da-4362-9278-2584511e4421' },
    },
  }
  ,
})
// Print the results, an array of DynamoDB.AttributeMaps
  .then((data) => {
    console.log(data);
    console.log(`Counter: ${data.length}`);
  });

locationManager.getPoint({
  RangeKeyValue: { S: '00180e50-470e-46df-9c64-bff5d07e1f55' }
})
  .then((dbData) => {

  });