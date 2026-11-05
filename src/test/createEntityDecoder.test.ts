import { describe, expect, test } from 'vitest';
import { createEntityDecoder } from '../main/createEntityDecoder.ts';
import htmlEntities from '../main/html-entities.ts';

describe('createEntityDecoder', () => {
  test('supports named entities', () => {
    const decode = createEntityDecoder({ entities: htmlEntities });

    expect(decode('&AMP;')).toBe('&');
    expect(decode('&AMP')).toBe('&');
    expect(decode('&AMPZ')).toBe('&Z');
    expect(decode('&Acy;')).toBe('\u0410');
    expect(decode('&Acy')).toBe('&Acy');
  });

  test('supports named entities that contain "-", ".", ":" and "_"', () => {
    const decode = createEntityDecoder({ entities: { 'a-b.c:d_e;': 'aaa' } });

    expect(decode('&a-b.c:d_e;')).toBe('aaa');
  });

  test('supports named entities that are not sorted', () => {
    const decode = createEntityDecoder({ entities: { 'a;': 'aaa', 'b;': 'bbb', '&ab;': 'ccc' } });

    expect(decode('&a;&ab;&b;')).toBe('aaacccbbb');
  });

  test('supports named entities that are listed before their prefixes', () => {
    const decode = createEntityDecoder({ entities: { ab: 'aaa', a: 'bbb', 'ab;': 'ccc' } });

    expect(decode('&a &ab &ab;')).toBe('bbb aaa ccc');
  });

  test('decodes references at the end of the input', () => {
    const decode = createEntityDecoder({ entities: { a: 'bbb' } });

    expect(decode('&a')).toBe('bbb');
    expect(decode('&a&a')).toBe('bbbbbb');
  });

  test('decodes a reference that follows a bare ampersand', () => {
    const decode = createEntityDecoder({ entities: { a: 'bbb' } });

    expect(decode('&&a')).toBe('&bbb');
  });

  test('decodes the longest known name when a longer name shares its prefix', () => {
    const decode = createEntityDecoder({ entities: { ab: 'aaa', abcd: 'bbb' } });

    expect(decode('&abc')).toBe('aaac');
  });

  test('uses the last value of named entities that have the same name', () => {
    const decode = createEntityDecoder({ entities: { '&aaa;': 'bbb', 'aaa;': 'ccc' } });

    expect(decode('&aaa;')).toBe('ccc');
  });

  test('uses the last value of named entities that have the same name if entities are not sorted', () => {
    const decode = createEntityDecoder({ entities: { 'b;': 'aaa', '&a;': 'bbb', 'a;': 'ccc' } });

    expect(decode('&a;')).toBe('ccc');
  });

  test('supports entities listed as references and values in turn', () => {
    const decode = createEntityDecoder({ entities: ['bbb;', '111', '&aaa;', '222'] });

    expect(decode('&aaa;&bbb;')).toBe('222111');
  });

  test('uses the last value of listed entities that have the same name', () => {
    const decode = createEntityDecoder({ entities: ['b;', 'aaa', '&a;', 'bbb', 'a;', 'ccc'] });

    expect(decode('&a;')).toBe('ccc');
  });

  test('throws if a listed entity reference has no value', () => {
    expect(() => createEntityDecoder({ entities: ['aaa;'] })).toThrow(
      'entities must list references and values in turn'
    );
  });

  test('does not match non-ASCII chars against entity names', () => {
    const decode = createEntityDecoder({ entities: { aaa: 'bbb' } });

    // The low 7 bits of "\u00E1" are "a", so "&\u00E1aa" would match if char codes were masked to stay in bounds
    expect(decode('&\u00E1aa')).toBe('&\u00E1aa');
  });

  test('throws if an entity reference is invalid', () => {
    expect(() => createEntityDecoder({ entities: { 'aaa;bbb': 'ccc' } })).toThrow(
      'Invalid entity reference: "aaa;bbb"'
    );
  });

  test('supports numeric references', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decode('&#97;&#98;&#99;')).toBe('abc');
    expect(decode('&#X3C;')).toBe('<');
    expect(decode('&#x3c;')).toBe('<');
  });

  test('does not require a semicolon for numeric references', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61&#x62&#x63')).toBe('abc');
    expect(decode('&#97&#98&#99')).toBe('abc');
    expect(decode('&#x1D11E')).toBe('\uD834\uDD1E');
  });

  test('requires a semicolon for numeric references', () => {
    const decode = createEntityDecoder({ isNumericReferenceSemicolonRequired: true });

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decode('&#97;&#98;&#99;')).toBe('abc');
    expect(decode('&#X3C;')).toBe('<');

    expect(decode('&#X61&#x62&#x63')).toBe('&#X61&#x62&#x63');
    expect(decode('&#97&#98&#99')).toBe('&#97&#98&#99');
    expect(decode('&#x1D11E')).toBe('&#x1D11E');
  });

  test('decodes numeric references followed by a non-hex char', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61Z')).toBe('aZ');
  });

  test('supports single digit numeric references', () => {
    const decode = createEntityDecoder();

    expect(decode('&#1;')).toBe('\u0001');
  });

  test('remaps C1 controls to Windows-1252 characters by default', () => {
    const decode = createEntityDecoder();

    // U+0080 to U+009F, those without a Windows-1252 counterpart are preserved
    const expectedValues =
      '\u20AC\u0081\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u008D\u017D\u008F\u0090\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u009D\u017E\u0178';

    for (let codePoint = 0x80; codePoint <= 0x9f; ++codePoint) {
      expect(decode('&#' + codePoint + ';')).toBe(expectedValues[codePoint - 0x80]);
    }
  });

  test('renders illegal code points as a replacement character', () => {
    const decode = createEntityDecoder();

    expect(decode('&#x110000;')).toBe('\uFFFD');
    expect(decode('&#0;')).toBe('\uFFFD');
    expect(decode('&#xD800;')).toBe('\uFFFD');
    expect(decode('&#xDFFF;')).toBe('\uFFFD');
  });

  test('decodes the largest code point', () => {
    const decode = createEntityDecoder();

    expect(decode('&#x10FFFF;')).toBe('\uDBFF\uDFFF');
  });

  test('renders code points that overflow 32 bits as a replacement character', () => {
    const decode = createEntityDecoder();

    // Truncated to 32 bits, 0x100000041 would be 0x41, which is "A"
    expect(decode('&#x100000041;')).toBe('\uFFFD');
  });

  test('preserves invalid entities as is', () => {
    const decode = createEntityDecoder();

    expect(decode('&#;')).toBe('&#;');
    expect(decode('&#')).toBe('&#');
    expect(decode('&#x')).toBe('&#x');
    expect(decode('&;')).toBe('&;');
    expect(decode('&#x;')).toBe('&#x;');
    expect(decode('&#X;')).toBe('&#X;');
    expect(decode('&# ;')).toBe('&# ;');
    expect(decode('&#Z;')).toBe('&#Z;');
  });

  test('does not decode unterminated named entities followed by "=" or an alphanumeric char in attribute values', () => {
    const decode = createEntityDecoder({ entities: { aaa: 'bbb' }, isAttributeValue: true });

    expect(decode('&aaa= &aaab &aaaB &aaa1')).toBe('&aaa= &aaab &aaaB &aaa1');
  });

  test('decodes unterminated named entities followed by other chars in attribute values', () => {
    const decode = createEntityDecoder({ entities: { aaa: 'bbb' }, isAttributeValue: true });

    expect(decode('&aaa-&aaa')).toBe('bbb-bbb');
  });

  test('decodes terminated named entities followed by "=" in attribute values', () => {
    const decode = createEntityDecoder({ entities: { 'aaa;': 'bbb' }, isAttributeValue: true });

    expect(decode('&aaa;=')).toBe('bbb=');
  });

  test('decodes numeric references followed by "=" in attribute values', () => {
    const decode = createEntityDecoder({ isAttributeValue: true });

    expect(decode('&#97=')).toBe('a=');
  });
});
