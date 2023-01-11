import { createEntityDecoder } from './createEntityDecoder';
import xmlEntitiesTrie from './gen/xmlEntitiesTrie';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  entitiesTrie: xmlEntitiesTrie,
  numericReferenceSemicolonRequired: true,
});
