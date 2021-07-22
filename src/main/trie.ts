export interface ITrie<T> {

  /**
   * Remaining chars that the word at this trie node contains.
   */
  chars: Array<number> | null;

  /**
   * Char code to trie nodes map.
   */
  children: Record<number, ITrie<T>> | null;

  /**
   * The value held by this node.
   */
  value: T | undefined;

  /**
   * The total number of chars in the word described by this trie node, including {@link chars}.
   */
  charCount: number;

  /**
   * `true` if this node is a leaf node and {@link value} contains an actual value that was set.
   */
  end: boolean;
}

/**
 * Creates a compressed trie node.
 *
 * @see {@link https://en.wikipedia.org/wiki/Trie Trie on Wikipedia}
 */
export function createTrie<T>(): ITrie<T> {
  return {
    chars: null,
    children: null,
    value: undefined,
    charCount: 0,
    end: false,
  };
}

/**
 * Sets a new key-value pair to the trie.
 */
export function setTrie<T>(trie: ITrie<T>, key: string, value: T): void {

  let i = 0;
  while (i < key.length) {

    const chars = trie.chars;

    if (chars) {
      const leafTrie = createTrie<T>();
      trie.children = {[chars[0]]: leafTrie};

      if (chars.length > 1) {
        leafTrie.chars = chars.slice(1);
      }

      leafTrie.charCount = trie.charCount;
      leafTrie.value = trie.value;
      leafTrie.end = true;

      trie.charCount -= chars.length;
      trie.chars = null;
      trie.value = undefined;
      trie.end = false;
    }

    let children = trie.children;

    if (!trie.end && children === null) {
      break;
    }

    children = trie.children ||= {};

    const charCode = key.charCodeAt(i);
    const childTrie = children[charCode];

    ++i;

    if (childTrie) {
      trie = childTrie;
      continue;
    }

    const leafTrie = createTrie<T>();
    children[charCode] = leafTrie;
    leafTrie.charCount = trie.charCount + 1;
    trie = leafTrie;
    break;
  }

  if (i !== key.length) {
    trie.chars = [];
    while (i < key.length) {
      trie.chars.push(key.charCodeAt(i));
      ++i;
    }
  }
  trie.charCount = i;
  trie.value = value;
  trie.end = true;
}

/**
 * Searches for a leaf trie node that describes the longest substring from `str` starting from `offset`.
 *
 * @param trie The trie with searched keys.
 * @param input The string to search for the key from the `trie`.
 * @param offset The offset in `str` to start reading substring from.
 * @returns A trie node or `undefined` if there's no matching key in the `trie`.
 */
export function searchTrie<T>(trie: ITrie<T>, input: string, offset: number): ITrie<T> | undefined {

  const charCount = input.length;

  let lastTrie: ITrie<T> | undefined;

  forChars: for (let i = offset; i < charCount; ++i) {

    const {chars, children} = trie;
    if (chars !== null) {
      const length = chars.length;

      if (i + length > charCount) {
        break;
      }
      for (let j = 0; j < length; ++i, ++j) {
        if (input.charCodeAt(i) !== chars[j]) {
          break forChars;
        }
      }
      lastTrie = trie;
      break;
    }
    if (trie.end) {
      lastTrie = trie;
    }
    if (children === null) {
      break;
    }

    trie = children[input.charCodeAt(i)];

    if (trie) {
      if (trie.end && trie.chars === null) {
        lastTrie = trie;
      }
      continue;
    }
    break;
  }

  return lastTrie;
}
