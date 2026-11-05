import { describe, expect, test } from 'vitest';
import { decodeXML } from '../main/decodeXML.ts';

describe('decodeXML', () => {
  test('decodes terminated decimal entities', () => {
    expect(decodeXML('&#60;')).toBe('<');
  });

  test('decodes terminated hex entities', () => {
    expect(decodeXML('&#x3c;')).toBe('<');
    expect(decodeXML('&#x3C;')).toBe('<');
    expect(decodeXML('&#X3c;')).toBe('<');
    expect(decodeXML('&#X3C;')).toBe('<');
  });

  test('ignores unterminated decimal entities', () => {
    expect(decodeXML('&#60')).toBe('&#60');
  });

  test('ignores unterminated hex entities', () => {
    expect(decodeXML('&#x3c')).toBe('&#x3c');
  });

  test('decodes known named entities', () => {
    expect(decodeXML('&amp;&apos;&gt;&lt;&quot;')).toBe('&\'><"');
  });

  test('ignores unknown named entities', () => {
    expect(decodeXML('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
  });

  test('ignores unterminated known named entities', () => {
    expect(decodeXML('&lt')).toBe('&lt');
    expect(decodeXML('&ltZZZ')).toBe('&ltZZZ');
  });

  test('does not decode the output again', () => {
    expect(decodeXML('&amp;amp;')).toBe('&amp;');
    expect(decodeXML('&amp;#38;')).toBe('&#38;');
    expect(decodeXML('&amp;#x26;')).toBe('&#x26;');
  });

  test('decodes multiple entities', () => {
    expect(decodeXML('&lt;&#34;&gt;')).toBe('<">');
  });

  test('decodes astral characters', () => {
    expect(decodeXML('&#x1d306;')).toBe('\uD834\uDF06');
    expect(decodeXML('&#x1d11e;')).toBe('\uD834\uDD1E');
  });

  test('does not remap C1 controls', () => {
    expect(decodeXML('&#x80;')).toBe('\u0080');
  });

  test('decodes out-of-range code points as a replacement character', () => {
    expect(decodeXML('&#x110000;')).toBe('\uFFFD');
  });
});
