import { createDoubleArrayEntityTrie } from './createDoubleArrayEntityTrie.ts';
import { createEntityTrieDecoder } from './createEntityTrieDecoder.ts';
import entities from './entities.ts';

const entityTrie = createDoubleArrayEntityTrie(entities);

/**
 * Decodes HTML entities and numeric references in text.
 */
export const decodeHTML = createEntityTrieDecoder(entityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
});

/**
 * Same as {@linkcode decodeHTML}, but for attribute values: like browsers, it doesn't decode a named reference without
 * ";" if "=" or an ASCII letter or digit follows it, so "?a=1&copy=2" stays intact.
 */
export const decodeHTMLAttribute = createEntityTrieDecoder(entityTrie, {
  isNumericReferenceSemicolonRequired: false,
  areC1ControlsRemapped: true,
  isAttributeValue: true,
});
