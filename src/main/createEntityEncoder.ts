import { appendRange, appendReplacement, convertRangesToRegExp } from './utils';
import { Trie, trieSearch } from '@smikhalevski/trie';

export interface EntityEncoderOptions {
  namedCharRefs?: Record<string, string>;

  numericCharRefs?: Array<number | [number, number]>;
}

export function createEntityEncoder(options: EntityEncoderOptions = {}): (input: string) => string {
  const { namedCharRefs, numericCharRefs } = options;

  const ranges: [number, number][] = [];

  let replacementMap: Map<number, string | Trie<string>> | null = null;

  if (numericCharRefs != null) {
    for (const charCode of numericCharRefs) {
      appendRange(charCode, ranges);
    }
  }

  if (namedCharRefs != null) {
    const entries = Object.entries(namedCharRefs);
    if (entries.length !== 0) {
      replacementMap = new Map();

      for (const [name, value] of entries) {
        appendReplacement(name, value, replacementMap, ranges);
      }
    }
  }

  const re = convertRangesToRegExp(ranges);

  return input => {
    let output = '';
    let textIndex = 0;

    const inputLength = input.length;

    while (re.test(input)) {
      let charRef: string | null = null;
      let lastIndex = re.lastIndex;

      const startIndex = lastIndex - 1;
      const codePoint = input.codePointAt(startIndex)!;

      if (codePoint > 0xffff) {
        ++lastIndex;
      }

      if (replacementMap !== null) {
        const replacement = replacementMap.get(codePoint);

        if (typeof replacement === 'string') {
          // Named character reference
          charRef = replacement;
        } else if (replacement !== undefined) {
          // Named character reference
          const trie = trieSearch(replacement, input, lastIndex, inputLength);
          if (trie === null) {
            continue;
          }

          charRef = trie.value!;
          lastIndex += trie.key!.length;
        }
      }

      if (charRef === null) {
        // Numeric character reference
        charRef = '&#x' + codePoint.toString(16) + ';';
      }

      output += textIndex === startIndex ? charRef : input.substring(textIndex, startIndex) + charRef;
      re.lastIndex = textIndex = lastIndex;
    }

    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.substring(textIndex);
  };
}
