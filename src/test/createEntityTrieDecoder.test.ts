import { describe, expect, test } from 'vitest';
import { createEntityTrie } from '../main/createEntityTrie.js';
import { createEntityTrieDecoder } from '../main/createEntityTrieDecoder.js';

describe('createEntityTrieDecoder', () => {
  test('decoders that share a trie use their own options', () => {
    const entityTrie = createEntityTrie({ aaa: 'bbb' });

    const decode = createEntityTrieDecoder(entityTrie);
    const decodeAttribute = createEntityTrieDecoder(entityTrie, { isAttributeValue: true });

    expect(decode('&aaa=')).toBe('bbb=');
    expect(decodeAttribute('&aaa=')).toBe('&aaa=');
  });
});
