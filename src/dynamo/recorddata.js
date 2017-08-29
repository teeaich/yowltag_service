import uuid from 'uuid/v1';
import _ from 'lodash';
import * as db from './dynamo';

const TableName = 'recorddata';

export function getRecorddata() {
  const params = {
    TableName,
    AttributesToGet: [
      'id',
      'recordId',
      'lat',
      'long',
      'timestamp',
      'dataObject',
      'bgGeoConfig',
    ],
  };

  return db.scan(params);
}

export function getRecorddataByRecordId(recordId) {
  const params = {
    TableName,
    FilterExpression: '#record = :record_id',
    ExpressionAttributeNames: {
      '#record': 'recordId',
    },
    ExpressionAttributeValues: { ':record_id': recordId },
  };
  return new Promise((resolve, reject) => {
    db.scan(params)
      .then((dbData) => {
        // TODO make new function for that
        const defaultBattery = {
          battery: {
            level: 0,
          },
        };
        const orderedRecorddata = _.orderBy(dbData, m => m.timestamp, 'desc');
        let parsedFirstRecorddata;
        let parsedLastRecorddata;
        let bgGeoConfig;
        try {
          parsedFirstRecorddata = JSON.parse(orderedRecorddata[0].dataObject);
          parsedLastRecorddata = JSON.parse(orderedRecorddata[dbData.length - 1].dataObject);
        } catch (error) {
          parsedFirstRecorddata = defaultBattery;
          parsedLastRecorddata = defaultBattery;
        }
        try {
          bgGeoConfig = orderedRecorddata[0].bgGeoConfig;
        } catch (error) {
          bgGeoConfig = 'not available';
        }
        resolve({
          batteryDrain: parseFloat(
            parsedLastRecorddata.battery.level - parsedFirstRecorddata.battery.level,
          ),
          bgGeoConfig,
          data: orderedRecorddata,
        });
      })
      .catch(error => reject(error));
  });
}

export function createRecorddata(args) {
  const params = {
    TableName,
    Item: {
      id: uuid(),
      recordId: args.recordId,
      lat: args.lat,
      long: args.long,
      timestamp: new Date().getTime().toString(),
      dataObject: args.dataObject,
      bgGeoConfig: args.bgGeoConfig,
    },
  };

  return db.createItem(params);
}

