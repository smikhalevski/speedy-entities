import { describe, expect, test } from 'vitest';
import { decodeXML } from '../main/decodeXML.ts';

describe('decodeXML', () => {
  test('decodes terminated decimal references', () => {
    expect(decodeXML('&#60;')).toBe('<');
  });

  test('decodes terminated hex references', () => {
    expect(decodeXML('&#x3c;')).toBe('<');
    expect(decodeXML('&#x3C;')).toBe('<');
    expect(decodeXML('&#X3c;')).toBe('<');
    expect(decodeXML('&#X3C;')).toBe('<');
    expect(decodeXML('&#xA9;&#xFF;')).toBe('\u00A9\u00FF');
  });

  test('ignores unterminated decimal references', () => {
    expect(decodeXML('&#60')).toBe('&#60');
    expect(decodeXML('&#60a;')).toBe('&#60a;');
  });

  test('ignores unterminated hex references', () => {
    expect(decodeXML('&#x3c')).toBe('&#x3c');
    expect(decodeXML('&#x3cg;')).toBe('&#x3cg;');
  });

  test('ignores numeric references without digits', () => {
    expect(decodeXML('&#;')).toBe('&#;');
    expect(decodeXML('&#x;')).toBe('&#x;');

    // "/" comes right before "0"
    expect(decodeXML('&#/;')).toBe('&#/;');
    expect(decodeXML('&#x/;')).toBe('&#x/;');
  });

  test('decodes known named entities', () => {
    expect(decodeXML('&amp;&apos;&gt;&lt;&quot;')).toBe('&\'><"');
  });

  test('ignores unknown named entities', () => {
    expect(decodeXML('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
    expect(decodeXML('&Lt;')).toBe('&Lt;');

    // Each differs from a known name in one char
    expect(decodeXML('&lx;')).toBe('&lx;');
    expect(decodeXML('&axp;&amx;')).toBe('&axp;&amx;');
    expect(decodeXML('&axos;&apxs;&apox;')).toBe('&axos;&apxs;&apox;');
    expect(decodeXML('&xuot;&qxot;&quxt;&quox;')).toBe('&xuot;&qxot;&quxt;&quox;');
  });

  test('ignores unterminated known named entities', () => {
    expect(decodeXML('&lt')).toBe('&lt');
    expect(decodeXML('&ltZZZ')).toBe('&ltZZZ');
    expect(decodeXML('&amp')).toBe('&amp');
    expect(decodeXML('&apos')).toBe('&apos');
    expect(decodeXML('&quot')).toBe('&quot');
    expect(decodeXML('&ampZZZ')).toBe('&ampZZZ');
    expect(decodeXML('&aposZZZ')).toBe('&aposZZZ');
    expect(decodeXML('&quotZZZ')).toBe('&quotZZZ');
  });

  test('does not decode the output again', () => {
    expect(decodeXML('&amp;amp;')).toBe('&amp;');
    expect(decodeXML('&amp;#38;')).toBe('&#38;');
    expect(decodeXML('&amp;#x26;')).toBe('&#x26;');
  });

  test('decodes multiple references', () => {
    expect(decodeXML('&lt;&#34;&gt;')).toBe('<">');
  });

  test('decodes a reference that follows a bare ampersand', () => {
    expect(decodeXML('&&lt;')).toBe('&<');
  });

  test('ignores known names that do not follow "&"', () => {
    expect(decodeXML('xlt;&xlt;&lt;xlt;')).toBe('xlt;&xlt;<xlt;');
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

  test('decodes the largest code point', () => {
    expect(decodeXML('&#x10FFFF;')).toBe('\uDBFF\uDFFF');
  });

  test('decodes the null char and surrogates as a replacement character', () => {
    expect(decodeXML('&#0;')).toBe('\uFFFD');
    expect(decodeXML('&#xD800;')).toBe('\uFFFD');
    expect(decodeXML('&#xDFFF;')).toBe('\uFFFD');
  });

  test('decodes code points that overflow 32 bits as a replacement character', () => {
    // Truncated to 32 bits, 0x100000041 would be 0x41, which is "A"
    expect(decodeXML('&#x100000041;')).toBe('\uFFFD');
  });
});
