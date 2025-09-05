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
  expect(encodeXML('😘❤️')).toBe('&#x1f618;&#x2764;&#xfe0f;');
});
