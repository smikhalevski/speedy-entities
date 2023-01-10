import { createEntityDecoder } from './createEntityDecoder';
import htmlEntitiesTrie from './gen/htmlEntitiesTrie';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entitiesTrie: htmlEntitiesTrie,
  numericReferenceSemicolonRequired: false,
});
