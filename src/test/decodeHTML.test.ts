import * as entities from 'entities';
import { describe, expect, test } from 'vitest';
import { decodeHTML, decodeHTMLAttribute } from '../main/decodeHTML.ts';
import htmlEntities from '../main/html-entities.ts';

describe('decodeHTML', () => {
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

  test('remaps C1 controls to Windows-1252 characters', () => {
    expect(decodeHTML('&#x80')).toBe('\u20AC');
  });

  test('decodes numeric entities that are not C1 controls', () => {
    expect(decodeHTML('&#160;')).toBe('\u00A0');
  });

  test('does not treat control characters as digits', () => {
    expect(decodeHTML('&#\u0011;')).toBe('&#\u0011;');
  });

  test('decodes a legacy entity followed by a partial match of a longer entity', () => {
    expect(decodeHTML('&notit;')).toBe('\u00ACit;');
  });

  test('decodes every HTML entity', () => {
    const entityReferences = Object.keys(htmlEntities);

    // The HTML standard defines 2231 named references
    expect(entityReferences.length).toBe(2231);

    // The entities package has its own table, so a wrong value in html-entities.ts fails the test
    for (const entityReference of entityReferences) {
      expect(decodeHTML('&' + entityReference)).toBe(entities.decodeHTML('&' + entityReference));
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

  test('decodes multiple entities', () => {
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

  test('decodes numeric references without a semicolon', () => {
    expect(decodeHTMLAttribute('&#97=')).toBe('a=');
  });

  test('remaps C1 controls to Windows-1252 characters', () => {
    expect(decodeHTMLAttribute('&#128;')).toBe('\u20AC');
  });
});
