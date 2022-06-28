import {appendNumberOrRange, convertRangesToRegExp} from './utils';
import {Trie, trieCreate, trieSearch, trieSet} from '../../../trie';

export interface IEntityEncoderOptions {

  namedCharacterReferences?: Record<string, string>;

  numericCharacterReferences?: Array<number | [number, number]>;
}

export function createEntityEncoder(options: IEntityEncoderOptions = {}): (input: string) => string {

  const {
    namedCharacterReferences,
    numericCharacterReferences,
  } = options;

  let characterReferenceTrie: Trie<string> | null = null;

  const ranges: [number, number][] = [];

  if (namedCharacterReferences != null) {
    characterReferenceTrie ||= trieCreate();

    for (const [key, value] of Object.entries(namedCharacterReferences)) {
      trieSet(characterReferenceTrie, value, '&' + key + ';');
      appendNumberOrRange(value.charCodeAt(0), ranges);
    }
  }
  if (numericCharacterReferences != null) {
    for (const characterReference of numericCharacterReferences) {
      appendNumberOrRange(characterReference, ranges);
    }
  }

  if (ranges.length === 0) {
    return (input) => input;
  }

  const re = convertRangesToRegExp(ranges);

  return (input) => {

    let output = '';
    let endIndex = 0;

    re.lastIndex = 0;

    while (re.test(input)) {
      const startIndex = re.lastIndex - 1;

      if (endIndex !== startIndex) {
        output += input.substring(endIndex, startIndex);
      }

      if (characterReferenceTrie !== null) {
        const trie = trieSearch(characterReferenceTrie, input, startIndex);

        if (trie !== null) {
          // Named character reference

          output += trie.value;
          re.lastIndex = endIndex = startIndex + trie.key!.length;
          continue;
        }
      }

      // Numeric character reference
      const codePoint = input.codePointAt(startIndex)!;

      output += '&#' + codePoint + ';';
      re.lastIndex = endIndex = startIndex + (codePoint > 0xffff ? 2 : 1);
    }

    return endIndex === 0 ? input : endIndex !== input.length ? output : output + input.substring(endIndex);
  };
}
