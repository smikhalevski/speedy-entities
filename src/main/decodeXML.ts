import { createEntityDecoder } from './createEntityDecoder.js';
import { createEntityMap } from './utils.js';
import xmlEntities from './gen/xml-entities.js';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  entities: createEntityMap(xmlEntities),
  maximumNamedReferenceLength: 5,
  isNumericReferenceSemicolonRequired: true,
});
