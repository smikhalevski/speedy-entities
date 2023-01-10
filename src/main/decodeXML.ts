import { createEntityDecoder } from './createEntityDecoder';
import entitiesTrie from './gen/xml-entities-trie';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  entitiesTrie,
  numericReferenceSemicolonRequired: true,
});
