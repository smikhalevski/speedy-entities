import {appendNumberOrRange} from '../main/utils';

describe('appendNumberOrRange', () => {

  test('appends a number', () => {
    let ranges: [number, number][] = [];

    appendNumberOrRange(1, ranges);

    expect(ranges).toEqual([[1, 1]]);
  });

  test('does not append a duplicate number', () => {
    let ranges: [number, number][] = [[1, 1]];

    appendNumberOrRange(1, ranges);

    expect(ranges).toEqual([[1, 1]]);
  });

  test('appends a range', () => {
    let ranges: [number, number][] = [];

    appendNumberOrRange([1, 3], ranges);

    expect(ranges).toEqual([[1, 3]]);
  });

  test('appends a intersecting range', () => {
    let ranges: [number, number][] = [[2, 4]];

    appendNumberOrRange([1, 3], ranges);

    expect(ranges).toEqual([[1, 4]]);
  });

  test('appends a bridging range', () => {
    let ranges: [number, number][] = [[2, 4], [5, 7]];

    appendNumberOrRange([3, 6], ranges);

    expect(ranges).toEqual([[2, 7]]);
  });

  test('merges touching ranges on left', () => {
    let ranges: [number, number][] = [[3, 4]];

    appendNumberOrRange([1, 2], ranges);

    expect(ranges).toEqual([[1, 4]]);
  });

  test('merges touching ranges on right', () => {
    let ranges: [number, number][] = [[3, 4]];

    appendNumberOrRange([5, 6], ranges);

    expect(ranges).toEqual([[3, 6]]);
  });

  test('does not append a value that already in the range', () => {
    let ranges: [number, number][] = [[3, 5]];

    appendNumberOrRange(4, ranges);

    expect(ranges).toEqual([[3, 5]]);
  });
});
