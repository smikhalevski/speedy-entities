import { createEntityDecoder } from './createEntityDecoder';
import { createEntityEncoder } from './createEntityEncoder';

export const xmlNamedCharRefs = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

/**
 * Decodes XML entities in a string.
 */
export const decodeXml = createEntityDecoder({
  namedCharRefs: xmlNamedCharRefs,
  numericCharRefSemicolonRequired: true,
});

export const encodeXml = createEntityEncoder({
  namedCharRefs: xmlNamedCharRefs,
});
