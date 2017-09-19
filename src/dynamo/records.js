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
  return db.get(params);
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

