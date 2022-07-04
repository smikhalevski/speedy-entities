import { createEntityDecoder } from './createEntityDecoder';

export const xmlEntities = {
  'amp;': '&',
  'apos;': "'",
  'gt;': '>',
  'lt;': '<',
  'quot;': '"',
};

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXml = createEntityDecoder({
  entities: xmlEntities,
  numericReferenceSemicolonRequired: true,
});
