/**
 * Created by ht3597 on 20.06.2017.
 */
// import base64 from 'base-64';
const base64 = require('base-64');
const _ = require('lodash');
require('util').inspect.defaultOptions.depth = null;

function transformTagsForDB(tags) {
  if (tags.length) {
    const base64Hashs = tags.map(tag => base64.encode(tag.hashs.sort().join(' ')));
    return base64Hashs;
  }
  return [];
}

function transformTagsForView(base64Tags) {
  if (base64Tags.length) {
    const hashs = base64Tags.map(hash => base64.decode(hash));
    return hashs;
  }
  return [];
}

function findMatchingTags(ownLocation, foundedLocations) {
  return _.filter(foundedLocations, (l) => {
    const tagsFromFoundedLocations = l.tags.SS;
    const tagsFromOwnLocation = ownLocation.tags;
    const intersection = _.intersection(tagsFromOwnLocation, tagsFromFoundedLocations);
    console.log(`intersection of ${tagsFromOwnLocation} and ${tagsFromFoundedLocations} -> ${intersection}`);
    if (intersection.length) {
      l.tags.SS = intersection;
      return true;
    }
    return false;
  });
}

const testLocation = {
  id: '91ffa991-989c-4352-8a0b-c0d7e2b8bba7',
  lat: 50.07753,
  long: 8.222415,
  user: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
  tags: [
    'dGVzdCB0ZXN0Mg=2',
  ],
};

const testLocationQuery = [
  {
    hashKey: { N: '51' },
    geoJson: { S: "{'type':'POINT','coordinates':[8.222415,50.07753]}" },
    rangeKey: { S: '853508af-9a1b-4d51-abfd-96090b3e9148' },
    timestamp: { S: '1498066585445' },
    geohash: { N: '5169496911771223675' },
    user: { S: '153fe910-4e11-11e7-bf2f-07b66dcad40c' },
    tags: { SS: ['dGVzdCB0ZXN0Mg==', 'dGVzdCB0ZXN0Mg=2'] },
  },
  {
    hashKey: { N: '51' },
    geoJson: { S: "{'type':'POINT','coordinates':[8.222415,50.07753]}" },
    rangeKey: { S: '01914df8-0097-4e69-9560-379678fb6bdd' },
    timestamp: { S: '1498069981122' },
    geohash: { N: '5169496911771223675' },
    user: { S: '153fe910-4e11-11e7-bf2f-07b66dcad40c' },
    tags: { SS: ['dGVzdCB0ZXN0Mg=='] },
  }];

const test = [
  {
    hashs: ['test', 'test2'],
    id: 'c205c262-a3cf-48dd-87c6-cfab40f6f10e',
    user_id: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
  },
  {
    hashs: ['test3', 'test4'],
    id: 'c205c262-a3cf-48dd-87c6-cfab40f6f10e',
    user_id: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
  },
];
const testTransform = transformTagsForDB(test);
console.log(testTransform);

console.log(transformTagsForView(testTransform));

console.log(findMatchingTags(testLocation, testLocationQuery));