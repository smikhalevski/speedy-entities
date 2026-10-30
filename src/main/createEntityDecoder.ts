/**
 * The options recognized by {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions {
  /**
   * Mapping from an [character entity reference](https://www.w3.org/TR/html4/charset.html#h-5.3.2) to its decoded value.
   * Entity references should contain only [a-zA-Z0-9] and may optionally start with an ampersand "&" and end with
   * a semicolon ";". An error is thrown if an entity reference is invalid.
   *
   * ```json
   * {
   *   "&Delta;": "\u0394",
   *   "LongRightArrow;": "\u27F6"
   * }
   * ```
   */
  entities?: Record<string, string>;

  /**
   * If `true` then [numeric character references](https://www.w3.org/TR/html4/charset.html#h-5.3.1) must be terminated
   * with a semicolon to be decoded. Otherwise, numeric character references are recognized even if they aren't
   * terminated with a semicolon.
   *
   * @default false
   */
  isNumericReferenceSemicolonRequired?: boolean;

  /**
   * If `true` then numeric character references to C1 control characters (U+0080 to U+009F) are decoded as
   * Windows-1252 characters, [as HTML does](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state).
   * For example, "&#128;" is decoded as "\u20AC" instead of "\u0080". XML doesn't do this.
   *
   * @default true
   */
  areC1ControlsRemapped?: boolean;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities, isNumericReferenceSemicolonRequired = false, areC1ControlsRemapped = true } = options;

  const entityDereferenceMap = new Map<number, string>();

  let maximumEntityReferenceLength = 0;

  if (entities !== undefined) {
    for (const entity in entities) {
      if (!isEntityReference(entity)) {
        throw new Error('Invalid entity reference: ' + entity);
      }

      // Skip the leading ampersand
      const startIndex = entity.charCodeAt(0) === /* & */ 38 ? 1 : 0;

      maximumEntityReferenceLength = Math.max(maximumEntityReferenceLength, entity.length - startIndex);
      entityDereferenceMap.set(getHashCode(entity, startIndex, entity.length), entities[entity]);
    }
  }

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
          // At least one digit must present

          const isTerminated = endIndex < inputLength && input.charCodeAt(endIndex) === /* ; */ 59;

          if (isTerminated || !isNumericReferenceSemicolonRequired) {
            // Convert a code point to a string
            // https://github.com/mathiasbynens/he/blob/master/src/he.js#L106-L134

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Null char code, or character reference is outside the permissible Unicode range
              value = '\uFFFD';
            } else if (areC1ControlsRemapped && codePoint >= 0x80 && codePoint <= 0x9f) {
              // Some C1 controls don't have a Windows-1252 counterpart and are preserved
              value = c1ControlMap.get(codePoint) ?? String.fromCharCode(codePoint);
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
        let hash1 = HASH1_SEED;
        let hash2 = HASH2_SEED;

        while (index < inputLength && index - startIndex < maximumEntityReferenceLength) {
          const charCode = input.charCodeAt(index);

          if (charCode !== /* ; */ 59 && !isEntityNameChar(charCode)) {
            break;
          }

          ++index;

          // Same as getHashCode, but computed incrementally
          hash1 = Math.imul(hash1, 33) ^ charCode;
          hash2 = Math.imul(hash2, 65_599) ^ charCode;

          const referencedValue = entityDereferenceMap.get((hash2 >>> 11) * 0x100000000 + (hash1 >>> 0));

          if (referencedValue !== undefined) {
            value = referencedValue;
            endIndex = index;
          }

          if (charCode === /* ; */ 59) {
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
const c1ControlMap = new Map([
  [128, '\u20AC'],
  [130, '\u201A'],
  [131, '\u0192'],
  [132, '\u201E'],
  [133, '\u2026'],
  [134, '\u2020'],
  [135, '\u2021'],
  [136, '\u02C6'],
  [137, '\u2030'],
  [138, '\u0160'],
  [139, '\u2039'],
  [140, '\u0152'],
  [142, '\u017D'],
  [145, '\u2018'],
  [146, '\u2019'],
  [147, '\u201C'],
  [148, '\u201D'],
  [149, '\u2022'],
  [150, '\u2013'],
  [151, '\u2014'],
  [152, '\u02DC'],
  [153, '\u2122'],
  [154, '\u0161'],
  [155, '\u203A'],
  [156, '\u0153'],
  [158, '\u017E'],
  [159, '\u0178'],
]);

const HASH1_SEED = 5_381;
const HASH2_SEED = 52_711;

function getHashCode(input: string, startIndex: number, endIndex: number): number {
  let hash1 = HASH1_SEED;
  let hash2 = HASH2_SEED;

  for (let i = startIndex; i < endIndex; ++i) {
    const charCode = input.charCodeAt(i);

    hash1 = Math.imul(hash1, 33) ^ charCode;
    hash2 = Math.imul(hash2, 65_599) ^ charCode;
  }

  return (hash2 >>> 11) * 0x100000000 + (hash1 >>> 0);
}

function isEntityReference(entity: string): boolean {
  const startIndex = entity.charCodeAt(0) === /* & */ 38 ? 1 : 0;

  // Semicolon is optional, but if present must be the last char
  const endIndex = entity.charCodeAt(entity.length - 1) === /* ; */ 59 ? entity.length - 1 : entity.length;

  if (startIndex >= endIndex) {
    return false;
  }

  for (let index = startIndex; index < endIndex; ++index) {
    const charCode = entity.charCodeAt(index);

    if (!isEntityNameChar(charCode)) {
      return false;
    }
  }
  return true;
}

function isEntityNameChar(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57)
  );
}
