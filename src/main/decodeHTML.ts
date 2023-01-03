import { createEntityDecoder } from './createEntityDecoder';
import htmlEntities from './gen/html-entities';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entities: htmlEntities,
  numericReferenceSemicolonRequired: false,
});
