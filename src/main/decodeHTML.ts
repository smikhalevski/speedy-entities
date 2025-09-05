import { createEntityDecoder } from './createEntityDecoder.js';
import { createEntityMap } from './utils.js';
import htmlEntities from './gen/html-entities.js';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entities: createEntityMap(htmlEntities),
  maximumNamedReferenceLength: 32,
  isNumericReferenceSemicolonRequired: false,
});
