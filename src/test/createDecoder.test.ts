import {createDecoder} from '../main/createDecoder';
import {lookupXmlEntity} from '../main/lookupXmlEntity';
import {lookupHtmlEntity} from '../main/lookupHtmlEntity';

describe('createDecoder', () => {

  const decodeXml = createDecoder(lookupXmlEntity);
  const decodeHtml = createDecoder(lookupHtmlEntity);

  it('decodes decimal entities', () => {
    expect(decodeXml('&#60;')).toBe('<');
  });

  it('decodes hex entities', () => {
    expect(decodeXml('&#x3c;')).toBe('<');
    expect(decodeXml('&#x3C;')).toBe('<');
    expect(decodeXml('&#X3c;')).toBe('<');
    expect(decodeXml('&#X3C;')).toBe('<');
  });

  it('decodes known named entities', () => {
    expect(decodeXml('&lt;')).toBe('<');
    expect(decodeHtml('&NotNestedGreaterGreater;')).toBe('\u2AA2\u0338');
  });

  it('ignores unknown named entities', () => {
    expect(decodeXml('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
    expect(decodeHtml('&foo;')).toBe('&foo;');
  });

  it('ignores entities without a leading ampersand', () => {
    expect(decodeXml('&amp;amp;')).toBe('&amp;');
    expect(decodeXml('&amp;#38;')).toBe('&#38;');
    expect(decodeXml('&amp;#x26;')).toBe('&#x26;');
  });

  it('decodes all entities in the string', () => {
    expect(decodeXml('&lt;&#34;&gt;')).toBe('<">');
  });

  it('decodes astral characters', () => {
    expect(decodeXml('&#x1d306')).toBe('\ud834\udf06');
    expect(decodeXml('&#x1d11e')).toBe('\ud834\udd1e');
  });

  it('decodes astral special characters', () => {
    expect(decodeXml('&#x80')).toBe('\u20ac');
    expect(decodeXml('&#x110000')).toBe('\ufffd');
  });

  it('XML requires a trailing semicolon', () => {
    expect(decodeXml('&lt')).toBe('&lt');
    expect(decodeXml('&ltfoo')).toBe('&ltfoo');
  });

  it('HTML does not require a trailing semicolon for legacy entities', () => {
    expect(decodeHtml('&lt')).toBe('<');
    expect(decodeHtml('&ltfoo')).toBe('<foo');
  });

  it('HTML requires a trailing semicolon for non-legacy entities', () => {
    expect(decodeHtml('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
    expect(decodeHtml('&NotNestedGreaterGreaterfoo')).toBe('&NotNestedGreaterGreaterfoo');
  });

  it('decodes mixed legacy and non-legacy entities', () => {
    expect(decodeXml('&amp&NotNestedGreaterGreater;&gt')).toBe('&amp&NotNestedGreaterGreater;&gt');
    expect(decodeHtml('&amp&NotNestedGreaterGreater;&gt')).toBe('&⪢̸>');
  });
});
