import { describe, expect, test } from 'vitest';
import { createEntityTrie } from '../main/createEntityTrie.ts';
import { createEntityTrieDecoder } from '../main/createEntityTrieDecoder.ts';

describe('createEntityTrieDecoder', () => {
  test('decoders that share a trie use their own options', () => {
    const entityTrie = createEntityTrie({ aaa: 'bbb' });

    const decode = createEntityTrieDecoder(entityTrie);
    const decodeAttribute = createEntityTrieDecoder(entityTrie, { isAttributeValue: true });

    expect(decode('&aaa=')).toBe('bbb=');
    expect(decodeAttribute('&aaa=')).toBe('&aaa=');
  });

  test('throws if the trie is not created by createEntityTrie', () => {
    const entityTrie = {
      nodeBases: new Int32Array(256),
      nodeChecks: new Int32Array(256).fill(-1),
      nodeValueIndexes: new Uint16Array(256),
      values: [],
    };

    // @ts-expect-error The trie has the layout, but not the brand
    expect(() => createEntityTrieDecoder(entityTrie)).toThrow('entityTrie must be created by createEntityTrie');
  });
});
