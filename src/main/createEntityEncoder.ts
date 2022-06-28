import {appendNumberOrRange, convertRangesToRegExp} from './utils';
import {Trie, trieCreate, trieSearch, trieSet} from '@smikhalevski/trie';

export interface IEntityEncoderOptions {

  namedCharRefs?: Record<string, string>;

  numericCharRefs?: Array<string | number | [string | number, string | number]>;
}

export function createEntityEncoder(options: IEntityEncoderOptions = {}): (input: string) => string {

  const {
    namedCharRefs,
    numericCharRefs,
  } = options;

  let charRefTrie: Trie<string> | null = null;

  const ranges: [number, number][] = [];

  if (namedCharRefs != null) {
    charRefTrie ||= trieCreate();

    for (const [key, value] of Object.entries(namedCharRefs)) {
      trieSet(charRefTrie, value, '&' + key + ';');
      appendNumberOrRange(value.charCodeAt(0), ranges);
    }
  }
  if (numericCharRefs != null) {
    for (const charRef of numericCharRefs) {
      appendNumberOrRange(charRef, ranges);
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

      if (charRefTrie !== null) {
        const trie = trieSearch(charRefTrie, input, startIndex);

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
