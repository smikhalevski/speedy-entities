import { createEntityDecoder } from './createEntityDecoder';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXml = createEntityDecoder({
  entities: {
    'amp;': '&',
    'apos;': "'",
    'gt;': '>',
    'lt;': '<',
    'quot;': '"',
  },
  numericReferenceSemicolonRequired: true,
});
