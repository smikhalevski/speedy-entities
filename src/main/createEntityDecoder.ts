import {EntityManager} from './EntityManager';
import {fromCodePoint} from './fromCodePoint';

export interface IEntityDecoderOptions {

  /**
   * If `true` then numeric character references must be terminated with a semicolon.
   *
   * @default false
   */
  numericCharacterReferenceTerminated?: boolean;

  /**
   * If `true` then an error is thrown when an illegal code point is met.
   *
   * @default false
   * @see {@link https://en.wikipedia.org/wiki/Valid_characters_in_XML Valid characters in XML on Wikipedia}
   */
  illegalCodePointsForbidden?: boolean;

  /**
   * The char that is used instead of the illegal code point.
   *
   * @default "\ufffd"
   */
  replacementChar?: string;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param entityManager An entity manager that defines named entities.
 * @param options The decoder options.
 */
export function createEntityDecoder(entityManager: EntityManager, options?: IEntityDecoderOptions): (input: string) => string {
  options ||= {};

  const {
    numericCharacterReferenceTerminated = false,
    illegalCodePointsForbidden = false,
    replacementChar = '\ufffd',
  } = options;

  return (input) => {

    let output = '';

    let textIndex = 0;
    let charIndex = 0;

    const inputLength = input.length;

    while (charIndex < inputLength) {

      let startIndex = input.indexOf('&', charIndex);
      if (startIndex === -1) {
        break;
      }

      charIndex = startIndex;

      let entityValue;
      let endIndex;

      // Numeric character reference
      if (input.charCodeAt(++startIndex) === 35 /* # */) {

        const radixCharCode = input.charCodeAt(++startIndex);

        let charCode;
        let digitCount = 0;
        let codePoint = 0;

        if (radixCharCode === 120 /* x */ || radixCharCode === 88 /* X */) {
          endIndex = ++startIndex;

          // Parse hexadecimal
          while (digitCount < 6 && endIndex < inputLength) {
            charCode = input.charCodeAt(endIndex);

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
              codePoint = codePoint * 16 + (charCode - (charCode & 0b1110000));
              ++digitCount;
              ++endIndex;
            } else if (charCode >= 97 /* a */ && charCode <= 102 /* f */ || charCode >= 65 /* A */ && charCode <= 70 /* F */) {
              codePoint = codePoint * 16 + (charCode - (charCode & 0b1110000)) + 9;
              ++digitCount;
              ++endIndex;
            } else {
              break;
            }
          }

        } else {
          endIndex = startIndex;

          // Parse decimal
          while (digitCount < 6 && endIndex < inputLength) {
            charCode = input.charCodeAt(endIndex);

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
              codePoint = codePoint * 10 + (charCode - (charCode & 0b1110000));
              ++digitCount;
              ++endIndex;
            } else {
              break;
            }
          }

        }

        if (digitCount >= 2) {
          const terminated = input.charCodeAt(endIndex) === 59 /* ; */;

          if (terminated || !numericCharacterReferenceTerminated) {
            entityValue = fromCodePoint(codePoint, replacementChar, illegalCodePointsForbidden);
          }
          if (terminated) {
            ++endIndex;
          }
        }

      } else {
        // Named character reference
        endIndex = startIndex;

        const entity = entityManager.search(input, startIndex);

        if (entity != null) {
          endIndex += entity.name.length;

          const terminated = input.charCodeAt(endIndex) === 59 /* ; */;

          if (terminated) {
            ++endIndex;
          }
          if (terminated || entity.legacy) {
            entityValue = entity.value;
          }
        }
      }

      if (entityValue != null) {
        output += textIndex !== charIndex ? input.substring(textIndex, charIndex) + entityValue : entityValue;
        textIndex = endIndex;
      }

      charIndex = endIndex;
    }
    if (textIndex === 0) {
      return input;
    }
    if (textIndex !== inputLength) {
      output += input.substring(textIndex);
    }
    return output;
  };
}