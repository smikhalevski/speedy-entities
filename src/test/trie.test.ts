import {setTrie, createTrie, ITrie, searchTrie} from '../main/trie';

const A = 97;
const B = 98;
const C = 99;
const D = 100;
const E = 101;
const F = 102;

describe('setTrie', () => {

  test('adds an empty string to a trie', () => {
    const trie = createTrie();
    setTrie(trie, '', 123);

    expect(trie).toEqual(<ITrie<number>>{
      chars: null,
      value: 123,
      charCount: 0,
      end: true,
      children: null,
    });
  });

  test('adds value to an empty trie', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);

    expect(trie).toEqual(<ITrie<number>>{
      chars: [A, B, C],
      value: 123,
      charCount: 3,
      end: true,
      children: null,
    });
  });

  test('adds value to an non-empty trie', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'ade', 456);

    expect(trie).toEqual(<ITrie<number>>{
      chars: null,
      value: undefined,
      charCount: 0,
      end: false,
      children: {
        [A]: {
          chars: null,
          value: undefined,
          charCount: 1,
          end: false,
          children: {
            [B]: {
              chars: [C],
              value: 123,
              charCount: 3,
              end: true,
              children: null,
            },
            [D]: {
              chars: [E],
              value: 456,
              charCount: 3,
              end: true,
              children: null,
            },
          },
        },
      },
    });
  });

  test('adds value to a deep trie', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'ade', 456);
    setTrie(trie, 'abf', 789);

    expect(trie).toEqual(<ITrie<number>>{
      chars: null,
      value: undefined,
      charCount: 0,
      end: false,
      children: {
        [A]: {
          chars: null,
          value: undefined,
          charCount: 1,
          end: false,
          children: {
            [B]: {
              chars: null,
              value: undefined,
              charCount: 2,
              end: false,
              children: {
                [C]: {
                  chars: null,
                  value: 123,
                  charCount: 3,
                  end: true,
                  children: null,
                },
                [F]: {
                  chars: null,
                  value: 789,
                  charCount: 3,
                  end: true,
                  children: null,
                },
              },
            },
            [D]: {
              chars: [E],
              value: 456,
              charCount: 3,
              end: true,
              children: null,
            },
          },
        },
      },
    });
  });

  test('preserves overlapping keys', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abcdef', 456);

    expect(trie).toEqual(<ITrie<number>>{
      charCount: 0,
      chars: null,
      end: false,
      value: undefined,
      children: {
        [A]: {
          charCount: 1,
          chars: null,
          end: false,
          value: undefined,
          children: {
            [B]: {
              charCount: 2,
              chars: null,
              end: false,
              value: undefined,
              children: {
                [C]: {
                  charCount: 3,
                  chars: null,
                  end: true,
                  value: 123,
                  children: {
                    [D]: {
                      charCount: 6,
                      chars: [E, F],
                      end: true,
                      value: 456,
                      children: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

});

describe('searchTrie', () => {

  test('finds a tire with one entry', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);

    expect(searchTrie(trie, 'abc', 0)).toBe(trie);
  });

  test('finds a tire with two leaf entries', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abd', 456);

    const leafTrie = searchTrie(trie, 'abd', 0);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[D]);
  });

  test('finds a tire with deep char entries', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abdef', 456);

    const leafTrie = searchTrie(trie, 'abdef', 0);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[D]);
  });

  test('finds a tire at offset', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abdef', 456);

    const leafTrie = searchTrie(trie, 'qqqabdef', 3);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[D]);
  });

  test('finds the longest tire', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abcdef', 456);

    const leafTrie = searchTrie(trie, 'abcdef', 0);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[C].children?.[D]);
  });

  test('finds the shortest tire on mismatch', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abcdef', 456);

    const leafTrie = searchTrie(trie, 'abcdeZZZ', 0);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[C]);
  });

  test('finds the shortest tire on string end', () => {
    const trie = createTrie();
    setTrie(trie, 'abc', 123);
    setTrie(trie, 'abcdef', 456);

    const leafTrie = searchTrie(trie, 'abcde', 0);

    expect(leafTrie).toBe(trie.children?.[A].children?.[B].children?.[C]);
  });
});
