import { decodeHTML } from '../main';

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

  test('decodes terminated named entities', () => {
    expect(decodeHTML('&lt;')).toBe('<');
    expect(decodeHTML('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
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
    expect(decodeHTML('&#x1d306')).toBe('\ud834\udf06');
    expect(decodeHTML('&#x1d11e')).toBe('\ud834\udd1e');
  });

  test('decodes astral special characters', () => {
    expect(decodeHTML('&#x80')).toBe('\u20ac');
    expect(decodeHTML('&#x110000')).toBe('\ufffd');
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
});
