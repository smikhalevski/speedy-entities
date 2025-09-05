import { createEntityDecoder } from './createEntityDecoder.js';
import xmlEntities from './xml-entities.js';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  entities: xmlEntities,
  isNumericReferenceSemicolonRequired: true,
});
