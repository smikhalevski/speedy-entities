import { type DoubleArrayEntityTrie, type EntityTrie } from './createDoubleArrayEntityTrie.ts';
import type { createEntityTrie } from './createEntityTrie.ts';

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
 */
export function createEntityTrieDecoder(
  entityTrie: EntityTrie,
  options: EntityTrieDecoderOptions = {}
): (input: string) => string {
  const { nodes, nodeValueIndexes, values } = entityTrie as DoubleArrayEntityTrie;

  // Options are converted to booleans, so the decoder can test them with a comparison instead of a truthiness check
  const isNumericReferenceSemicolonRequired = options.isNumericReferenceSemicolonRequired === true;
  const areC1ControlsRemapped = options.areC1ControlsRemapped !== false;
  const isAttributeValue = options.isAttributeValue === true;

  return input => {
    const inputLength = input.length;

    // A reference is "&" followed by at least one char, so it can't start at the last char
    let ampersandIndex = inputLength > 1 ? input.indexOf('&') : -1;

    if (ampersandIndex === -1) {
      // Most text has no references
      return input;
    }

    // Decoders created by this function share their optimized code, so V8 doesn't know the values of closure
    // variables. Copied to locals, they are checked once per call instead of once per reference.
    const _nodes = nodes;
    const _nodeValueIndexes = nodeValueIndexes;
    const _values = values;
    const _isNumericReferenceSemicolonRequired = isNumericReferenceSemicolonRequired === true;
    const _areC1ControlsRemapped = areC1ControlsRemapped === true;
    const _isAttributeValue = isAttributeValue === true;

    // Reading the arrays before the loop lets V8 check their types once, instead of once per reference
    void _nodes.length;
    void _nodeValueIndexes.length;
    void _values.length;

    let output = '';
    let textStartIndex = 0;

    while (ampersandIndex !== -1 && ampersandIndex < inputLength - 1) {
      let startIndex = ampersandIndex + 1;

      let value: string | undefined;
      let endIndex = startIndex;

      // Reads below must stay in bounds: reading past the end of the input makes V8 deoptimize this function, and it
      // stays about twice as slow on short inputs afterwards
      let charCode = input.charCodeAt(startIndex);

      if (charCode === /* # */ 35 && startIndex !== inputLength - 1) {
        // Numeric character reference

        // All digits are consumed, out-of-range code points (Infinity included) are replaced with U+FFFD below
        let codePoint = 0;

        // The char after the digits, or -1 at the end of the input
        let terminatorCharCode = -1;

        if ((input.charCodeAt(++startIndex) | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);

            // Convert alpha to lower case
            const lowerCharCode = digitCharCode | 32;

            if (digitCharCode >= /* 0 */ 48 && digitCharCode <= /* 9 */ 57) {
              codePoint = codePoint * 16 + digitCharCode - 48;
            } else if (lowerCharCode >= /* a */ 97 && lowerCharCode <= /* f */ 102) {
              codePoint = codePoint * 16 + lowerCharCode - 87;
            } else {
              terminatorCharCode = digitCharCode;
              break;
            }
            ++endIndex;
          }
        } else {
          endIndex = startIndex;

          // parseInt of a decimal number
          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);

            if (digitCharCode >= /* 0 */ 48 && digitCharCode <= /* 9 */ 57) {
              codePoint = codePoint * 10 + digitCharCode - 48;
            } else {
              terminatorCharCode = digitCharCode;
              break;
            }
            ++endIndex;
          }
        }

        if (endIndex !== startIndex) {
          // At least one digit must be present

          const isTerminated = terminatorCharCode === /* ; */ 59;

          if (isTerminated || !_isNumericReferenceSemicolonRequired) {
            // Convert a code point to a string

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Null char code, or character reference is outside the permissible Unicode range
              value = '\uFFFD';
            } else if (_areC1ControlsRemapped && codePoint >= 0x80 && codePoint <= 0x9f) {
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

        let nodeIndex = 0;
        let index = startIndex;

        // The index of the node where the longest entity name read so far ends, or 0. Its value is read once, after
        // the loop, since reading the value at each node where a name ends makes decoding a few percent slower.
        let valueNodeIndex = 0;

        // Only ASCII chars have nodes, and base offsets keep baseOffset + charCode in bounds for them
        while (charCode < 128) {
          const childNodeIndex = _nodes[nodeIndex << 1] + charCode;
          const childCheck = _nodes[(childNodeIndex << 1) | 1];

          if (childCheck >> 1 !== nodeIndex) {
            // No entity name starts with chars read so far
            break;
          }

          nodeIndex = childNodeIndex;
          ++index;

          if ((childCheck & 1) === 1) {
            // An entity name ends at the node
            valueNodeIndex = nodeIndex;

            if (charCode === /* ; */ 59) {
              // No name continues past ";", so the char after it isn't read
              break;
            }
          }

          if (index === inputLength) {
            break;
          }
          charCode = input.charCodeAt(index);
        }

        if (valueNodeIndex !== 0) {
          value = _values[_nodeValueIndexes[valueNodeIndex]];
          endIndex = index;

          // The longest name can end before the last node read, like "not" in "&notit;". Each parent is one char back.
          // The loop doesn't track where the name ends: with one more variable, V8 can't keep them all in registers.
          for (let parentNodeIndex = nodeIndex; parentNodeIndex !== valueNodeIndex; --endIndex) {
            parentNodeIndex = _nodes[(parentNodeIndex << 1) | 1] >> 1;
          }

          if (_isAttributeValue && endIndex !== inputLength && input.charCodeAt(endIndex - 1) !== /* ; */ 59) {
            const nextCharCode = input.charCodeAt(endIndex);

            // An unterminated reference followed by "=" or an alphanumeric char is likely a URL query parameter
            if (nextCharCode === /* = */ 61 || isAlphanumericCharCode(nextCharCode)) {
              value = undefined;
            }
          }
        }
      }

      if (value !== undefined) {
        // Appending the preceding text and the value separately avoids joining them into a new string first. Once
        // the output is long enough to be a rope, each append only adds a node, even if the encodings differ.
        if (textStartIndex !== ampersandIndex) {
          output += input.slice(textStartIndex, ampersandIndex);
        }
        output += value;
        textStartIndex = endIndex;
      }

      if (endIndex >= inputLength - 1) {
        break;
      }

      // References often follow each other, and checking the next char is cheaper than calling indexOf
      if (value === undefined || input.charCodeAt(endIndex) !== /* & */ 38) {
        ampersandIndex = input.indexOf('&', endIndex);
      } else {
        ampersandIndex = endIndex;
      }
    }

    if (textStartIndex === 0) {
      return input;
    }
    if (textStartIndex === inputLength) {
      return output;
    }
    return output + input.slice(textStartIndex);
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
