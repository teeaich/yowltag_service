import * as tagService from './tagService';

test('transform a DynamoDB tag list to simpler version', () => {
  const tags = {
    L: [
      {
        M: {
          hashs: {
            S: 'Z3JhcGhxbA==',
          },
          id: {
            S: '67ec8bd4-43c3-43b3-be67-6185b56c83b4',
          },
        },
      },
      {
        M: {
          hashs: {
            S: 'YXV0b3M=',
          },
          id: {
            S: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb',
          },
        },
      },
      {
        M: {
          hashs: {
            S: 'dGVzdDIgdGVzdDQ=',
          },
          id: {
            S: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d',
          },
        },
      },
    ],
  };
  expect(tagService.transformTagsFromDB(tags)).toEqual([
    {
      hashs: 'Z3JhcGhxbA==',
      id: '67ec8bd4-43c3-43b3-be67-6185b56c83b4',
    },
    {
      hashs: 'YXV0b3M=',
      id: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb',
    },
    {
      hashs: 'dGVzdDIgdGVzdDQ=',
      id: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d',
    }]);
});

test('transform a human readable tag list to DynamoDB compatible version with sorted hash values', () => {
  const humanReadableTags = [
    {
      hashs: ['graphql'],
      id: '67ec8bd4-43c3-43b3-be67-6185b56c83b4',
    },
    {
      hashs: ['autos'],
      id: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb',
    },
    {
      hashs: ['test4', 'test2'],
      id: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d',
    }];
  expect(tagService.transformTagsForDB(humanReadableTags)).toEqual({
    L: [
      {
        M: {
          hashs: {
            S: 'Z3JhcGhxbA==',
          },
          id: {
            S: '67ec8bd4-43c3-43b3-be67-6185b56c83b4',
          },
        },
      },
      {
        M: {
          hashs: {
            S: 'YXV0b3M=',
          },
          id: {
            S: 'f950fb61-88a1-4b3e-8b34-f90cc08cb7cb',
          },
        },
      },
      {
        M: {
          hashs: {
            S: 'dGVzdDIgdGVzdDQ=',
          },
          id: {
            S: 'e6dd30a1-4d27-4fb0-81a7-09fe1dcfe98d',
          },
        },
      },
    ],
  });
});

test('decode hash array to human readable strings in array', () => {
  const hashs = [{ hashs: 'dGVzdDIgdGVzdDQ=' }, { hashs: 'YXV0b3M=' }];
  expect(tagService.transformTagsForView(hashs)).toEqual(['test2 test4', 'autos']);
});

