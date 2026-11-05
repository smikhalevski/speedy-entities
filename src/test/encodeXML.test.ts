import { describe, expect, test } from 'vitest';
import { encodeXML } from '../main/encodeXML.ts';

describe('encodeXML', () => {
  test('encodes special chars', () => {
    expect(encodeXML('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('preserves ASCII text', () => {
    expect(encodeXML('abc')).toBe('abc');
  });

  test('encodes special chars surrounded by text', () => {
    expect(encodeXML('__&__')).toBe('__&amp;__');
  });

  test('encodes surrogate pairs', () => {
    expect(encodeXML('\uD83D\uDE18\u2764\uFE0F')).toBe('&#x1f618;&#x2764;&#xfe0f;');
  });

  test('replaces lone surrogates with a replacement character', () => {
    expect(encodeXML('\uD800aaa')).toBe('&#xfffd;aaa');
    expect(encodeXML('\uDFFF')).toBe('&#xfffd;');
  });

  test('encodes chars from U+0080', () => {
    expect(encodeXML('\u007F\u0080\u00E9')).toBe('\u007F&#x80;&#xe9;');
  });

  test('encodes chars after long runs of plain chars', () => {
    // The run fills the inline scan, so the regexp finds the char
    expect(encodeXML('a'.repeat(24) + '<')).toBe('a'.repeat(24) + '&lt;');

    expect(encodeXML('a'.repeat(30) + '<')).toBe('a'.repeat(30) + '&lt;');

    // The previous call left the regexp's lastIndex past the end of this input
    expect(encodeXML('b'.repeat(29) + '\u0080')).toBe('b'.repeat(29) + '&#x80;');
  });

  test('preserves a long run of plain chars', () => {
    expect(encodeXML('a'.repeat(30))).toBe('a'.repeat(30));
  });

  test('encodes chars at the boundaries of reference lengths', () => {
    expect(encodeXML('\u07FF\u0800\u0FFF\u1000\uFFFF')).toBe('&#x7ff;&#x800;&#xfff;&#x1000;&#xffff;');
    expect(encodeXML(String.fromCodePoint(0x10000, 0xfffff, 0x100000, 0x10ffff))).toBe(
      '&#x10000;&#xfffff;&#x100000;&#x10ffff;'
    );
  });
});
