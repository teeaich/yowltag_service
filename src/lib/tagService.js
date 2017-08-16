/**
 * Created by ht3597 on 20.06.2017.
 */
import base64 from 'base-64';
import _ from 'lodash';
import async from 'async';

export function transformTagsForDB(tags) {
  if (tags.length) {
    return {
      L: tags.map((tag) => {
        const baseTransformedTag = {
          M: {
            hashs: { S: base64.encode(tag.hashs.sort().join(' ')) },
          },
        };
        if (tag.id) baseTransformedTag.M.id = { S: tag.id };
        return baseTransformedTag;
      }),
    };
  }
  return { L: [{ M: { hashs: { S: base64.encode(' ') } } }] };
}

export function transformTagsFromDB(tagsFromDb) {
  return tagsFromDb.L.map((tag) => {
    const baseTransformedTag = {
      hashs: tag.M.hashs.S,
    };
    if (tag.M.id) baseTransformedTag.id = tag.M.id.S;
    return baseTransformedTag;
  });
}

export function transformTagsForView(base64Tags) {
  if (base64Tags.length) {
    return base64Tags.map(hashObject => base64.decode(hashObject.hashs));
  }
  return [];
}

export function getIntersections(ownTags, locationTags) {
  console.log(`input of getIntersections: ownTags -> ${JSON.stringify(ownTags)} and locationTags -> ${JSON.stringify(locationTags)}`);
  const ownTagsAlone = ownTags.map(tag => tag.hashs);
  const locationsTagsAlone = locationTags.map(tag => tag.hashs);
  console.log(`ownTagsAlone: ${JSON.stringify(ownTagsAlone)}, locationTagsAlone: ${JSON.stringify(locationsTagsAlone)}`);
  const intersection =
    _.intersection(ownTagsAlone, locationsTagsAlone);
  console.log(`intersection of ${JSON.stringify(ownTagsAlone)} and ${JSON.stringify(locationsTagsAlone)} -> ${intersection}`);
  return intersection;
}


export function findMatchingTags(ownLocation, foundedLocations) {
  return new Promise((resolve, reject) => {
    let tagsFromOwnLocation = [];
    try {
      tagsFromOwnLocation = transformTagsFromDB(ownLocation.tags);
    } catch (error) {
      console.log(`${error}: own location doesn't come from SNS: Try to get manually the tags from created tags_raw.`);
      if (ownLocation.tags_raw) {
        // added
        console.log(JSON.stringify(ownLocation));
        tagsFromOwnLocation = transformTagsFromDB(ownLocation.tags_raw);
      } else {
        reject('tags_raw is neccessary to process findMatchingTags()');
      }
    }
    let foundedCompleteIntersectionInfo = [];
    async.filter(foundedLocations, (l, cb) => {
      const tagsFromFoundedLocations = transformTagsFromDB(l.tags);
      const intersection = getIntersections(tagsFromOwnLocation, tagsFromFoundedLocations);

      try {
        // TODO make new functions for this -> then test is possible
        if (intersection.length) {
          // Which of the own hashs had matched?
          const completeIntersectionInfo = intersection.map(matchedIntersection => (
            {
              tags: _.filter(tagsFromOwnLocation, tag => tag.hashs === matchedIntersection),
              foundedLocation: l,
            }
            ),
          );
          foundedCompleteIntersectionInfo =
            foundedCompleteIntersectionInfo.concat(completeIntersectionInfo);
          cb(null, true);
        } else {
          cb(null, false);
        }
      } catch (error) {
        cb(error);
      }
    }, (error, result) => {
      if (error) reject(error);
      resolve({
        filteredLocations: result,
        foundedCompleteIntersectionInfo });
    });
  });
}
