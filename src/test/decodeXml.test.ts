import {decodeXml} from '../main';

describe('decodeXml', () => {

  it('decodes terminated decimal entities', () => {
    expect(decodeXml('&#60;')).toBe('<');
  });

  it('decodes terminated hex entities', () => {
    expect(decodeXml('&#x3c;')).toBe('<');
    expect(decodeXml('&#x3C;')).toBe('<');
    expect(decodeXml('&#X3c;')).toBe('<');
    expect(decodeXml('&#X3C;')).toBe('<');
  });

  it('ignores unterminated decimal entities', () => {
    expect(decodeXml('&#60')).toBe('&#60');
  });

  it('ignores unterminated hex entities', () => {
    expect(decodeXml('&#x3c')).toBe('&#x3c');
  });

  it('decodes known named entities', () => {
    expect(decodeXml('&lt;')).toBe('<');
  });

  it('ignores unknown named entities', () => {
    expect(decodeXml('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
  });

  it('ignores unterminated known named entities', () => {
    expect(decodeXml('&lt')).toBe('&lt');
    expect(decodeXml('&ltZZZ')).toBe('&ltZZZ');
  });

  it('ignores entities without a leading ampersand', () => {
    expect(decodeXml('&amp;amp;')).toBe('&amp;');
    expect(decodeXml('&amp;#38;')).toBe('&#38;');
    expect(decodeXml('&amp;#x26;')).toBe('&#x26;');
  });

  it('decodes multiple entities', () => {
    expect(decodeXml('&lt;&#34;&gt;')).toBe('<">');
  });

  it('decodes astral characters', () => {
    expect(decodeXml('&#x1d306;')).toBe('\ud834\udf06');
    expect(decodeXml('&#x1d11e;')).toBe('\ud834\udd1e');
  });

  it('decodes astral special characters', () => {
    expect(decodeXml('&#x80;')).toBe('\u20ac');
    expect(decodeXml('&#x110000;')).toBe('\ufffd');
  });

  it('decodes perf test samples', () => {
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
