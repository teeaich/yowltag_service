import uuid from 'uuid/v1';
import * as db from './dynamo';

const TableName = 'records';

export function getRecords() {
  const params = {
    TableName,
    AttributesToGet: [
      'id',
      'user',
      'name',
      'timestamp',
    ],
  };

  return db.scan(params);
}

export function getRecordById(id) {
  const params = {
    TableName,
    Key: {
      id,
    },
  };
  return new Promise((resolve, reject) => {
    db.get(params)
      .then((dbData) => {
        // TODO add function for this
        //console.log(dbData.recordData[0]);
        //console.log(dbData.recordData[dbData.recordData.length - 1]);
        //const additionalDatawithDbData = dbData.map(record => Object.assign({}, record, { battery: 0.0, bgGeoConfig: 'not available' }));
        resolve(dbData);
      })
      .catch(error => reject(error));
  });
}

export function createRecord(args) {
  const params = {
    TableName,
    Item: {
      id: uuid(),
      user: args.user,
      name: args.name,
      timestamp: new Date().getTime().toString(),
    },
  };

  return db.createItem(params);
}

