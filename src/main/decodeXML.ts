import { createEntityDecoder } from './createEntityDecoder';
import xmlEntities from './gen/xml-entities';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  entities: xmlEntities,
  numericReferenceSemicolonRequired: true,
});
