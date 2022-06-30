import {fromCodePoint} from './fromCodePoint';
import {Trie, trieCreate, trieSearch, trieSet} from '@smikhalevski/trie';

interface NamedCharRef {
  value: string;
  legacy: boolean;
}

export interface EntityDecoderOptions {

  /**
   * An entity manager that defines named entities.
   */
  namedCharRefs?: Record<string, string>;

  legacyNamedCharRefs?: Record<string, string>;

  /**
   * If `true` then numeric character references must be terminated with a semicolon to be decoded. Otherwise, numeric
   * character references are recognized even if they are not terminated with a semicolon.
   *
   * @default false
   */
  numericCharRefTerminated?: boolean;

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
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {

  const {
    namedCharRefs,
    legacyNamedCharRefs,
    numericCharRefTerminated = false,
    illegalCodePointsForbidden = false,
    replacementChar = '\ufffd',
  } = options;

  const charRefTrie = appendCharRefs(legacyNamedCharRefs, true, appendCharRefs(namedCharRefs, false, null));

  return (input) => {

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

          if (terminated || !numericCharRefTerminated) {
            charRefValue = fromCodePoint(codePoint, replacementChar, illegalCodePointsForbidden);
          }
          if (terminated) {
            ++endIndex;
          }
        }

      } else if (charRefTrie !== null) {
        // Named character reference

        const trie = trieSearch(charRefTrie, input, startIndex);

        if (trie !== null) {
          const namedCharRef = trie.value!;

          endIndex += trie.key!.length;

          const terminated = endIndex < inputLength && input.charCodeAt(endIndex) === 59 /* ; */;

          if (terminated || namedCharRef.legacy) {
            charRefValue = namedCharRef.value;
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

function appendCharRefs(charRefs: Record<string, string> | undefined, legacy: boolean, trie: Trie<NamedCharRef> | null): Trie<NamedCharRef> | null {
  if (charRefs == null) {
    return trie;
  }

  const entries = Object.entries(charRefs);
  if (entries.length === 0) {
    return trie;
  }

  trie ||= trieCreate();

  for (const [name, value] of entries) {
    trieSet(trie, name, {value, legacy});
  }
  return trie;
}
