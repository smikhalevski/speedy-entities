import { describe, expect, test } from 'vitest';
import { createEntityTrie } from '../main/createEntityTrie.ts';
import { createEntityTrieDecoder } from '../main/createEntityTrieDecoder.ts';

describe('createEntityTrieDecoder', () => {
  test('decoders that share a trie use their own options', () => {
    const entityTrie = createEntityTrie({ aaa: 'bbb' });

    const decode = createEntityTrieDecoder(entityTrie);
    const decodeAttribute = createEntityTrieDecoder(entityTrie, { isAttributeValue: true });

    expect(decode('&aaa=')).toBe('bbb=');
    expect(decodeAttribute('&aaa=')).toBe('&aaa=');
  });

  test('decodes "&amp;" with the value from the trie', () => {
    expect(createEntityTrieDecoder(createEntityTrie({ 'amp;': 'x' }))('a&amp;b')).toBe('axb');
    expect(createEntityTrieDecoder(createEntityTrie({ amp: '&' }))('a&amp;b')).toBe('a&;b');
    expect(createEntityTrieDecoder(createEntityTrie({ ampx: 'y' }))('a&amp;b')).toBe('a&amp;b');
    expect(createEntityTrieDecoder(createEntityTrie({}))('a&amp;b')).toBe('a&amp;b');
  });

  test('decodes "&amp;" next to text and other references', () => {
    const decode = createEntityTrieDecoder(createEntityTrie({ 'amp;': '&', amp: '&', 'lt;': '<' }));

    expect(decode('&amp;')).toBe('&');
    expect(decode('a&amp;b&amp;&amp;c&lt;&amp;')).toBe('a&b&&c<&');
    expect(decode('&amp;&amp')).toBe('&&');
    expect(decode('&amp&amp;x')).toBe('&&x');
    expect(decode('&am&amp;')).toBe('&am&');
  });

  test('decodes numeric references to chars in and around the table of common chars', () => {
    const decode = createEntityTrieDecoder(createEntityTrie({}));
    const decodeWithoutC1 = createEntityTrieDecoder(createEntityTrie({}), { areC1ControlsRemapped: false });

    for (const [startCodePoint, endCodePoint] of [
      [1, 0x7f],
      [0xa0, 0x101],
      [0x1fff, 0x2070],
    ]) {
      for (let codePoint = startCodePoint; codePoint <= endCodePoint; ++codePoint) {
        const value = String.fromCharCode(codePoint);

        expect(decode('&#' + codePoint + ';')).toBe(value);
        expect(decode('&#x' + codePoint.toString(16) + ';')).toBe(value);
        expect(decodeWithoutC1('&#' + codePoint + ';')).toBe(value);
      }
    }

    expect(decode('&#0;&#x80;&#159;')).toBe('�€Ÿ');
    expect(decodeWithoutC1('&#0;&#x80;&#159;')).toBe('�\u0080\u009F');
  });

  test('decodes numeric references next to spaces and other references', () => {
    const decode = createEntityTrieDecoder(createEntityTrie({ 'lt;': '<' }));

    expect(decode('&#97; &#98;&#99;  &#100;')).toBe('a bc  d');
    expect(decode('&#97; &lt; &#x62; &')).toBe('a < b &');
    expect(decode('&#97; &zz; &#98; b&#99;x &#100; ')).toBe('a &zz; b bcx d ');
    expect(decode('&#97; &#98')).toBe('a b');
    expect(decode('&#97; &')).toBe('a &');
    expect(decode('&#97;  ')).toBe('a  ');
  });

  test('decodes "&nbsp;" with the value from the trie', () => {
    expect(createEntityTrieDecoder(createEntityTrie({ 'nbsp;': 'x' }))('a&nbsp;b')).toBe('axb');
    expect(createEntityTrieDecoder(createEntityTrie({ nbsp: '_' }))('a&nbsp;b')).toBe('a_;b');
    expect(createEntityTrieDecoder(createEntityTrie({ nbspx: 'y' }))('a&nbsp;b')).toBe('a&nbsp;b');
    expect(createEntityTrieDecoder(createEntityTrie({}))('a&nbsp;b')).toBe('a&nbsp;b');
  });

  test('decodes the longest name that the chars read start with', () => {
    const decode = createEntityTrieDecoder(createEntityTrie({ a: '1', 'abc;': '2', abcde: '3', b: '4' }));

    expect(decode('&a')).toBe('1');
    expect(decode('&ab')).toBe('1b');
    expect(decode('&abc')).toBe('1bc');
    expect(decode('&abc;')).toBe('2');
    expect(decode('&abcd;')).toBe('1bcd;');
    expect(decode('&abcde;')).toBe('3;');
    expect(decode('&a\u00e9&b&c')).toBe('1\u00e94&c');
  });
});
