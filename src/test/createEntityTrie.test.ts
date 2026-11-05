import { describe, expect, test } from 'vitest';
import { createEntityTrie } from '../main/createEntityTrie.ts';
import { createEntityTrieDecoder } from '../main/createEntityTrieDecoder.ts';
import type { DoubleArrayTrie } from '../main/DoubleArrayTrie.ts';

describe('createEntityTrie', () => {
  test('keeps the child of any ASCII char in bounds', () => {
    // A long chain after the last node with several children
    const { nodeBases, nodeChecks } = createEntityTrie({
      'a-z': 'aaa',
      aaa: 'bbb',
      ['z'.repeat(300)]: 'ccc',
    }) as DoubleArrayTrie;

    for (let node = 0; node < nodeChecks.length; ++node) {
      if (node === 0 || nodeChecks[node] !== -1) {
        expect(nodeBases[node]).toBeGreaterThanOrEqual(0);
        expect(nodeBases[node] + 127).toBeLessThan(nodeChecks.length);
      }
    }
  });

  test('places every name when nodes do not pack tightly', () => {
    const alphabet = '-.:_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const entities: Record<string, string> = {};

    // Every node of the first level has a child for every char, so children are spread out
    for (const a of alphabet) {
      for (const b of alphabet) {
        entities[a + b] = a + b + '!';
      }
    }

    const decode = createEntityTrieDecoder(createEntityTrie(entities));

    for (const name of Object.keys(entities)) {
      expect(decode('&' + name)).toBe(name + '!');
    }
  });

  test('decodes every value of a table that has more than 65536 values', () => {
    const entities: Record<string, string> = {};

    // One value more than 2-byte indexes can address
    for (let i = 0; i <= 0x10000; ++i) {
      entities['a' + i + ';'] = 'b' + i;
    }

    let input = '';
    let output = '';

    for (const [entityReference, value] of Object.entries(entities)) {
      input += '&' + entityReference;
      output += value;
    }

    expect(createEntityTrieDecoder(createEntityTrie(entities))(input)).toBe(output);
  });
});
