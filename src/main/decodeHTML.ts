import { createEntityDecoder } from './createEntityDecoder';
import { unpackData } from './unpackData';
import htmlData from './gen/html-data';

/**
 * Decodes all known HTML entities and numeric character references in the input.
 */
export const decodeHTML = createEntityDecoder({
  entitiesTrie: unpackData(htmlData),
  numericReferenceSemicolonRequired: false,
});
