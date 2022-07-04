import { createEntityEncoder } from './createEntityEncoder';
import { htmlEntities } from './htmlEntities';

/**
 * Encodes HTML entities in the input with corresponding named character references.
 *
 * The produced output is _sensitive_ to character encoding.
 */
export const escapeHtml = createEntityEncoder({
  namedCharRefs: htmlEntities,
});

/**
 * Encodes HTML entities and non-ASCII characters in the input with corresponding named and numeric character
 * references.
 *
 * The produced output is _insensitive_ to character encoding.
 */
export const encodeHtml = createEntityEncoder({
  namedCharRefs: htmlEntities,
  numericCharRefs: [[0x80, 0xffff]],
});
