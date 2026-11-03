import { expect, test } from 'vitest';
import {
  createEntityDecoder,
  createEntityTrie,
  createEntityTrieDecoder,
  decodeHTML,
  decodeHTMLAttribute,
  decodeXML,
  encodeXML,
  escapeXML,
} from '../main/index.ts';

test('decode example', () => {
  expect(decodeXML('&#X61;&#98;&lt')).toBe('ab&lt');

  expect(decodeHTML('&ltfoo&AElig')).toBe('<foo\u00C6');

  expect(decodeHTML('&NotNestedGreaterGreater;&CounterClockwiseContourIntegral;')).toBe('\u2AA2\u0338\u2233');

  expect(decodeHTMLAttribute('/search?a=1&copy=2&reg')).toBe('/search?a=1&copy=2\u00AE');
});

test('custom decoder example', () => {
  const decode = createEntityDecoder({
    entities: {
      '&foo;': 'okay',
      '&qux;': 'yeah',
    },
    isNumericReferenceSemicolonRequired: true,
  });

  expect(decode('&foo;')).toBe('okay');

  expect(decode('&foo')).toBe('&foo');

  expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
});

test('sharing a trie example', () => {
  const entityTrie = createEntityTrie({
    '&foo;': 'okay',
    '&qux': 'yeah',
  });

  const decodeText = createEntityTrieDecoder(entityTrie);

  const decodeAttribute = createEntityTrieDecoder(entityTrie, { isAttributeValue: true });

  expect(decodeText('&foo;&qux=1')).toBe('okayyeah=1');

  expect(decodeAttribute('&foo;&qux=1')).toBe('okay&qux=1');
});

test('encode example', () => {
  expect(encodeXML('&\uD83D\uDE18\u2764\uFE0F')).toBe('&amp;&#x1f618;&#x2764;&#xfe0f;');

  expect(escapeXML('&\uD83D\uDE18\u2764\uFE0F')).toBe('&amp;\uD83D\uDE18\u2764\uFE0F');
});
