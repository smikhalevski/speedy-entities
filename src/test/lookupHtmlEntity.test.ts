import {lookupHtmlEntity} from '../main/lookupHtmlEntity';

describe('lookupHtmlEntity', () => {

  test('looks up an entity', () => {
    expect(lookupHtmlEntity('NotNestedGreaterGreater', 0)).toEqual({
      charCount: 23,
      legacy: false,
      value: '\u2AA2\u0338',
    });
  });
});
