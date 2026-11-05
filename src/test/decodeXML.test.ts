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
    expect(decodeXML('&#60a;')).toBe('&#60a;');
  });

  test('ignores unterminated hex entities', () => {
    expect(decodeXML('&#x3c')).toBe('&#x3c');
    expect(decodeXML('&#x3cg;')).toBe('&#x3cg;');
  });

  test('ignores numeric entities without digits', () => {
    expect(decodeXML('&#;')).toBe('&#;');
    expect(decodeXML('&#x;')).toBe('&#x;');
  });

  test('decodes known named entities', () => {
    expect(decodeXML('&amp;&apos;&gt;&lt;&quot;')).toBe('&\'><"');
  });

  test('ignores unknown named entities', () => {
    expect(decodeXML('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
    expect(decodeXML('&Lt;')).toBe('&Lt;');
  });

  test('ignores unterminated known named entities', () => {
    expect(decodeXML('&lt')).toBe('&lt');
    expect(decodeXML('&ltZZZ')).toBe('&ltZZZ');
    expect(decodeXML('&amp')).toBe('&amp');
    expect(decodeXML('&apos')).toBe('&apos');
    expect(decodeXML('&quot')).toBe('&quot');
  });

  test('does not decode the output again', () => {
    expect(decodeXML('&amp;amp;')).toBe('&amp;');
    expect(decodeXML('&amp;#38;')).toBe('&#38;');
    expect(decodeXML('&amp;#x26;')).toBe('&#x26;');
  });

  test('decodes multiple entities', () => {
    expect(decodeXML('&lt;&#34;&gt;')).toBe('<">');
  });

  test('decodes a reference that follows a bare ampersand', () => {
    expect(decodeXML('&&lt;')).toBe('&<');
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

  test('decodes the null char and surrogates as a replacement character', () => {
    expect(decodeXML('&#0;')).toBe('\uFFFD');
    expect(decodeXML('&#xD800;')).toBe('\uFFFD');
  });

  test('decodes code points that overflow 32 bits as a replacement character', () => {
    // Truncated to 32 bits, 0x100000041 would be 0x41, which is "A"
    expect(decodeXML('&#x100000041;')).toBe('\uFFFD');
  });
});
