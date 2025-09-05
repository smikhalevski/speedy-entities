import { createEntityDecoder } from './createEntityDecoder.js';
import htmlEntities from './html-entities.js';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entities: htmlEntities,
  isNumericReferenceSemicolonRequired: false,
});
