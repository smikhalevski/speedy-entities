import { createEntityTrie } from './createEntityTrie.ts';
import { createEntityTrieDecoder } from './createEntityTrieDecoder.ts';
import htmlEntities from './html-entities.ts';

// Decoders share the trie, since it takes a few milliseconds to build and a few hundred kilobytes to store
const htmlEntityTrie = createEntityTrie(htmlEntities);

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
