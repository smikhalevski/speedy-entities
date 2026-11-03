import { createEntityTrie } from './createEntityDecoder.js';
import { createEntityTrieDecoder } from './createEntityTrieDecoder.js';
import htmlEntities from './html-entities.js';

// Decoders share the trie, since it takes a few milliseconds to build and a few hundred kilobytes to store
const htmlEntityTrie = createEntityTrie(htmlEntities);

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityTrieDecoder(htmlEntityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
});

/**
 * Same as {@linkcode decodeHTML}, but decodes an HTML attribute value, where an unterminated named entity followed by
 * "=" or an ASCII alphanumeric char isn't decoded. For example, "?a=1&copy=2" is preserved as is.
 */
export const decodeHTMLAttribute = createEntityTrieDecoder(htmlEntityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
  isAttributeValue: true,
});
