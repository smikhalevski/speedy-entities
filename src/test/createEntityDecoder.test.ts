import { expect, test } from 'vitest';
import { createEntityDecoder } from '../main/createEntityDecoder.js';
import { createEntityMap } from '../main/utils.js';
import htmlEntities from '../main/gen/html-entities.js';

test('supports named entities', () => {
  const decode = createEntityDecoder({ entities: createEntityMap(htmlEntities) });

  expect(decode('&AMP;')).toBe('&');
  expect(decode('&AMP')).toBe('&');
  expect(decode('&AMPZ')).toBe('&Z');
  expect(decode('&Acy;')).toBe('\u0410');
  expect(decode('&Acy')).toBe('&Acy');
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

test('supports numeric references', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
});

test('numeric references are case-insensitive', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X3C;')).toBe(decode('&#x3c;'));
});

test('supports single digit numeric references', () => {
  const decode = createEntityDecoder();

  expect(decode('&#1;')).toBe('\u0001');
});

test('renders illegal code points as a replacement character', () => {
  const decode = createEntityDecoder();

  expect(decode('&#X11FFFF;')).toBe('\uFFFD');
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
