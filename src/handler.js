if (process.env.NODE_ENV === 'local') {
  /* eslint-disable */
  require("babel-register");
  /* eslint-enable */
}
/* eslint-disable */
import fs from 'fs';
import path from 'path';
import server from 'graphql-server-lambda';
import { mergeStrings } from 'gql-merge';
import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './data/resolvers';
import * as matchService from './lib/matchService';
import * as dbLocations from './dynamo/locations';
import * as dbMatches from './dynamo/matches';
/* eslint-enable */

const typesDir = path.resolve(__dirname, 'data/types');
const typeFiles = fs.readdirSync(typesDir);
const types = typeFiles.map(file => fs.readFileSync(path.join(typesDir, file), 'utf-8'));
const typeDefs = mergeStrings(types);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

exports.graphql = (event, context, callback) => {
  const callbackFilter = (error, output) => {
    const outputWithHeader = Object.assign({}, output, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
    callback(error, outputWithHeader);
  };

  server.graphqlLambda({ schema })(event, context, callbackFilter);
};

exports.findMatches = (event, context, callback) => {
  // print out the event information on the console (so that we can see it in the CloudWatch logs)
  let message;
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (error) {
    console.log('Could not parse SNS Message');
  }
  console.log(`SNS trigger meta: ${message.meta}`);
  console.log(`SNS trigger data: ${JSON.stringify(message.data)}`);
  const ownLocation = {
    lat: message.data.GeoPoint.latitude,
    long: message.data.GeoPoint.longitude,
    user: message.data.PutItemInput.Item.user.S,
    tags: message.data.PutItemInput.Item.tags,
  };
  console.log(`Call matchService.queryAndFindMatches with: ${JSON.stringify(ownLocation)}`);
  const promise = matchService.queryAndFindMatches(ownLocation);
  promise
    .then((foundedLocations) => {
      // callback(null, `Found following locations: ${JSON.stringify(foundedLocations)}`);
      console.log(`Found following locations: ${JSON.stringify(foundedLocations)}`);
      // TODO: still to implement - use a new table with id/tag_id/location_id/timestamp
      // maxbe an security issue that the client will see all the location infos from other user
      // graphql should be responsible to query the elements itself.
      dbMatches.createMatches(ownLocation, foundedLocations)
        .then(dbData => callback(null, dbData));
    })
    .catch((error) => {
      callback(error);
    });
};

exports.cleanupLocations = (event, context, callback) => {
  console.log(`DynamoDB Stream trigger for event; ${JSON.stringify(event)}`);
  console.log(`There are ${event.Records.length} event(s) to process.`);
  const promise = dbLocations.cleanupLocations(event.Records);
  promise
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
};

