import { expect, test } from 'vitest';
import { encodeXML } from '../main/encodeXML.js';

test('encodes entities', () => {
  expect(encodeXML('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
});

test('preserves ASCII text', () => {
  expect(encodeXML('abc')).toBe('abc');
});

test('encodes entities surrounded by text', () => {
  expect(encodeXML('__&__')).toBe('__&amp;__');
});

test('encodes surrogate pairs', () => {
  expect(encodeXML('\uD83D\uDE18\u2764\uFE0F')).toBe('&#x1f618;&#x2764;&#xfe0f;');
});

test('replaces lone surrogates with a replacement character', () => {
  expect(encodeXML('\uD800aaa')).toBe('&#xfffd;aaa');
  expect(encodeXML('\uDFFF')).toBe('&#xfffd;');
});

test('encodes chars from U+0080', () => {
  expect(encodeXML('\u007F\u0080\u00E9')).toBe('\u007F&#x80;&#xe9;');
});

test('encodes chars after long runs of plain chars', () => {
  expect(encodeXML('a'.repeat(30) + '<')).toBe('a'.repeat(30) + '&lt;');

  // The previous call stopped searching past this char
  expect(encodeXML('b'.repeat(29) + '\u0080')).toBe('b'.repeat(29) + '&#x80;');
});

test('preserves a long run of plain chars', () => {
  expect(encodeXML('a'.repeat(30))).toBe('a'.repeat(30));
});

test('encodes different chars that share a cached reference slot', () => {
  // U+00E9 and U+04E9 have the same low 10 bits
  expect(encodeXML('\u00E9\u04E9\u00E9')).toBe('&#xe9;&#x4e9;&#xe9;');
});
