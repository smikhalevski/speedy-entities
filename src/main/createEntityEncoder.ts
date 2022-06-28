import {appendNumberOrRange, convertRangesToRegExp} from './utils';
import {Trie, trieCreate, trieSearch, trieSet} from '@smikhalevski/trie';

export interface EntityEncoderOptions {

  namedCharRefs?: Record<string, string>;

  numericCharRefs?: Array<string | number | [string | number, string | number]>;
}

export function createEntityEncoder(options: EntityEncoderOptions = {}): (input: string) => string {

  const {
    namedCharRefs,
    numericCharRefs,
  } = options;

  let charRefMap: Map<number, string | Trie<string>> | null = null;
  const ranges: [number, number][] = [];

  if (namedCharRefs != null) {
    for (const [key, value] of Object.entries(namedCharRefs)) {

      const charRef = '&' + key + ';';
      const charCode = value.charCodeAt(0);

      charRefMap ||= new Map<number, string | Trie<string>>();

      const q = charRefMap.get(charCode);

      if (value.length === 1) {
        if (q === undefined || typeof q === 'string') {
          charRefMap.set(charCode, charRef);
        } else {
          trieSet(q, '', charRef);
        }
      } else {
        if (q === undefined || typeof q === 'string') {
          const trie = trieCreate<string>();
          trieSet(trie, value.substring(1), charRef);

          if (typeof q === 'string') {
            trieSet(trie, '', q);
          }
          charRefMap.set(charCode, trie);
        } else {
          trieSet(q, value.substring(1), charRef);
        }
      }

      appendNumberOrRange(charCode, ranges);
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
      const lastIndex = re.lastIndex;
      const startIndex = lastIndex - 1;

      if (endIndex !== startIndex) {
        output += input.substring(endIndex, startIndex);
      }

      const charCode = input.charCodeAt(startIndex);

      if (charRefMap !== null) {
        const v = charRefMap.get(charCode);

        if (typeof v === 'string') {
          // Named character reference that corresponds to a single UTF char
          output += v;
          endIndex = lastIndex;
          continue;
        }

        if (v !== undefined) {

          const trie = trieSearch(v, input, lastIndex);
          if (trie !== null) {
            // Named character reference
            output += trie.value;
            re.lastIndex = endIndex = lastIndex + trie.key!.length;
            continue;
          }
        }
      }

      // Numeric character reference
      output += '&#' + charCode + ';';
      endIndex = lastIndex;
    }

    return endIndex === 0 ? input : endIndex !== input.length ? output : output + input.substring(endIndex);
  };
}
