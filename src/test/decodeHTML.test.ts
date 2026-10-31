import { expect, test } from 'vitest';
import { decodeHTML } from '../main/decodeHTML.js';

test('decodes terminated decimal entities', () => {
  expect(decodeHTML('&#60;')).toBe('<');
});

test('decodes terminated hex entities', () => {
  expect(decodeHTML('&#x3c;')).toBe('<');
  expect(decodeHTML('&#x3C;')).toBe('<');
  expect(decodeHTML('&#X3c;')).toBe('<');
  expect(decodeHTML('&#X3C;')).toBe('<');
});

test('decodes unterminated decimal entities', () => {
  expect(decodeHTML('&#60aaa')).toBe('<aaa');
});

test('decodes unterminated hex entities', () => {
  expect(decodeHTML('&#x3cZZZ')).toBe('<ZZZ');
});

test('decodes an unterminated single digit entity at the end of input', () => {
  expect(decodeHTML('aaa&#9')).toBe('aaa\t');
});

test('decodes numeric entities with leading zeros', () => {
  expect(decodeHTML('&#x0000041;')).toBe('A');
});

test('decodes numeric entities that are not C1 controls', () => {
  expect(decodeHTML('&#160;')).toBe('\u00A0');
});

test('does not treat control characters as digits', () => {
  expect(decodeHTML('&#\u0011;')).toBe('&#\u0011;');
});

test('decodes terminated named entities', () => {
  expect(decodeHTML('&lt;')).toBe('<');
  expect(decodeHTML('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
});

test('decodes named entities that contain digits', () => {
  expect(decodeHTML('&frac12;')).toBe('\u00BD');
});

test('decodes unterminated legacy named entities', () => {
  expect(decodeHTML('&lt')).toBe('<');
});

test('ignores unterminated non-legacy named entities', () => {
  expect(decodeHTML('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
});

test('ignores unknown named entities', () => {
  expect(decodeHTML('&foo;')).toBe('&foo;');
});

test('decodes unterminated known named entities', () => {
  expect(decodeHTML('&lt')).toBe('<');
  expect(decodeHTML('&ltZZZ')).toBe('<ZZZ');
});

test('ignores entities without a leading ampersand', () => {
  expect(decodeHTML('&amp;amp;')).toBe('&amp;');
  expect(decodeHTML('&amp;#38;')).toBe('&#38;');
  expect(decodeHTML('&amp;#x26;')).toBe('&#x26;');
});

test('decodes multiple entities', () => {
  expect(decodeHTML('&lt;&#34;&gt;')).toBe('<">');
});

test('decodes astral characters', () => {
  expect(decodeHTML('&#x1d306')).toBe('\uD834\uDF06');
  expect(decodeHTML('&#x1d11e')).toBe('\uD834\uDD1E');
});

test('decodes astral special characters', () => {
  expect(decodeHTML('&#x80')).toBe('\u20AC');
  expect(decodeHTML('&#x110000')).toBe('\uFFFD');
});

test('decodes perf test samples', () => {
  expect(decodeHTML('&#X61;&#x62;&#x63;')).toBe('abc');
  expect(decodeHTML('&#X61&#x62&#x63')).toBe('abc');
  expect(decodeHTML('&#97;&#98;&#99;')).toBe('abc');
  expect(decodeHTML('&#97&#98&#99')).toBe('abc');
  expect(decodeHTML('&amp;&lt;&gt;')).toBe('&<>');
  expect(decodeHTML('&amp&lt&gt')).toBe('&<>');
  expect(decodeHTML('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
  expect(decodeHTML('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
});
