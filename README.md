# speedy-entities&ensp;🏎💨&ensp;[![build](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml)

[The fastest](#performance) XML/HTML entity encoder/decoder in
[23 kB gzipped](https://bundlephobia.com/package/speedy-entities).

```shell
npm install --save-prod speedy-entities
```

# Decode

There are two preconfigured decoders: `decodeXML` and `decodeHTML`.

```ts
import { decodeXML, decodeHTML } from 'speedy-entities';

decodeXML('&#X61;&#98;&lt');
// ⮕ 'ab&lt'

decodeHTML('&ltfoo&AElig');
// ⮕ '<foo\u00c6'

decodeHTML('&NotNestedGreaterGreater;&CounterClockwiseContourIntegral;');
// ⮕ '\u2aa2\u0338\u2233'
```

## Custom decoder

You can create a decoder that decodes custom named entities:

```ts
import { arrayTrieEncode, trieCreate, trieSet } from '@smikhalevski/trie';
import { createEntityDecoder } from 'speedy-entities';

// Create a trie that would hold entities
const trie = trieCreate<string>();

// Register named entities
trieSet('foo;', 'okay');
trieSet('qux;', 'yeah');

// Encode a trie
const entitiesTrie = arrayTrieEncode(trie);

// Create a decoder
const decode = createEntityDecoder({
  entitiesTrie,
  numericReferenceSemicolonRequired: true,
});

// Decode entities
decode('&foo;');
// ⮕ 'okay'

decode('&foo');
// ⮕ '&foo'

// Decode numeric character references
decode('&#X61;&#x62;&#x63;');
// ⮕ 'abc'
```

# Encode

`encodeXML` encodes non-ASCII characters as named XML entities or as numeric references.

`escapeXML` escapes only `"&'<>` characters.

```ts
import { encodeXML, escapeXML } from 'speedy-entities';

encodeXML('&😘❤️');
// ⮕ '&amp;&#x1f618;&#x2764;&#xfe0f;'

escapeXML('&😘❤️');
// ⮕ '&amp;😘❤'
```

# Performance

Clone this repo and use `npm ci && npm run perf` to run the performance testsuite.

Results are in millions of operations per second. The higher number is better.

### Decode

![Decode HTML performance chart](./images/perf-decode-html.svg)

### Encode

![Encode XML performance chart](./images/perf-encode-xml.svg)
