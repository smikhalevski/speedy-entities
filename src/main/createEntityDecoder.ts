import {IEntityManager} from './createEntityManager';
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
export function createEntityDecoder(entityManager: IEntityManager, options?: IEntityDecoderOptions): (input: string) => string {
  options ||= {};

  const {
    numericCharacterReferenceTerminated,
    illegalCodePointsForbidden,
    replacementChar,
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

        let offset = 0;
        let charCode;
        let codePoint = 0;

        if (radixCharCode === 120 /* x */ || radixCharCode === 88 /* X */) {
          ++startIndex;

          while (offset < 6 && startIndex + offset < inputLength) {
            charCode = input.charCodeAt(startIndex + offset);

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
              codePoint = codePoint * 16 + (charCode - (charCode & 0b1110000));
              ++offset;
            } else if (charCode >= 97 /* a */ && charCode <= 102 /* f */ || charCode >= 65 /* A */ && charCode <= 70 /* F */) {
              codePoint = codePoint * 16 + (charCode - (charCode & 0b1110000)) + 9;
              ++offset;
            } else {
              break;
            }
          }

        } else {

          while (offset < 6 && startIndex + offset < inputLength) {
            charCode = input.charCodeAt(startIndex + offset);

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
              codePoint = codePoint * 10 + (charCode - (charCode & 0b1110000));
              ++offset;
            } else {
              break;
            }
          }

        }

        endIndex = startIndex;

        if (offset >= 2) {
          endIndex += offset;
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
