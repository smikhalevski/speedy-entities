import { appendRange, appendReplacement, convertRangesToRegExp } from '../main/utils';
import { Trie, trieCreate, trieSet } from '@smikhalevski/trie';

describe('appendRange', () => {
  test('appends a number', () => {
    const ranges: [number, number][] = [];

    appendRange(1, ranges);

    expect(ranges).toEqual([[1, 1]]);
  });

  test('does not append a duplicate number', () => {
    const ranges: [number, number][] = [[1, 1]];

    appendRange(1, ranges);

    expect(ranges).toEqual([[1, 1]]);
  });

  test('appends a range', () => {
    const ranges: [number, number][] = [];

    appendRange([1, 3], ranges);

    expect(ranges).toEqual([[1, 3]]);
  });

  test('appends a intersecting range', () => {
    const ranges: [number, number][] = [[2, 4]];

    appendRange([1, 3], ranges);

    expect(ranges).toEqual([[1, 4]]);
  });

  test('appends a bridging range', () => {
    const ranges: [number, number][] = [
      [2, 4],
      [5, 7],
    ];

    appendRange([3, 6], ranges);

    expect(ranges).toEqual([[2, 7]]);
  });

  test('merges touching ranges on left', () => {
    const ranges: [number, number][] = [[3, 4]];

    appendRange([1, 2], ranges);

    expect(ranges).toEqual([[1, 4]]);
  });

  test('merges touching ranges on right', () => {
    const ranges: [number, number][] = [[3, 4]];

    appendRange([5, 6], ranges);

    expect(ranges).toEqual([[3, 6]]);
  });

  test('does not append a value that already in the range', () => {
    const ranges: [number, number][] = [[3, 5]];

    appendRange(4, ranges);

    expect(ranges).toEqual([[3, 5]]);
  });
});

describe('appendReplacement', () => {
  test('appends an entity that encodes a single char', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [];

    appendReplacement('foo', 'a', replacementMap, ranges);

    expect(ranges).toEqual([[97, 97]]);
    expect(Array.from(replacementMap)).toEqual([[97, '&foo;']]);
  });

  test('overwrites an entity that encodes a single char', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [];

    appendReplacement('foo', 'a', replacementMap, ranges);
    appendReplacement('bar', 'a', replacementMap, ranges);

    expect(ranges).toEqual([[97, 97]]);
    expect(Array.from(replacementMap)).toEqual([[97, '&bar;']]);
  });

  test('appends an entity that encodes multiple chars', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [];

    const trie = trieCreate();
    trieSet(trie, 'bc', '&foo;');

    appendReplacement('foo', 'abc', replacementMap, ranges);

    expect(ranges).toEqual([[97, 97]]);
    expect(Array.from(replacementMap)).toEqual([[97, trie]]);
  });

  test('shadows a numeric char ref replacement', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [[90, 100]];

    const trie = trieCreate();
    trieSet(trie, 'bc', '&foo;');
    trieSet(trie, '', '&#x61;');

    appendReplacement('foo', 'abc', replacementMap, ranges);

    expect(ranges).toEqual([[90, 100]]);
    expect(Array.from(replacementMap)).toEqual([[97, trie]]);
  });

  test('appends an entity that encodes multiple chars after an entity that encodes a single char', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [];

    const trie = trieCreate();
    trieSet(trie, 'bc', '&foo;');
    trieSet(trie, '', '&bar;');

    appendReplacement('bar', 'a', replacementMap, ranges);
    appendReplacement('foo', 'abc', replacementMap, ranges);

    expect(ranges).toEqual([[97, 97]]);
    expect(Array.from(replacementMap)).toEqual([[97, trie]]);
  });

  test('appends an entity that encodes a single char after an entity that encodes multiple chars', () => {
    const replacementMap = new Map<number, string | Trie<string>>();
    const ranges: [number, number][] = [];

    const trie = trieCreate();
    trieSet(trie, 'bc', '&foo;');
    trieSet(trie, '', '&bar;');

    appendReplacement('foo', 'abc', replacementMap, ranges);
    appendReplacement('bar', 'a', replacementMap, ranges);

    expect(ranges).toEqual([[97, 97]]);
    expect(Array.from(replacementMap)).toEqual([[97, trie]]);
  });
});

describe('convertRangesToRegExp', () => {
  test('range with one char', () => {
    expect(convertRangesToRegExp([[97, 97]])).toEqual(/[\u0061]/g);
  });

  test('range with two chars', () => {
    expect(convertRangesToRegExp([[97, 98]])).toEqual(/[\u0061\u0062]/g);
  });

  test('range with multiple chars', () => {
    expect(convertRangesToRegExp([[97, 99]])).toEqual(/[\u0061-\u0063]/g);
  });

  test('multiple ranges', () => {
    expect(
      convertRangesToRegExp([
        [10, 20],
        [97, 99],
      ])
    ).toEqual(/[\u000a-\u0014\u0061-\u0063]/g);

    expect(
      convertRangesToRegExp([
        [10, 10],
        [97, 99],
      ])
    ).toEqual(/[\u000a\u0061-\u0063]/g);
  });
});
