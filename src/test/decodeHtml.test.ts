import {decodeHtml} from '../main/full';

describe('decodeHtml', () => {

  it('decodes terminated decimal entities', () => {
    expect(decodeHtml('&#60;')).toBe('<');
  });

  it('decodes terminated hex entities', () => {
    expect(decodeHtml('&#x3c;')).toBe('<');
    expect(decodeHtml('&#x3C;')).toBe('<');
    expect(decodeHtml('&#X3c;')).toBe('<');
    expect(decodeHtml('&#X3C;')).toBe('<');
  });

  it('decodes unterminated decimal entities', () => {
    expect(decodeHtml('&#60aaa')).toBe('<aaa');
  });

  it('decodes unterminated hex entities', () => {
    expect(decodeHtml('&#x3cZZZ')).toBe('<ZZZ');
  });

  it('decodes terminated named entities', () => {
    expect(decodeHtml('&lt;')).toBe('<');
    expect(decodeHtml('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
  });

  it('decodes unterminated legacy named entities', () => {
    expect(decodeHtml('&lt')).toBe('<');
  });

  it('ignores unterminated non-legacy named entities', () => {
    expect(decodeHtml('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
  });

  it('ignores unknown named entities', () => {
    expect(decodeHtml('&foo;')).toBe('&foo;');
  });

  it('decodes unterminated known named entities', () => {
    expect(decodeHtml('&lt')).toBe('<');
    expect(decodeHtml('&ltZZZ')).toBe('<ZZZ');
  });

  it('ignores entities without a leading ampersand', () => {
    expect(decodeHtml('&amp;amp;')).toBe('&amp;');
    expect(decodeHtml('&amp;#38;')).toBe('&#38;');
    expect(decodeHtml('&amp;#x26;')).toBe('&#x26;');
  });

  it('decodes multiple entities', () => {
    expect(decodeHtml('&lt;&#34;&gt;')).toBe('<">');
  });

  it('decodes astral characters', () => {
    expect(decodeHtml('&#x1d306')).toBe('\ud834\udf06');
    expect(decodeHtml('&#x1d11e')).toBe('\ud834\udd1e');
  });

  it('decodes astral special characters', () => {
    expect(decodeHtml('&#x80')).toBe('\u20ac');
    expect(decodeHtml('&#x110000')).toBe('\ufffd');
  });

  it('decodes perf test samples', () => {
    expect(decodeHtml('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decodeHtml('&#X61&#x62&#x63')).toBe('abc');
    expect(decodeHtml('&#97;&#98;&#99;')).toBe('abc');
    expect(decodeHtml('&#97&#98&#99')).toBe('abc');
    expect(decodeHtml('&amp;&lt;&gt;')).toBe('&<>');
    expect(decodeHtml('&amp&lt&gt')).toBe('&<>');
    expect(decodeHtml('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
    expect(decodeHtml('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
  });
});
