import type { createEntityTrie, EntityTrie } from './createEntityTrie.ts';
import { isDoubleArrayTrie } from './DoubleArrayTrie.ts';

/**
 * Options of {@linkcode createEntityTrieDecoder}.
 */
export interface EntityTrieDecoderOptions {
  /**
   * If `true`, numeric references are decoded only if they end with ";", as XML requires.
   *
   * @default false
   */
  isNumericReferenceSemicolonRequired?: boolean;

  /**
   * If `true`, numeric references to C1 controls (U+0080 to U+009F) are decoded as Windows-1252 chars,
   * [as HTML does](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state). For
   * example, "&#128;" is decoded as the euro sign instead of U+0080.
   *
   * @default true
   */
  areC1ControlsRemapped?: boolean;

  /**
   * If `true`, a named reference without ";" isn't decoded if "=" or an ASCII letter or digit follows it,
   * [as HTML does in attribute values](https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state).
   * This keeps URL query strings like "?a=1&copy=2" intact.
   *
   * @default false
   */
  isAttributeValue?: boolean;
}

/**
 * Creates a decoder that uses a trie from {@linkcode createEntityTrie}, so decoders that differ only in options can
 * share a trie.
 *
 * @throws Error if the trie isn't created by {@linkcode createEntityTrie}.
 */
export function createEntityTrieDecoder(
  entityTrie: EntityTrie,
  options: EntityTrieDecoderOptions = {}
): (input: string) => string {
  if (!isDoubleArrayTrie(entityTrie)) {
    throw new Error('entityTrie must be created by createEntityTrie');
  }

  const {
    isNumericReferenceSemicolonRequired = false,
    areC1ControlsRemapped = true,
    isAttributeValue = false,
  } = options;

  const { nodeBases, nodeChecks, nodeValueIndexes, values } = entityTrie;

  return input => {
    let output = '';

    let textIndex = 0;

    const inputLength = input.length;

    // A reference is "&" followed by at least one char, so it can't start at the last char
    let charIndex = inputLength > 1 ? input.indexOf('&') : -1;

    while (charIndex !== -1 && charIndex < inputLength - 1) {
      let startIndex = charIndex + 1;

      let value: string | undefined;
      let endIndex = startIndex;

      // Both reads below must stay in bounds: reading past the end of the input makes V8 deoptimize this function,
      // and it stays about twice as slow on short inputs afterwards
      if (startIndex < inputLength - 1 && input.charCodeAt(startIndex) === /* # */ 35) {
        // Numeric character reference

        // All digits are consumed, out-of-range code points (Infinity included) are replaced with U+FFFD below
        let codePoint = 0;

        if ((input.charCodeAt(++startIndex) | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex < inputLength) {
            const charCode = input.charCodeAt(endIndex);

            // Convert alpha to lower case
            const lowerCharCode = charCode | 32;

            if (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) {
              codePoint = codePoint * 16 + charCode - 48;
            } else if (lowerCharCode >= /* a */ 97 && lowerCharCode <= /* f */ 102) {
              codePoint = codePoint * 16 + lowerCharCode - 87;
            } else {
              break;
            }
            ++endIndex;
          }
        } else {
          endIndex = startIndex;

          // parseInt of a decimal number
          while (endIndex < inputLength) {
            const charCode = input.charCodeAt(endIndex);

            if (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) {
              codePoint = codePoint * 10 + charCode - 48;
            } else {
              break;
            }
            ++endIndex;
          }
        }

        if (endIndex !== startIndex) {
          // At least one digit must be present

          const isTerminated = endIndex < inputLength && input.charCodeAt(endIndex) === /* ; */ 59;

          if (isTerminated || !isNumericReferenceSemicolonRequired) {
            // Convert a code point to a string

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Null char code, or character reference is outside the permissible Unicode range
              value = '\uFFFD';
            } else if (areC1ControlsRemapped && codePoint >= 0x80 && codePoint <= 0x9f) {
              value = c1ControlValues[codePoint - 0x80];
            } else {
              value = String.fromCodePoint(codePoint);
            }
          }

          if (isTerminated) {
            ++endIndex;
          }
        }
      } else {
        // Character entity reference

        let index = startIndex;
        let node = 0;

        // The node where the longest entity name read so far ends, or 0. Its value is read once, after the loop, since
        // reading the value at each node where a name ends makes decoding a few percent slower.
        let valueNode = 0;

        while (index < inputLength) {
          const charCode = input.charCodeAt(index);

          // Only ASCII chars have nodes, and bases keep base + charCode in bounds for them
          if (charCode > 127) {
            break;
          }

          const childNode = nodeBases[node] + charCode;
          const childCheck = nodeChecks[childNode];

          if (childCheck >> 1 !== node) {
            // No entity name starts with chars read so far
            break;
          }

          node = childNode;
          ++index;

          if ((childCheck & 1) === 1) {
            // An entity name ends at the node
            valueNode = node;
            endIndex = index;
          }
        }

        if (valueNode !== 0) {
          value = values[nodeValueIndexes[valueNode]];
        }

        if (
          isAttributeValue &&
          value !== undefined &&
          endIndex < inputLength &&
          input.charCodeAt(endIndex - 1) !== /* ; */ 59
        ) {
          const charCode = input.charCodeAt(endIndex);

          // An unterminated reference followed by "=" or an alphanumeric char is likely a URL query parameter
          if (charCode === /* = */ 61 || isAlphanumericCharCode(charCode)) {
            value = undefined;
          }
        }
      }

      if (value !== undefined) {
        // Appending the preceding text and the value separately avoids joining them into a new string first. Once
        // the output is long enough to be a rope, each append only adds a node, even if the encodings differ.
        if (textIndex !== charIndex) {
          output += input.slice(textIndex, charIndex);
        }
        output += value;
        textIndex = endIndex;
      }

      if (endIndex >= inputLength - 1) {
        break;
      }

      // Entities often follow each other, and checking the next char is cheaper than calling indexOf
      if (value === undefined || input.charCodeAt(endIndex) !== /* & */ 38) {
        charIndex = input.indexOf('&', endIndex);
      } else {
        charIndex = endIndex;
      }
    }
    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
  };
}

/**
 * Windows-1252 chars for U+0080 to U+009F. Code points that Windows-1252 leaves undefined map to themselves.
 *
 * @see https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
 */
// prettier-ignore
const c1ControlValues = [
  '\u20AC', '\u0081', '\u201A', '\u0192', '\u201E', '\u2026', '\u2020', '\u2021',
  '\u02C6', '\u2030', '\u0160', '\u2039', '\u0152', '\u008D', '\u017D', '\u008F',
  '\u0090', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022', '\u2013', '\u2014',
  '\u02DC', '\u2122', '\u0161', '\u203A', '\u0153', '\u009D', '\u017E', '\u0178',
];

function isAlphanumericCharCode(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57)
  );
}
