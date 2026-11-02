import { expect, test } from 'vitest';
import { decodeHTMLAttribute } from '../main/decodeHTML.js';

test('does not decode unterminated entities followed by "=" or an alphanumeric char', () => {
  expect(decodeHTMLAttribute('?aaa=111&copy=222&not333')).toBe('?aaa=111&copy=222&not333');
});

test('decodes unterminated entities followed by other chars', () => {
  expect(decodeHTMLAttribute('&copy &copy')).toBe('\u00A9 \u00A9');
});

test('decodes numeric references without a semicolon', () => {
  expect(decodeHTMLAttribute('&#97=')).toBe('a=');
});

test('remaps C1 controls to Windows-1252 characters', () => {
  expect(decodeHTMLAttribute('&#128;')).toBe('\u20AC');
});
