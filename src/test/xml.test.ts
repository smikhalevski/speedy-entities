import { decodeXml, encodeXml } from '../main';

describe('decodeXml', () => {
  test('decodes terminated decimal entities', () => {
    expect(decodeXml('&#60;')).toBe('<');
  });

  test('decodes terminated hex entities', () => {
    expect(decodeXml('&#x3c;')).toBe('<');
    expect(decodeXml('&#x3C;')).toBe('<');
    expect(decodeXml('&#X3c;')).toBe('<');
    expect(decodeXml('&#X3C;')).toBe('<');
  });

  test('ignores unterminated decimal entities', () => {
    expect(decodeXml('&#60')).toBe('&#60');
  });

  test('ignores unterminated hex entities', () => {
    expect(decodeXml('&#x3c')).toBe('&#x3c');
  });

  test('decodes known named entities', () => {
    expect(decodeXml('&lt;')).toBe('<');
  });

  test('ignores unknown named entities', () => {
    expect(decodeXml('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
  });

  test('ignores unterminated known named entities', () => {
    expect(decodeXml('&lt')).toBe('&lt');
    expect(decodeXml('&ltZZZ')).toBe('&ltZZZ');
  });

  test('ignores entities without a leading ampersand', () => {
    expect(decodeXml('&amp;amp;')).toBe('&amp;');
    expect(decodeXml('&amp;#38;')).toBe('&#38;');
    expect(decodeXml('&amp;#x26;')).toBe('&#x26;');
  });

  test('decodes multiple entities', () => {
    expect(decodeXml('&lt;&#34;&gt;')).toBe('<">');
  });

  test('decodes astral characters', () => {
    expect(decodeXml('&#x1d306;')).toBe('\ud834\udf06');
    expect(decodeXml('&#x1d11e;')).toBe('\ud834\udd1e');
  });

  test('decodes astral special characters', () => {
    expect(decodeXml('&#x80;')).toBe('\u20ac');
    expect(decodeXml('&#x110000;')).toBe('\ufffd');
  });

  test('decodes perf test samples', () => {
    expect(decodeXml('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decodeXml('&#X61&#x62&#x63')).toBe('&#X61&#x62&#x63');
    expect(decodeXml('&#97;&#98;&#99;')).toBe('abc');
    expect(decodeXml('&#97&#98&#99')).toBe('&#97&#98&#99');
    expect(decodeXml('&amp;&lt;&gt;')).toBe('&<>');
    expect(decodeXml('&amp&lt&gt')).toBe('&amp&lt&gt');
    expect(decodeXml('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
    expect(decodeXml('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
  });
});

describe('encodeXml', () => {
  test('encodes to names character references', () => {
    expect(encodeXml('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('does not encode UTF code points', () => {
    expect(encodeXml('\u2269\uFE00')).toBe('\u2269\uFE00');
  });

  test('does not encode ASCII', () => {
    expect(encodeXml('abc')).toBe('abc');
  });
});
