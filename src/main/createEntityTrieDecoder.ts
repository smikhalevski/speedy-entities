import { type DoubleArrayEntityTrie, type EntityTrie, getEntityValue } from './createDoubleArrayEntityTrie.ts';
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

  // The C1 option picks the table of values of numeric references, so the decoder doesn't test it. The decoder reads
  // the table from the closure: a local copy would be checked on each call, which slows down short inputs.
  const commonCharValues = options.areC1ControlsRemapped !== false ? remappedCommonCharValues : plainCommonCharValues;

  const isAttributeValue = options.isAttributeValue === true;

  // "&amp;" is the most common reference by far. If the trie decodes it as "&", like HTML does, the decoder matches it
  // with four char comparisons instead of walking the trie. No name continues past ";", so the trie can't find a longer
  // match.
  const isAmpersandMatched = getEntityValue(entityTrie, 'amp;') === '&';

  // The other references that XML predefines are the next most common ones, since escapers produce them. Their names
  // are compared directly too, and their values come from the trie, so a trie without them decodes them as before.
  const ltValue = getEntityValue(entityTrie, 'lt;');
  const gtValue = getEntityValue(entityTrie, 'gt;');
  const quotValue = getEntityValue(entityTrie, 'quot;');
  const aposValue = getEntityValue(entityTrie, 'apos;');

  // "&nbsp;" is common in HTML text, though escapers don't produce it, so its name is compared directly too
  const nbspValue = getEntityValue(entityTrie, 'nbsp;');

  return input => {
    const inputLength = input.length;

    // A reference is "&" followed by at least one char, so it can't start at the last char
    let ampersandIndex = -1;

    // Text of up to 8 chars is searched for "&" char by char: a call to indexOf costs about as much as reading 5 to 8
    // chars, and more if the input is a two-byte string, but reading longer text char by char is slower than indexOf.
    // The length is a literal, since V8 doesn't fold module constants, and reading one in the loop is slower.
    if (inputLength > 8) {
      ampersandIndex = input.indexOf('&');
    } else if (inputLength > 1) {
      ampersandIndex = 0;

      while (input.charCodeAt(ampersandIndex) !== /* & */ 38) {
        if (++ampersandIndex === inputLength - 1) {
          ampersandIndex = -1;
          break;
        }
      }
    }

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
    const _isAttributeValue = isAttributeValue === true;
    const _isAmpersandMatched = isAmpersandMatched === true;

    // Reading the arrays before the loop lets V8 check their types once, instead of once per reference
    void _nodes.length;
    void _nodeValueIndexes.length;
    void _values.length;

    let output = '';
    let textStartIndex = 0;

    // Each decoded reference appends its preceding text and its value to the output, and moves textStartIndex past
    // itself. Once the output is long enough to be a rope, each append only adds a node, even if the encodings differ.
    while (ampersandIndex !== -1 && ampersandIndex < inputLength - 1) {
      let startIndex = ampersandIndex + 1;

      // The index after the reference, or the index where the search for the next "&" starts if no reference is decoded
      let endIndex = startIndex;

      // Reads below must stay in bounds: reading past the end of the input makes V8 deoptimize this function, and it
      // stays about twice as slow on short inputs afterwards
      let charCode = input.charCodeAt(startIndex);

      if (charCode === /* # */ 35 && startIndex !== inputLength - 1) {
        // Numeric character reference

        // Digits past 0x10FFFF don't change the result, so the code point stops growing there and stays a small
        // integer, instead of overflowing to a float and making V8 deoptimize this function
        let codePoint = 0;

        // The char after the digits, or -1 if the digits end the input or there's no digit after "#"
        let terminatorCharCode = -1;

        charCode = input.charCodeAt(++startIndex);

        if ((charCode - /* 0 */ 48) >>> 0 <= 9) {
          // parseInt of a decimal number, the first digit is already read
          codePoint = charCode - /* 0 */ 48;
          endIndex = startIndex + 1;

          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);
            const digit = digitCharCode - /* 0 */ 48;

            if (digit >>> 0 > 9) {
              terminatorCharCode = digitCharCode;
              break;
            }
            if (codePoint < 0x110000) {
              // The result can't overflow, but V8 doesn't know it, and "| 0" saves its overflow checks
              codePoint = (codePoint * 10 + digit) | 0;
            }
            ++endIndex;
          }
        } else if ((charCode | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);

            // Unsigned comparisons check both ends of a char range at once, and "| 32" converts alpha to lower case
            let digit = digitCharCode - /* 0 */ 48;

            if (digit >>> 0 > 9) {
              digit = (digitCharCode | 32) - /* a */ 97;

              if (digit >>> 0 > 5) {
                terminatorCharCode = digitCharCode;
                break;
              }
              digit += 10;
            }
            if (codePoint < 0x110000) {
              codePoint = (codePoint * 16 + digit) | 0;
            }
            ++endIndex;
          }
        } else {
          // No digits
          endIndex = startIndex;
        }

        const isTerminated = terminatorCharCode === /* ; */ 59;

        // At least one digit must be present
        if (endIndex !== startIndex && (isTerminated || !_isNumericReferenceSemicolonRequired)) {
          let value;

          // Most references are to Latin-1 and General Punctuation chars. Reading their values from a table is cheaper
          // than String.fromCharCode, which allocates a string for a char past U+00FF, and the table already holds the
          // values of U+0000 and C1 controls, so they need no checks of their own.
          if (codePoint < 0x100) {
            value = commonCharValues[codePoint];
          } else if ((codePoint - 0x2000) >>> 0 < 0x70) {
            // U+2000 to U+206F follow the 0x100 Latin-1 chars in the table
            value = commonCharValues[codePoint - 0x1f00];
          } else if (codePoint < 0xd800) {
            value = String.fromCharCode(codePoint);
          } else if (codePoint <= 0xdfff || codePoint > 0x10ffff) {
            // Surrogate, or character reference is outside the permissible Unicode range
            value = '\uFFFD';
          } else {
            value = String.fromCodePoint(codePoint);
          }

          if (isTerminated) {
            ++endIndex;
          }

          // Appending the preceding text and the value separately avoids joining them into a new string first
          if (textStartIndex !== ampersandIndex) {
            output += input.slice(textStartIndex, ampersandIndex);
          }
          output += value;
          textStartIndex = endIndex;

          if (endIndex >= inputLength - 1) {
            break;
          }

          // References often follow each other, and checking the next char is cheaper than calling indexOf. Numeric
          // references often come in runs, like in text that an encoder escaped char by char, with spaces between
          // words, so the char after a space is checked too.
          charCode = input.charCodeAt(endIndex);

          if (charCode === /* & */ 38) {
            ampersandIndex = endIndex;
          } else if (charCode === /* space */ 32 && input.charCodeAt(endIndex + 1) === /* & */ 38) {
            ampersandIndex = endIndex + 1;
          } else {
            ampersandIndex = input.indexOf('&', endIndex + 1);
          }
          continue;
        }
      } else if (
        charCode === /* a */ 97 &&
        _isAmpersandMatched &&
        startIndex + 3 < inputLength &&
        input.charCodeAt(startIndex + 3) === /* ; */ 59 &&
        input.charCodeAt(startIndex + 1) === /* m */ 109 &&
        input.charCodeAt(startIndex + 2) === /* p */ 112
      ) {
        // "&amp;" is decoded as the "&" it starts with, so the preceding text and the value are one slice of the input
        output += textStartIndex !== ampersandIndex ? input.slice(textStartIndex, ampersandIndex + 1) : '&';
        endIndex = textStartIndex = startIndex + 4;

        if (endIndex >= inputLength - 1) {
          break;
        }

        ampersandIndex = input.charCodeAt(endIndex) === /* & */ 38 ? endIndex : input.indexOf('&', endIndex);
        continue;
      } else {
        // Character entity reference

        let value: string | undefined;

        // A name that ends with ";" is the longest match, since no name continues past ";", and the attribute value
        // rule doesn't apply to it
        if (charCode === /* l */ 108 || charCode === /* g */ 103) {
          if (
            startIndex + 2 < inputLength &&
            input.charCodeAt(startIndex + 2) === /* ; */ 59 &&
            input.charCodeAt(startIndex + 1) === /* t */ 116
          ) {
            value = charCode === /* l */ 108 ? ltValue : gtValue;
            endIndex = startIndex + 3;
          }
        } else if (charCode === /* q */ 113) {
          if (
            startIndex + 4 < inputLength &&
            input.charCodeAt(startIndex + 4) === /* ; */ 59 &&
            input.charCodeAt(startIndex + 1) === /* u */ 117 &&
            input.charCodeAt(startIndex + 2) === /* o */ 111 &&
            input.charCodeAt(startIndex + 3) === /* t */ 116
          ) {
            value = quotValue;
            endIndex = startIndex + 5;
          }
        } else if (charCode === /* a */ 97) {
          if (
            startIndex + 4 < inputLength &&
            input.charCodeAt(startIndex + 4) === /* ; */ 59 &&
            input.charCodeAt(startIndex + 1) === /* p */ 112 &&
            input.charCodeAt(startIndex + 2) === /* o */ 111 &&
            input.charCodeAt(startIndex + 3) === /* s */ 115
          ) {
            value = aposValue;
            endIndex = startIndex + 5;
          }
        } else if (charCode === /* n */ 110) {
          if (
            startIndex + 4 < inputLength &&
            input.charCodeAt(startIndex + 4) === /* ; */ 59 &&
            input.charCodeAt(startIndex + 1) === /* b */ 98 &&
            input.charCodeAt(startIndex + 2) === /* s */ 115 &&
            input.charCodeAt(startIndex + 3) === /* p */ 112
          ) {
            value = nbspValue;
            endIndex = startIndex + 5;
          }
        }

        if (value !== undefined) {
          if (textStartIndex !== ampersandIndex) {
            output += input.slice(textStartIndex, ampersandIndex);
          }
          output += value;
          textStartIndex = endIndex;

          if (endIndex >= inputLength - 1) {
            break;
          }

          ampersandIndex = input.charCodeAt(endIndex) === /* & */ 38 ? endIndex : input.indexOf('&', endIndex);
          continue;
        }

        // A trie without the name of a direct match decodes it below
        endIndex = startIndex;

        // Only ASCII chars have nodes, and base offsets keep baseOffset + charCode in bounds for them. The base offset
        // of the root is 0, so its child for a char is at the char code. The check of the root is -1, so a NUL char
        // isn't taken for its child. If no name starts with the char, nothing else is read.
        if (charCode < 128 && _nodes[(charCode << 1) | 1] >> 1 === 0) {
          let nodeIndex = charCode;
          let childNodeIndex = 0;

          // Without "| 0", V8 checks the sum for overflow, which can't happen since the index is below inputLength
          let index = (startIndex + 1) | 0;

          // The walk doesn't track the nodes where names end: each node has the value of the longest name that ends at
          // it or at its ancestors, so the longest match is read once, after the walk. Most names are short, so the
          // steps after the first one are unrolled twice, which saves the checks that V8 adds to each loop iteration.
          // No name starts with ";", so the first step can't end the name.
          walk: {
            if (index === inputLength) {
              break walk;
            }
            charCode = input.charCodeAt(index);

            if (charCode >= 128) {
              break walk;
            }

            // The second step. The sum is in bounds of the nodes, so "| 0" saves its overflow check too.
            childNodeIndex = (_nodes[nodeIndex << 1] + charCode) | 0;

            if (_nodes[(childNodeIndex << 1) | 1] >> 1 !== nodeIndex) {
              break walk;
            }

            nodeIndex = childNodeIndex;
            index = (index + 1) | 0;

            if (charCode === /* ; */ 59 || index === inputLength) {
              // No name continues past ";", so the char after it isn't read
              break walk;
            }
            charCode = input.charCodeAt(index);

            if (charCode >= 128) {
              break walk;
            }

            // The third step
            childNodeIndex = (_nodes[nodeIndex << 1] + charCode) | 0;

            if (_nodes[(childNodeIndex << 1) | 1] >> 1 !== nodeIndex) {
              break walk;
            }

            nodeIndex = childNodeIndex;
            index = (index + 1) | 0;

            if (charCode === /* ; */ 59 || index === inputLength) {
              break walk;
            }
            charCode = input.charCodeAt(index);

            // The rest of the steps
            while (charCode < 128) {
              childNodeIndex = (_nodes[nodeIndex << 1] + charCode) | 0;

              if (_nodes[(childNodeIndex << 1) | 1] >> 1 !== nodeIndex) {
                break;
              }

              nodeIndex = childNodeIndex;
              index = (index + 1) | 0;

              if (charCode === /* ; */ 59 || index === inputLength) {
                break;
              }
              charCode = input.charCodeAt(index);
            }
          }

          const valueIndex = _nodeValueIndexes[nodeIndex];

          if (valueIndex !== 0) {
            endIndex = index;

            // The longest name can end before the last node read, like "not" in "&notit;". Each parent is one char back,
            // and the low bit of the check is set at the node where the name ends. "check | 1" is the index of the check
            // of the parent.
            for (let check = _nodes[(nodeIndex << 1) | 1]; (check & 1) === 0; --endIndex) {
              check = _nodes[check | 1];
            }

            // In attribute values, an unterminated reference followed by "=" or an alphanumeric char is likely a URL
            // query parameter, and isn't decoded
            if (
              !_isAttributeValue ||
              endIndex === inputLength ||
              input.charCodeAt(endIndex - 1) === /* ; */ 59 ||
              !isQueryParameterCharCode(input.charCodeAt(endIndex))
            ) {
              const value = _values[valueIndex];

              if (textStartIndex !== ampersandIndex) {
                output += input.slice(textStartIndex, ampersandIndex);
              }
              output += value;
              textStartIndex = endIndex;

              if (endIndex >= inputLength - 1) {
                break;
              }

              ampersandIndex = input.charCodeAt(endIndex) === /* & */ 38 ? endIndex : input.indexOf('&', endIndex);
              continue;
            }
          }
        }
      }

      // No reference is decoded. The chars before endIndex can't start a reference, so the search starts at endIndex.
      if (endIndex >= inputLength - 1) {
        break;
      }

      if (inputLength - endIndex > 8) {
        ampersandIndex = input.indexOf('&', endIndex);
      } else {
        // The rest of the input is short, so it's searched char by char, see the first search above
        ampersandIndex = endIndex;

        while (input.charCodeAt(ampersandIndex) !== /* & */ 38) {
          if (++ampersandIndex === inputLength - 1) {
            ampersandIndex = -1;
            break;
          }
        }
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

/**
 * Values of numeric references to U+0000 to U+00FF, followed by U+2000 to U+206F: General Punctuation has the dashes,
 * curly quotes and ellipsis that are the most common references past Latin-1. U+0000 is decoded as U+FFFD.
 */
const plainCommonCharValues: string[] = [];

for (let codePoint = 0; codePoint < 0x100; ++codePoint) {
  plainCommonCharValues.push(codePoint === 0 ? '\uFFFD' : String.fromCharCode(codePoint));
}
for (let codePoint = 0x2000; codePoint < 0x2070; ++codePoint) {
  plainCommonCharValues.push(String.fromCharCode(codePoint));
}

/**
 * Same as {@linkcode plainCommonCharValues}, but with C1 controls decoded as Windows-1252 chars.
 */
const remappedCommonCharValues = plainCommonCharValues.slice(0);

for (let i = 0; i < c1ControlValues.length; ++i) {
  remappedCommonCharValues[0x80 + i] = c1ControlValues[i];
}

/**
 * Returns `true` for "=" and ASCII letters and digits, which can follow an unterminated reference in a URL query.
 */
function isQueryParameterCharCode(charCode: number): boolean {
  return charCode === /* = */ 61 || ((charCode | 32) - /* a */ 97) >>> 0 <= 25 || (charCode - /* 0 */ 48) >>> 0 <= 9;
}
