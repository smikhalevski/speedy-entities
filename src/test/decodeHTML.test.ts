import { describe, expect, test } from 'vitest';
import { decodeHTML, decodeHTMLAttribute } from '../main/decodeHTML.ts';
import entities from '../main/entities.ts';

describe('decodeHTML', () => {
  test('decodes terminated decimal references', () => {
    expect(decodeHTML('&#60;')).toBe('<');
  });

  test('decodes terminated hex references', () => {
    expect(decodeHTML('&#x3c;')).toBe('<');
    expect(decodeHTML('&#x3C;')).toBe('<');
    expect(decodeHTML('&#X3c;')).toBe('<');
    expect(decodeHTML('&#X3C;')).toBe('<');
  });

  test('decodes unterminated decimal references', () => {
    expect(decodeHTML('&#60aaa')).toBe('<aaa');
  });

  test('decodes unterminated hex references', () => {
    expect(decodeHTML('&#x3cZZZ')).toBe('<ZZZ');
  });

  test('decodes an unterminated single digit reference at the end of input', () => {
    expect(decodeHTML('aaa&#9')).toBe('aaa\t');
  });

  test('decodes numeric references with leading zeros', () => {
    expect(decodeHTML('&#x0000041;')).toBe('A');
  });

  test('remaps C1 controls to Windows-1252 characters', () => {
    expect(decodeHTML('&#x80')).toBe('\u20AC');
  });

  test('decodes numeric references that are not C1 controls', () => {
    expect(decodeHTML('&#160;')).toBe('\u00A0');
  });

  test('does not treat control characters as digits', () => {
    expect(decodeHTML('&#\u0011;')).toBe('&#\u0011;');
  });

  test('decodes a legacy entity followed by a partial match of a longer entity', () => {
    expect(decodeHTML('&notit;')).toBe('\u00ACit;');
  });

  test('lists valid HTML entity names in sorted order', () => {
    // The trie is built without checking the list
    for (let index = 0; index < entities.length; index += 2) {
      expect(entities[index]).toMatch(/^[a-zA-Z0-9]+;?$/);

      if (index !== 0) {
        expect(entities[index - 2] < entities[index]).toBe(true);
      }
    }
  });

  test('ignores unterminated non-legacy named entities', () => {
    expect(decodeHTML('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
  });

  test('ignores unknown named entities', () => {
    expect(decodeHTML('&foo;')).toBe('&foo;');
  });

  test('does not decode the output again', () => {
    expect(decodeHTML('&amp;amp;')).toBe('&amp;');
    expect(decodeHTML('&amp;#38;')).toBe('&#38;');
    expect(decodeHTML('&amp;#x26;')).toBe('&#x26;');
  });

  test('decodes multiple references', () => {
    expect(decodeHTML('&lt;&#34;&gt;')).toBe('<">');
  });

  test('decodes astral characters', () => {
    expect(decodeHTML('&#x1d306')).toBe('\uD834\uDF06');
    expect(decodeHTML('&#x1d11e')).toBe('\uD834\uDD1E');
  });
});

describe('decodeHTMLAttribute', () => {
  test('does not decode unterminated entities followed by "=" or an alphanumeric char', () => {
    expect(decodeHTMLAttribute('?aaa=111&copy=222&not333')).toBe('?aaa=111&copy=222&not333');
  });

  test('decodes unterminated entities followed by other chars', () => {
    expect(decodeHTMLAttribute('&copy &copy')).toBe('\u00A9 \u00A9');
  });

  test('decodes numeric references followed by "="', () => {
    expect(decodeHTMLAttribute('&#97=')).toBe('a=');
  });

  test('remaps C1 controls to Windows-1252 characters', () => {
    expect(decodeHTMLAttribute('&#128;')).toBe('\u20AC');
  });
});
