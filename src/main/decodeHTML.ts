import { createEntityDecoder } from './createEntityDecoder';
import entitiesTrie from './gen/html-entities-trie';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entitiesTrie,
  numericReferenceSemicolonRequired: false,
});
