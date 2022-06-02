import {EntityManager} from './EntityManager';
import {fromCodePoint} from './fromCodePoint';

export interface IEntityDecoderOptions {

  /**
   * An entity manager that defines named entities.
   */
  entityManager?: EntityManager;

  /**
   * If `true` then numeric character references must be terminated with a semicolon to be decoded. Otherwise, numeric
   * character references are recognized even if they are not terminated with a semicolon.
   *
   * @default false
   */
  numericCharacterReferenceTerminated?: boolean;

  /**
   * If `true` then an error is thrown when an illegal code point is met. Otherwise, a {@link replacementChar} would be
   * used instead.
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
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options?: IEntityDecoderOptions): (input: string) => string {
  options ||= {};

  const {
    entityManager = null,
    numericCharacterReferenceTerminated = false,
    illegalCodePointsForbidden = false,
    replacementChar = '\ufffd',
  } = options;

  return function entityDecoder(input) {

    let output: string | null = null;

    let textIndex = 0;
    let charIndex = 0;

    const inputLength = input.length;

    while (charIndex < inputLength - 1) {

      let startIndex = input.indexOf('&', charIndex);
      if (startIndex === -1) {
        break;
      }

      charIndex = startIndex++;

      let entityValue: string | null = null;
      let endIndex = startIndex;

      // Numeric character reference
      if (startIndex < inputLength - 2 && input.charCodeAt(startIndex) === 35 /* # */) {

        let charCode = 0;
        let codePoint = 0;

        if ((input.charCodeAt(++startIndex) | 32) === 120 /* x */) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex - startIndex < 6 && endIndex < inputLength) {

            // Convert alpha to lower case
            charCode = input.charCodeAt(endIndex) | 32;

            if (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */ || charCode >= 97 /* a */ && charCode <= 102 /* f */) {
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

        if (endIndex - startIndex >= 2) {
          const terminated = endIndex < inputLength && input.charCodeAt(endIndex) === 59 /* ; */;

          if (terminated || !numericCharacterReferenceTerminated) {
            entityValue = fromCodePoint(codePoint, replacementChar, illegalCodePointsForbidden);
          }
          if (terminated) {
            ++endIndex;
          }
        }

      } else if (entityManager !== null) {
        // Named character reference

        const entity = entityManager.getByName(input, startIndex);

        if (entity !== undefined) {
          endIndex += entity.name.length;

          const terminated = endIndex < inputLength && input.charCodeAt(endIndex) === 59 /* ; */;

          if (terminated) {
            ++endIndex;
          }
          if (terminated || entity.legacy) {
            entityValue = entity.value;
          }
        }
      }

      // Concat decoded entity and preceding substring
      if (entityValue !== null) {
        const str = textIndex === charIndex ? entityValue : input.substring(textIndex, charIndex) + entityValue;
        output = output === null ? str : output + str;
        textIndex = endIndex;
      }

      charIndex = endIndex;
    }
    return output === null ? input : textIndex === inputLength ? output : output + input.substring(textIndex);
  };
}
