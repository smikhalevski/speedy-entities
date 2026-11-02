import { expect, test } from 'vitest';
import { createEntityTrie } from '../main/createEntityDecoder.js';

test('sizes the edge table by the max load factor', () => {
  // 10 edges
  const entities = { aaaaaaaaaa: 'bbb' };

  expect(createEntityTrie(entities).edgeKeys.length).toBe(32);
  expect(createEntityTrie(entities, { maxLoadFactor: 0.7 }).edgeKeys.length).toBe(16);
});

test('throws if the max load factor is invalid', () => {
  expect(() => createEntityTrie({}, { maxLoadFactor: 1 })).toThrow(
    'maxLoadFactor must be greater than 0 and less than 1'
  );
});
