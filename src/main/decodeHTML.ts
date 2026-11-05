import { createEntityTrieDecoder } from './createEntityTrieDecoder.ts';
import { buildDoubleArrayTrie } from './DoubleArrayTrie.ts';
import htmlEntities from './html-entities.ts';

// The list of HTML entities is sorted and valid, so the trie is built without checking it. Decoders share the trie,
// since it takes a few milliseconds to build and about 120 kB to store.
const htmlEntityTrie = buildDoubleArrayTrie(htmlEntities);

/**
 * Decodes HTML entities and numeric references in text.
 */
export const decodeHTML = createEntityTrieDecoder(htmlEntityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
});

/**
 * Same as {@linkcode decodeHTML}, but for attribute values: like browsers, it doesn't decode a named reference without
 * ";" if "=" or an ASCII letter or digit follows it, so "?a=1&copy=2" stays intact.
 */
export const decodeHTMLAttribute = createEntityTrieDecoder(htmlEntityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
  isAttributeValue: true,
});
