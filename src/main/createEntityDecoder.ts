import { Trie, trieCreate, trieSearch, trieSet } from '@smikhalevski/trie';

interface CharRef {
  value: string;
  legacy: boolean;
}

export interface Dict {
  [name: string]: string;
}

export interface EntityDecoderOptions {
  /**
   * A map from a char reference name to its value. Char references, listed in this map, must be terminated with a
   * semicolon.
   *
   * @see https://www.w3.org/TR/2011/WD-html5-20110525/named-character-references.html Named character references on W3C
   */
  namedCharRefs?: Dict;

  /**
   * A map from a char reference name to its value. Char references, listed in this map, would be still recognized,
   * even if they aren't terminated with a semicolon.
   */
  legacyNamedCharRefs?: Dict;

  /**
   * If `true` then numeric character references must be terminated with a semicolon to be decoded. Otherwise, numeric
   * character references are recognized even if they are not terminated with a semicolon.
   *
   * @default false
   */
  numericCharRefSemicolonRequired?: boolean;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { namedCharRefs, legacyNamedCharRefs, numericCharRefSemicolonRequired = false } = options;

  const charRefTrie = appendCharRef(legacyNamedCharRefs, true, appendCharRef(namedCharRefs, false, null));

  return input => {
    let output = '';

    let textIndex = 0;
    let charIndex = 0;

    const inputLength = input.length;

    while (charIndex < inputLength - 1) {
      let startIndex = input.indexOf('&', charIndex);
      if (startIndex === -1) {
        break;
      }

      charIndex = startIndex++;

      let charRefValue: string | null = null;
      let endIndex = startIndex;

      if (startIndex < inputLength - 2 && input.charCodeAt(startIndex) === 35 /* # */) {
        // Numeric character reference

        let charCode = 0;
        let codePoint = 0;

        if ((input.charCodeAt(++startIndex) | 32) === 120 /* x */) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex - startIndex < 6 && endIndex < inputLength) {
            // Convert alpha to lower case
            charCode = input.charCodeAt(endIndex) | 32;

            if (
              (charCode >= 48 /* 0 */ && charCode <= 57) /* 9 */ ||
              (charCode >= 97 /* a */ && charCode <= 102) /* f */
            ) {
              // Convert "0" → 0 and "f" → 15
              codePoint = codePoint * 16 + charCode - (charCode & 112) + (charCode >> 6) * 9;
              ++endIndex;
            } else {
              break;
            }
          }
        } else {
          endIndex = startIndex;

          // parseInt of a decimal number
          while (endIndex - startIndex < 6 && endIndex < inputLength) {
            charCode = input.charCodeAt(endIndex) | 0;

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
              codePoint = codePoint * 10 + charCode - (charCode & 112);
              ++endIndex;
            } else {
              break;
            }
          }
        }

        if (endIndex !== startIndex) {
          // At least one digit must present

          const terminated = endIndex < inputLength && input.charCodeAt(endIndex) === 59; /* ; */

          if (terminated || !numericCharRefSemicolonRequired) {
            // Convert a code point to a string
            // https://github.com/mathiasbynens/he/blob/master/src/he.js#L106-L134

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Character reference is 0, or outside the permissible Unicode range
              charRefValue = '\uFFFD';
            } else if (
              codePoint >= 128 &&
              codePoint <= 195 &&
              codePoint !== 129 &&
              codePoint !== 141 &&
              codePoint !== 143 &&
              codePoint !== 144 &&
              codePoint !== 157
            ) {
              // Overridden code point
              charRefValue = overrides[codePoint];
            } else {
              charRefValue = String.fromCodePoint(codePoint);
            }
          }

          if (terminated) {
            ++endIndex;
          }
        }
      } else if (charRefTrie !== null) {
        // Named character reference

        const trie = trieSearch(charRefTrie, input, startIndex);

        if (trie !== null) {
          endIndex += trie.key!.length;

          const charRef = trie.value!;
          const terminated = endIndex < inputLength && input.charCodeAt(endIndex) === 59; /* ; */

          if (terminated || charRef.legacy) {
            charRefValue = charRef.value;
          }
          if (terminated) {
            ++endIndex;
          }
        }
      }

      // Concat decoded entity and preceding substring
      if (charRefValue !== null) {
        output += textIndex === charIndex ? charRefValue : input.substring(textIndex, charIndex) + charRefValue;
        textIndex = endIndex;
      }

      charIndex = endIndex;
    }
    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.substring(textIndex);
  };
}

function appendCharRef(charRefs: Dict | undefined, legacy: boolean, trie: Trie<CharRef> | null): Trie<CharRef> | null {
  if (charRefs == null) {
    return trie;
  }

  const entries = Object.entries(charRefs);
  if (entries.length === 0) {
    return trie;
  }

  trie ||= trieCreate();

  for (const [name, value] of entries) {
    trieSet(trie, name, { value, legacy });
  }
  return trie;
}

// Standing on the shoulders of giants
// https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
const overrides: { [codePoint: number]: string } = {
  128: '\u20AC',
  130: '\u201A',
  131: '\u0192',
  132: '\u201E',
  133: '\u2026',
  134: '\u2020',
  135: '\u2021',
  136: '\u02C6',
  137: '\u2030',
  138: '\u0160',
  139: '\u2039',
  140: '\u0152',
  142: '\u017D',
  145: '\u2018',
  146: '\u2019',
  147: '\u201C',
  148: '\u201D',
  149: '\u2022',
  150: '\u2013',
  151: '\u2014',
  152: '\u02DC',
  153: '\u2122',
  154: '\u0161',
  155: '\u203A',
  156: '\u0153',
  158: '\u017E',
  159: '\u0178',
};
