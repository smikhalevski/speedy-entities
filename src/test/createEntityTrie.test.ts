import { describe, expect, test } from 'vitest';
import type { DoubleArrayEntityTrie } from '../main/createDoubleArrayEntityTrie.ts';
import { createEntityTrie } from '../main/createEntityTrie.ts';
import { createEntityTrieDecoder } from '../main/createEntityTrieDecoder.ts';

// The chars that entity names can have
const nameChars = '-.:_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Two-char names: each of the first firstCharCount name chars, followed by childCount pseudo-random chars from the
 * first childCharCount name chars.
 */
function makeTestEntities(options: { firstCharCount: number; childCount: number; childCharCount: number }) {
  const { firstCharCount, childCount, childCharCount } = options;

  const entities: Record<string, string> = {};

  // A fixed seed keeps the table the same in every run
  let seed = 1;

  for (const a of nameChars.slice(0, firstCharCount)) {
    for (let i = 0; i < childCount; ++i) {
      seed = (seed * 48271) % 0x7fffffff;

      const name = a + nameChars[seed % childCharCount];

      entities[name] = name + '!';
    }
  }

  return entities;
}

function expectToDecodeEveryName(entities: Record<string, string>) {
  const decode = createEntityTrieDecoder(createEntityTrie(entities));

  for (const name of Object.keys(entities)) {
    expect(decode('&' + name)).toBe(entities[name]);
  }
}

describe('createEntityTrie', () => {
  test('keeps the child of any ASCII char in bounds', () => {
    // A long chain after the last node with several children
    const { nodeBases, nodeChecks } = createEntityTrie({
      'a-z': 'aaa',
      aaa: 'bbb',
      ['z'.repeat(300)]: 'ccc',
    }) as DoubleArrayEntityTrie;

    for (let node = 0; node < nodeChecks.length; ++node) {
      if (node === 0 || nodeChecks[node] !== -1) {
        expect(nodeBases[node]).toBeGreaterThanOrEqual(0);
        expect(nodeBases[node] + 127).toBeLessThan(nodeChecks.length);
      }
    }
  });

  test('places every name when long searches spread nodes apart', () => {
    const entities: Record<string, string> = {};

    // Every node of the first level has a child for every char, so searches for unused indexes are long
    for (const a of nameChars) {
      for (const b of nameChars) {
        entities[a + b] = a + b + '!';
      }
    }

    // The last node placed has one child, so it lands below the nodes that long searches placed
    entities['zza'] = 'zza!';
    entities['zza;'] = 'zza;!';

    expectToDecodeEveryName(entities);
  });

  test('places every name when the last node with several children lands below the others', () => {
    // Nodes of the first level have a few children, which land ever higher above the first level, until the last node
    // fits into a hole near the bottom
    expectToDecodeEveryName(makeTestEntities({ firstCharCount: 36, childCount: 3, childCharCount: 36 }));
  });

  test('places every name when the arrays have to grow', () => {
    // Children at pseudo-random chars leave holes that other nodes rarely fit into, so nodes need more indexes than
    // names have chars
    expectToDecodeEveryName(makeTestEntities({ firstCharCount: 66, childCount: 25, childCharCount: 66 }));
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
