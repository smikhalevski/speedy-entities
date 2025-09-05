import { expect, test } from 'vitest';
import { escapeXML } from '../main/escapeXML.js';

test('encodes entities', () => {
  expect(escapeXML('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
});

test('preserves ASCII text', () => {
  expect(escapeXML('abc')).toBe('abc');
});

test('encodes entities surrounded by text', () => {
  expect(escapeXML('__&__')).toBe('__&amp;__');
});

test('does not encode surrogate pairs', () => {
  expect(escapeXML('😘❤️')).toBe('😘❤️');
});
