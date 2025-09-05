const fromCharCode = String.fromCharCode;

/**
 * The options recognized by {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions {
  entities?: Map<number, string>;

  maximumNamedReferenceLength?: number;

  /**
   * If `true` then [numeric character references](https://www.w3.org/TR/html4/charset.html#h-5.3.1) must be terminated
   * with a semicolon to be decoded. Otherwise, numeric character references are recognized even if they aren't
   * terminated with a semicolon.
   *
   * @default false
   */
  isNumericReferenceSemicolonRequired?: boolean;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities, maximumNamedReferenceLength = 32, isNumericReferenceSemicolonRequired = false } = options;

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

      let value: string | undefined;
      let endIndex = startIndex;
      let charCode = 0;

      if (startIndex < inputLength - 2 && input.charCodeAt(startIndex) === /* # */ 35) {
        // Numeric character reference

        let codePoint = 0;

        if ((input.charCodeAt(++startIndex) | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex - startIndex < 6 && endIndex < inputLength) {
            // Convert alpha to lower case
            charCode = input.charCodeAt(endIndex) | 32;

            if (
              (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) ||
              (charCode >= /* a */ 97 && charCode <= /* f */ 102)
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
            charCode = input.charCodeAt(endIndex) | 32;

            if (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) {
              codePoint = codePoint * 10 + charCode - (charCode & 112);
              ++endIndex;
            } else {
              break;
            }
          }
        }

        if (endIndex !== startIndex) {
          // At least one digit must present

          const isTerminated = endIndex < inputLength && input.charCodeAt(endIndex) === /* ; */ 59;

          if (isTerminated || !isNumericReferenceSemicolonRequired) {
            // Convert a code point to a string
            // https://github.com/mathiasbynens/he/blob/master/src/he.js#L106-L134

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Null char code, or character reference is outside the permissible Unicode range
              value = '\uFFFD';
            } else if (
              codePoint >= 128 &&
              codePoint <= 195 &&
              codePoint !== 129 &&
              codePoint !== 141 &&
              codePoint !== 143 &&
              codePoint !== 144 &&
              codePoint !== 157
            ) {
              // Overridden char code
              value = entityOverrides[codePoint];
            } else if (codePoint > 0xffff) {
              // Surrogate pair
              codePoint -= 0x10000;
              value = fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800, 0xdc00 | (codePoint & 0x3ff));
            } else {
              // Char code
              value = fromCharCode(codePoint);
            }
          }

          if (isTerminated) {
            ++endIndex;
          }
        }
      } else if (entities !== undefined) {
        // Named character reference

        for (let index = startIndex, hashCode = 0, nextValue; index < inputLength; ++index) {
          charCode = input.charCodeAt(index);

          if (
            charCode !== /* ; */ 59 &&
            (charCode < /* a */ 97 || charCode > /* z */ 122) &&
            (charCode < /* A */ 65 || charCode > /* Z */ 90)
          ) {
            break;
          }

          hashCode = (hashCode << 5) - hashCode + charCode;
          nextValue = entities.get(hashCode >>> 0);

          if (nextValue !== undefined) {
            value = nextValue;
            endIndex = index + 1;
          }

          if (charCode === /* ; */ 59 || index - startIndex >= maximumNamedReferenceLength) {
            break;
          }
        }
      }

      // Concat decoded entity and preceding substring
      if (value !== undefined) {
        output += textIndex === charIndex ? value : input.slice(textIndex, charIndex) + value;
        textIndex = endIndex;
      }

      charIndex = endIndex;
    }
    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
  };
}

// Standing on the shoulders of giants
// https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
const entityOverrides: { [codePoint: number]: string } = {
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
