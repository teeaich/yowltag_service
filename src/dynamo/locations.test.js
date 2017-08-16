import * as locations from './locations';

test('filter only matched tags from founded locations', () => {
  const singleTagArray = [
    { hashs: 'YXV0b3M=',
      id: 'a3e5af70-15af-4fde-b3a7-d4ef1f9c5873' }];
  const foundedLocationTagArray = [
    { hashs: 'Z3JhcGhxbA==',
      id: '67ec8bd4-43c3-43b3-be67-6185b56c83b4' },
    { hashs: 'YXV0b3M=',
      id: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb' },
    { hashs: 'dGVzdDIgdGVzdDQ=',
      id: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d' }];
  expect(locations
    .getTagsFromIntersectionLocation(singleTagArray, foundedLocationTagArray))
    .toEqual(singleTagArray);
});

test('Create array of graphql locations after match process', () => {
  const foundedCompleteIntersectionInfo = [
    {
      tags: [
        {
          hashs: 'YXV0b3M=',
          id: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb',
        },
      ],
      foundedLocation: {
        hashKey: {
          N: '51',
        },
        geoJson: {
          S: '{"type":"POINT","coordinates":[8.2221725,50.07750598]}',
        },
        rangeKey: {
          S: 'bbbbd027-5a31-4398-8d13-710186765a5d',
        },
        timestamp: {
          S: '1502448596776',
        },
        geoHash: {
          N: '5169496934666750809',
        },
        user: {
          S: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
        },
        tags: {
          L: [
            {
              M: {
                hashs: {
                  S: 'dGVzdDMgdGVzdDQ=',
                },
                id: {
                  S: '6ec7b875-9a7f-444b-83b2-4d3c4b88a856',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'YXV0b3M=',
                },
                id: {
                  S: 'a3e5af70-15af-4fde-b3a7-d4ef1f9c5873',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'dGVzdDIgdGVzdDQ=',
                },
                id: {
                  S: '8ca3f5ce-be9d-4c24-b560-8fc9bb762032',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'dGVzdCB0ZXN0Mg==',
                },
                id: {
                  S: 'c205c262-a3cf-48dd-87c6-cfab40f6f10e',
                },
              },
            },
          ],
        },
      },
    },
    {
      tags: [
        {
          hashs: 'dGVzdDIgdGVzdDQ=',
          id: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d',
        },
      ],
      foundedLocation: {
        hashKey: {
          N: '51',
        },
        geoJson: {
          S: '{"type":"POINT","coordinates":[8.2221725,50.07750598]}',
        },
        rangeKey: {
          S: 'bbbbd027-5a31-4398-8d13-710186765a5d',
        },
        timestamp: {
          S: '1502448596776',
        },
        geoHash: {
          N: '5169496934666750809',
        },
        user: {
          S: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
        },
        tags: {
          L: [
            {
              M: {
                hashs: {
                  S: 'dGVzdDMgdGVzdDQ=',
                },
                id: {
                  S: '6ec7b875-9a7f-444b-83b2-4d3c4b88a856',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'YXV0b3M=',
                },
                id: {
                  S: 'a3e5af70-15af-4fde-b3a7-d4ef1f9c5873',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'dGVzdDIgdGVzdDQ=',
                },
                id: {
                  S: '8ca3f5ce-be9d-4c24-b560-8fc9bb762032',
                },
              },
            },
            {
              M: {
                hashs: {
                  S: 'dGVzdCB0ZXN0Mg==',
                },
                id: {
                  S: 'c205c262-a3cf-48dd-87c6-cfab40f6f10e',
                },
              },
            },
          ],
        },
      },
    },
  ];

  const graphqlResult = [
    {
      hash_key: '51',
      range_key: 'bbbbd027-5a31-4398-8d13-710186765a5d',
      lat: 50.07750598,
      long: 8.2221725,
      user: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
      hashs: [
        'autos',
      ],
    },
    {
      hash_key: '51',
      range_key: 'bbbbd027-5a31-4398-8d13-710186765a5d',
      lat: 50.07750598,
      long: 8.2221725,
      user: '153fe910-4e11-11e7-bf2f-07b66dcad40c',
      hashs: [
        'test2 test4',
      ],
    },
  ];
  expect(locations
    .buildLocationsForMatch(foundedCompleteIntersectionInfo))
    .toEqual(graphqlResult);
});
