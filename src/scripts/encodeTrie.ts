import { Trie } from '@smikhalevski/trie';

const fromCharCode = String.fromCharCode;

/*
 * Node layouts in arr:
 *
 * LEAF               = [leaf_char_code_count|16, type|3 = 0], [value], ...([char_code] * leaf_char_code_count)
 *
 * SINGLE_BRANCH      = [char|8, type|3 = 1] // the next node is right after this one in arr
 *
 * SINGLE_BRANCH_LEAF = [char|8, type|3 = 2], [value] // the next node is right after this one in arr
 *
 * NODE_REF           = [next_offset|16, char|8]
 *
 * MULTI_BRANCH       = [ref_count|16, type|3 = 3], ...(NODE_REF * ref_count)
 *
 * MULTI_BRANCH_LEAF  = [ref_count|16, type|3 = 4], [value], ...(NODE_REF * ref_count)
 */

export const enum NodeType {
  LEAF,
  SINGLE_BRANCH,
  SINGLE_BRANCH_LEAF,
  MULTI_BRANCH,
  MULTI_BRANCH_LEAF,
}

export function getValueFromTrie(arr: number[], input: string, offset: number): string | undefined {
  const inputLength = input.length;

  let value;
  let arrIndex = 0;

  search: for (; offset < inputLength; ++offset) {
    const node = arr[arrIndex];
    const nodeType = node & 0b111;
    const data = node >> 3;

    switch (nodeType) {
      case NodeType.LEAF:
        if (offset + data > inputLength) {
          break search;
        }

        ++arrIndex;
        const valueIndex = arrIndex;
        ++arrIndex;

        while (offset < inputLength) {
          if (input.charCodeAt(offset) !== arr[arrIndex]) {
            break search;
          }
          ++arrIndex;
          ++offset;
        }

        value = decodeValue(arr[valueIndex]);
        break search;

      case NodeType.SINGLE_BRANCH:
        if (input.charCodeAt(offset) !== data) {
          break search;
        }
        ++arrIndex;
        break;

      case NodeType.SINGLE_BRANCH_LEAF:
        ++arrIndex;
        value = decodeValue(arr[arrIndex]);

        if (input.charCodeAt(offset) !== data) {
          break search;
        }
        ++arrIndex;
        break;

      case NodeType.MULTI_BRANCH:
        ++arrIndex;

        for (let keyCharCode = input.charCodeAt(offset), i = 0; i < data; ++i) {
          const ref = arr[arrIndex + i];

          if (keyCharCode === (ref & 0xff)) {
            arrIndex = ref >> 8;
            continue search;
          }
        }
        break search;

      case NodeType.MULTI_BRANCH_LEAF:
        value = decodeValue(arr[arrIndex + 1]);

        arrIndex += 2;

        for (let keyCharCode = input.charCodeAt(offset), i = 0; i < data; ++i) {
          const ref = arr[arrIndex + i];

          if (keyCharCode === (ref & 0xff)) {
            arrIndex = ref >> 8;
            continue search;
          }
        }
        break search;
    }
  }

  if (offset === inputLength && arrIndex < arr.length) {
    const node = arr[arrIndex];
    const nodeType = node & 0b111;

    if (
      nodeType === NodeType.MULTI_BRANCH_LEAF ||
      nodeType === NodeType.SINGLE_BRANCH_LEAF ||
      (nodeType === NodeType.LEAF && node >> 3 === 0)
    ) {
      value = decodeValue(arr[arrIndex + 1]);
    }
  }

  return value;
}

function decodeValue(value: number) {
  return value > 0x10ffff ? fromCharCode(value >> 16, value & 0xffff) : fromCodePoint(value);
}

function fromCodePoint(codePoint: number): string {
  if (codePoint < 0xffff) {
    return fromCharCode(codePoint);
  }
  codePoint -= 0x10000;
  return fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800, 0xdc00 | (codePoint & 0x3ff));
}

/**
 * Encodes trie as an array of positive 32-bit integers.
 */
export function encodeTrie(trie: Trie<number[]>, offset: number, arr: number[]): number {
  const childCharCodes = getChildCharCodes(trie);
  const childCharCodesLength = childCharCodes.length;

  if (childCharCodesLength === 0) {
    // leaf

    const leafCharCodes = trie.leafCharCodes;

    if (leafCharCodes) {
      arr[offset] = (leafCharCodes.length << 3) + NodeType.LEAF;

      for (let i = 0; i < leafCharCodes.length; ++i) {
        arr[offset + 2 + i] = leafCharCodes[i];
      }
    } else {
      arr[offset] = NodeType.LEAF;
    }

    arr[offset + 1] = encodeValue(trie.value!);

    return offset + 2;
  }

  if (childCharCodesLength === 1) {
    if (trie.isLeaf) {
      // single_branch_leaf

      arr[offset] = (childCharCodes[0] << 3) + NodeType.SINGLE_BRANCH_LEAF;
      arr[offset + 1] = encodeValue(trie.value!);
      return encodeTrie(trie[childCharCodes[0]]!, offset + 2, arr);
    } else {
      // single_branch

      arr[offset] = (childCharCodes[0] << 3) + NodeType.SINGLE_BRANCH;
      return encodeTrie(trie[childCharCodes[0]]!, offset + 1, arr);
    }
  }

  if (trie.isLeaf) {
    arr[offset] = (childCharCodesLength << 3) + NodeType.MULTI_BRANCH_LEAF;
    arr[offset + 1] = encodeValue(trie.value!);
    offset += 2;
  } else {
    arr[offset] = (childCharCodesLength << 3) + NodeType.MULTI_BRANCH;
    ++offset;
  }

  let nextOffset = offset + childCharCodesLength;

  for (let i = 0; i < childCharCodesLength; ++i) {
    const charCode = childCharCodes[i];

    // ref
    arr[offset + i] = (nextOffset << 8) + charCode;

    nextOffset = encodeTrie(trie[charCode]!, nextOffset, arr);
  }

  return nextOffset;
}

function encodeValue(value: number[]): number {
  if (value.length === 1) {
    return value[0];
  }

  if (value[0] > 0x7fff) {
    throw new Error('Unexpected char code');
  }

  const result = (value[0] << 16) + value[1];

  if (result < 0x10ffff) {
    throw new Error('Unexpected composite');
  }
  return result;
}

function getChildCharCodes(trie: Trie<any>): number[] {
  const charCodes = [];

  for (const key in trie) {
    const charCode = parseInt(key, 10);

    if (isNaN(charCode)) {
      continue;
    }
    charCodes.push(charCode);
  }
  return charCodes.sort((a, b) => a - b);
}
