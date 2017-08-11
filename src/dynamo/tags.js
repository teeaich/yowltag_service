import uuid from 'uuid';
import * as db from './dynamo';

require('util').inspect.defaultOptions.depth = null;

const TableName = 'tags';

export function getTags() {
  const params = {
    TableName,
    AttributesToGet: [
      'id',
      'user_id',
      'hashs',
    ],
  };

  return db.scan(params);
}

export function getTagById(id) {
  const params = {
    TableName,
    Key: {
      id,
    },
  };

  return db.get(params);
}

export function getTagsByIds(tagIds) {
  return new Promise((resolve, reject) => {
    const promises = tagIds.map((tagId) => {
      const params = {
        TableName,
        Key: {
          id: tagId,
        },
      };
      return db.get(params);
    });
    Promise.all(promises)
      .then((allDbData) => {
        resolve(allDbData);
      })
      .catch(error => reject(error));
  });
}

export function getTagsByUser(userId) {
  const params = {
    TableName,
    FilterExpression: 'user_id = :user_id',
    ExpressionAttributeValues: { ':user_id': userId },
  };

  return db.scan(params);
}

export function createTag(args) {
  const params = {
    TableName,
    Item: {
      id: uuid(),
      user_id: args.user_id,
      hashs: args.hashs,
    },
  };

  return db.createItem(params);
}

export function updateTag(args) {
  const params = {
    TableName: 'tags',
    Key: {
      id: args.id,
    },
    ExpressionAttributeValues: {
      ':hashs': args.hashs,
    },
    UpdateExpression: 'SET hashs = :hashs',
    ReturnValues: 'ALL_NEW',
  };

  return db.updateItem(params, args);
}

export function deleteTag(args) {
  const params = {
    TableName,
    Key: {
      id: args.id,
    },
  };

  return db.deleteItem(params, args);
}
