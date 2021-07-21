export interface ITrie<T> {
  chars: Array<string> | null;
  children: Record<string, ITrie<T>> | null;
  value: T | undefined;
  charCount: number;
  end: boolean;
}

export function createTrie<T>(): ITrie<T> {
  return {
    chars: null,
    children: null,
    value: undefined,
    charCount: 0,
    end: false,
  };
}

export function addToTrie<T>(trie: ITrie<T>, key: string, value: T): void {

  let i = 0;
  while (i < key.length) {

    if (trie.chars) {
      const leafTrie = createTrie<T>();
      trie.children = {[trie.chars[0]]: leafTrie};

      if (trie.chars.length > 1) {
        leafTrie.chars = trie.chars.slice(1);
      }

      leafTrie.charCount = trie.charCount;
      leafTrie.value = trie.value;
      leafTrie.end = true;
      trie.charCount -= trie.chars.length;
      trie.chars = null;
      trie.value = undefined;
      trie.end = false;
    }

    if (!trie.end && !trie.children) {
      break;
    }

    trie.children ||= {};

    const charCode = key.charAt(i);
    const childTrie = trie.children[charCode];

    ++i;

    if (childTrie) {
      trie = childTrie;
      continue;
    }

    const leafTrie = createTrie<T>();
    trie.children[charCode] = leafTrie;
    leafTrie.charCount = trie.charCount + 1;
    trie = leafTrie;
    break;
  }

  if (i !== key.length) {
    trie.chars = [];
    while (i < key.length) {
      trie.chars.push(key.charAt(i));
      ++i;
    }
  }
  trie.charCount = i;
  trie.value = value;
  trie.end = true;
}

export function lookupInTrie<T>(trie: ITrie<T>, str: string, offset: number): ITrie<T> | undefined {

  const charCount = str.length;

  let lastTrie: ITrie<T> | undefined;

  forChars: for (let i = offset; i < charCount; ++i) {

    if (trie.chars) {
      if (i + trie.chars.length > charCount) {
        break;
      }
      for (let j = 0; j < trie.chars.length; ++i, ++j) {
        if (str.charAt(i) !== trie.chars[j]) {
          break forChars;
        }
      }
      lastTrie = trie;
      break;
    }

    if (trie.end) {
      lastTrie = trie;
    }

    if (trie.children) {
      trie = trie.children[str.charAt(i)];

      if (trie) {
        if (trie.end && !trie.chars) {
          lastTrie = trie;
        }
        continue;
      }
    }

    break;
  }

  return lastTrie;
}
