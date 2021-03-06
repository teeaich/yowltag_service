import * as dbLocations from '../dynamo/locations';
import * as dbUsers from '../dynamo/users';
import * as dbTags from '../dynamo/tags';
import * as dbMatches from '../dynamo/matches';
import * as dbRecords from '../dynamo/records';
import * as dbRecorddata from '../dynamo/recorddata';

const resolvers = {
  Query: {
    locationsMatch: (_, args) => dbLocations.getLocationsMatch(args),
    location: (_, args) => dbLocations.getLocationsById(args),
    record: (_, args) => dbRecords.getRecordById(args.id),
    records: () => dbRecords.getRecords(),
    users: () => dbUsers.getUsers(),
    user: (_, args) => dbUsers.getUserById(args.id),
    tag: (_, args) => dbTags.getTagById(args.id),
    tagsByUser: (_, args) => dbTags.getTagsByUser(args.user_id),
    match: (_, args) => dbMatches.getMatchesById(args.id),
  },
  Mutation: {
    createLocation: (_, args) => dbLocations.createLocation(args),
    createRecord: (_, args) => dbRecords.createRecord(args),
    createRecorddata: (_, args) => dbRecorddata.createRecorddata(args),
    createLocationsWithGeoJson: (_, args) => dbLocations.createLocationsWithGeoJson(args),
    updateLocation: (_, args) => dbLocations.updateLocation(args),
    deleteLocation: (_, args) => dbLocations.deleteLocation(args),
    createUser: (_, args) => dbUsers.createUser(args),
    updateUser: (_, args) => dbUsers.updateUser(args),
    deleteUser: (_, args) => dbUsers.deleteUser(args),
    createTag: (_, args) => dbTags.createTag(args),
    updateTag: (_, args) => dbTags.updateTag(args),
    deleteTag: (_, args) => dbTags.deleteTag(args),
    createMatch: (_, args) => dbMatches.createMatch(args),
  },
  Location: {
    user: location => dbUsers.getUserById(location.user),
    tags: location => dbTags.getTagsByUser(location.user),
  },
  User: {
    locations: user => dbLocations.getLocationsByUser(user.id),
    tags: user => dbTags.getTagsByUser(user.id),
  },
  Tag: {
    matches: tag => dbMatches.getMatchesByTag(tag.id),
  },
  Match: {
    tags: match => dbTags.getTagsByIds(match.tagIds),
    users: match => dbUsers.getUsersByIds(match.userIds),
  },
  Record: {
    user: record => dbUsers.getUserById(record.user),
    recordData: record => dbRecorddata.getRecorddataByRecordId(record.id),
  },
};

export default resolvers;
