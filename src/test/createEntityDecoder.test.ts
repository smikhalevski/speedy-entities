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
});

test('renders illegal code points as a replacement character', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X11FFFF;')).toBe('\uFFFD');
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
