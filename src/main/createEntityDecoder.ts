import {allCharBy, CharCodeChecker, ResultCode} from 'tokenizer-dsl';
import {CharCode} from './CharCode';
import {IEntityManager} from './createEntityManager';
import {fromCodePoint} from './fromCodePoint';

// [0-9]
const isDecNumberChar: CharCodeChecker = (charCode) => charCode >= 48 && charCode <= 57;

// [0-9A-Fa-f]
const isHexNumberChar: CharCodeChecker = (charCode) =>
    isDecNumberChar(charCode)
    || charCode >= CharCode['a'] && charCode <= CharCode['f']
    || charCode >= CharCode['A'] && charCode <= CharCode['F'];

const takeDecNumber = allCharBy(isDecNumberChar, 2, 6);

const takeHexNumber = allCharBy(isHexNumberChar, 2, 6);

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

    const charCount = input.length;

    while (charIndex < charCount) {

      let startIndex = input.indexOf('&', charIndex);
      if (startIndex === -1) {
        break;
      }

      charIndex = startIndex;

      let entityValue;
      let endIndex;

      // Numeric character reference
      if (input.charCodeAt(++startIndex) === CharCode['#']) {
        let radix;

        const radixCharCode = input.charCodeAt(++startIndex);

        if (radixCharCode === CharCode['x'] || radixCharCode === CharCode['X']) {
          endIndex = takeHexNumber(input, ++startIndex);
          radix = 16;
        } else {
          endIndex = takeDecNumber(input, startIndex);
          radix = 10;
        }
        if (endIndex !== ResultCode.NO_MATCH) {
          const terminated = input.charCodeAt(endIndex) === CharCode[';'];

          if (terminated || !numericCharacterReferenceTerminated) {
            entityValue = fromCodePoint(parseInt(input.substring(startIndex, endIndex), radix), replacementChar, illegalCodePointsForbidden);
          }
          if (terminated) {
            endIndex++;
          }
        } else {
          endIndex = startIndex;
        }

      } else {
        // Named character reference
        endIndex = startIndex;

        const entity = entityManager.search(input, startIndex);

        if (entity != null) {
          endIndex = startIndex + entity.name.length;

          const terminated = input.charCodeAt(endIndex) === CharCode[';'];

          if (terminated) {
            endIndex++;
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
    if (textIndex !== charCount) {
      output += input.substr(textIndex);
    }
    return output;
  };
}
