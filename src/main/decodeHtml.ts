import { createEntityDecoder } from './createEntityDecoder';
import { htmlEntities } from './htmlEntities';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHtml = createEntityDecoder({
  entities: htmlEntities,
});
