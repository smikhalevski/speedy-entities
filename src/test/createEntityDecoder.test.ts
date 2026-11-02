import { expect, test } from 'vitest';
import { createEntityDecoder } from '../main/createEntityDecoder.js';
import htmlEntities from '../main/html-entities.js';

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

test('does not match non-ASCII chars against entity names', () => {
  const decode = createEntityDecoder({ entities: { aaa: 'bbb' } });

  // "\u00E1" is 225, which is also the edge key of the second "a" in the trie: (1 << 7) | 97
  expect(decode('&\u00E1a')).toBe('&\u00E1a');
});

test('throws if an entity reference is invalid', () => {
  expect(() => createEntityDecoder({ entities: { 'aaa;bbb': 'ccc' } })).toThrow('Invalid entity reference: aaa;bbb');
});

test('supports numeric references', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  expect(decode('&#97;&#98;&#99;')).toBe('abc');
  expect(decode('&#X3C;')).toBe('<');
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

test('recognizes numeric references followed by a non HEX char', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X61Z')).toBe('aZ');
});

test('numeric references are case-insensitive', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X3C;')).toBe(decode('&#x3c;'));
});

test('supports single digit numeric references', () => {
  const decode = createEntityDecoder();

  expect(decode('&#1;')).toBe('\u0001');
});

test('remaps C1 controls to Windows-1252 characters by default', () => {
  const decode = createEntityDecoder();

  expect(decode('&#128;')).toBe('\u20AC');
  expect(decode('&#159;')).toBe('\u0178');
});

test('preserves C1 controls that have no Windows-1252 counterpart', () => {
  const decode = createEntityDecoder();

  expect(decode('&#129;')).toBe('\u0081');
});

test('renders illegal code points as a replacement character', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X11FFFF;')).toBe('\uFFFD');
  expect(decode('&#0;')).toBe('\uFFFD');
  expect(decode('&#xD800;')).toBe('\uFFFD');
  expect(decode('&#xDFFF;')).toBe('\uFFFD');
});

test('decodes the largest code point', () => {
  const decode = createEntityDecoder();

  expect(decode('&#x10FFFF;')).toBe('\uDBFF\uDFFF');
});

test('renders code points that have more than 6 digits as a replacement character', () => {
  const decode = createEntityDecoder();

  expect(decode('&#1234567;')).toBe('\uFFFD');
});

test('preserves invalid entities as is', () => {
  const decode = createEntityDecoder();

  expect(decode('&#;')).toBe('&#;');
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
