import uuid from 'uuid/v1';
import * as db from './dynamo';

const TableName = 'users';

export function getUsers() {
  const params = {
    TableName,
    AttributesToGet: [
      'id',
      'username',
      'first_name',
      'last_name',
      'tags',
    ],
  };

  return db.scan(params);
}

export function getUserById(id) {
  const params = {
    TableName,
    Key: {
      id,
    },
  };

  return db.get(params);
}

export function getUsersByIds(userIds) {
  return new Promise((resolve, reject) => {
    const promises = userIds.map((userId) => {
      const params = {
        TableName,
        Key: {
          id: userId,
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

export function createUser(args) {
  const params = {
    TableName,
    Item: {
      id: uuid(),
      username: args.username,
      first_name: args.first_name,
      last_name: args.last_name,
    },
  };

  return db.createItem(params);
}

export function updateUser(args) {
  const params = {
    TableName: 'users',
    Key: {
      id: args.id,
    },
    ExpressionAttributeValues: {
      ':username': args.username,
      ':first_name': args.first_name,
      ':last_name': args.last_name,
    },
    UpdateExpression: 'SET first_name = :first_name, last_name = :last_name, username = :username',
    ReturnValues: 'ALL_NEW',
  };

  return db.updateItem(params, args);
}

export function deleteUser(args) {
  const params = {
    TableName,
    Key: {
      id: args.id,
    },
  };

  return db.deleteItem(params, args);
}
