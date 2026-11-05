<p align="center">
  <a href="#readme"><img alt="Speedy Entities" src="./assets/logo.png" width="350" /></a>
</p>

[The fastest](#performance) XML/HTML entity encoder/decoder in
[13 kB gzipped](https://bundlephobia.com/package/speedy-entities).

- Keeps all HTML entities in about 120 kB of RAM.
- [13 kB gzipped](https://bundlephobia.com/package/speedy-entities), including all HTML entities.
- Decodes HTML like browsers do, including all 2 231 named references and the special rules for attribute values.
- Decodes your own entities with [custom decoders](#custom-decoder).
- Zero dependencies.

```shell
npm install --save-prod speedy-entities
```

Each function can also be imported from its own path. Unlike the package root, such a path loads only the modules that
the function needs, so it doesn't build the HTML entity trie unless the function decodes HTML:

```ts
import { escapeXML } from 'speedy-entities/escapeXML';
```

# Decode

There are three preconfigured decoders: `decodeXML`, `decodeHTML` and `decodeHTMLAttribute`.

```ts
import { decodeXML, decodeHTML, decodeHTMLAttribute } from 'speedy-entities';

decodeXML('&#X61;&#98;&lt');
// ⮕ 'ab&lt'

decodeHTML('&ltfoo&AElig');
// ⮕ '<foo\u00c6'

decodeHTML('&NotNestedGreaterGreater;&CounterClockwiseContourIntegral;');
// ⮕ '\u2aa2\u0338\u2233'

// Like browsers, preserves unterminated entities followed by "=" or an alphanumeric char
decodeHTMLAttribute('/search?a=1&copy=2&reg');
// ⮕ '/search?a=1&copy=2\u00ae'
```

## Custom decoder

You can create a decoder that decodes your custom character entity references:

```ts
import { createEntityDecoder } from 'speedy-entities';

// Create a decoder
const decode = createEntityDecoder({
  entities: {
    '&foo;': 'okay',
    '&qux;': 'yeah',
  },
  isNumericReferenceSemicolonRequired: true,
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

`createEntityDecoder` accepts these options:

<dl>
<dt><code>entities</code></dt>
<dd>

Entity references mapped to their values. A reference is an optional `&`, a name of ASCII letters, digits and `-.:_`,
and an optional `;`. If a reference has the `;`, the input needs it too.

`createEntityDecoder` throws an error if a reference doesn't match this format.

Defaults to `{}`.

</dd>
<dt><code>isNumericReferenceSemicolonRequired</code></dt>
<dd>

If `true`, numeric references are decoded only if they end with `;`, as XML requires.

Defaults to `false`.

</dd>
<dt><code>areC1ControlsRemapped</code></dt>
<dd>

If `true`, `&#128;` to `&#159;` are decoded as Windows-1252 characters, as HTML does. For example, `&#128;` is decoded
as `€`.

Defaults to `true`.

</dd>
<dt><code>isAttributeValue</code></dt>
<dd>

If `true`, a named reference without `;` that is followed by `=` or an ASCII letter or digit isn't decoded, as HTML does
in attribute values.

Defaults to `false`.

</dd>
</dl>

## Sharing a trie

`createEntityDecoder` builds a trie of entity names on every call. To create several decoders for the same entities,
build the trie once with `createEntityTrie` and pass it to `createEntityTrieDecoder`, which accepts the same options
except `entities`. This is how `decodeHTML` and `decodeHTMLAttribute` share one trie of HTML entities.

```ts
import { createEntityTrie, createEntityTrieDecoder } from 'speedy-entities';

const entityTrie = createEntityTrie({
  '&foo;': 'okay',
  '&qux': 'yeah',
});

const decodeText = createEntityTrieDecoder(entityTrie);

const decodeAttribute = createEntityTrieDecoder(entityTrie, { isAttributeValue: true });

decodeText('&foo;&qux=1');
// ⮕ 'okayyeah=1'

decodeAttribute('&foo;&qux=1');
// ⮕ 'okay&qux=1'
```

# Encode

`encodeXML` replaces `"&'<>` with XML entities and non-ASCII characters with numeric character references, so the output
is ASCII-only. A lone surrogate is encoded as `&#xfffd;`.

`escapeXML` escapes only `"&'<>` characters.

```ts
import { encodeXML, escapeXML } from 'speedy-entities';

encodeXML('&😘❤️');
// ⮕ '&amp;&#x1f618;&#x2764;&#xfe0f;'

escapeXML('&😘❤️');
// ⮕ '&amp;😘❤️'
```

# Performance

Results are in thousands of operations per second (kHz). The higher number is better.

|                                                                 Library |                                                      Library Size |   Decode HTML | Decode XML |   Encode XML |    Escape XML |
| ----------------------------------------------------------------------: | ----------------------------------------------------------------: | ------------: | ---------: | -----------: | ------------: |
|                                           speedy-&#xFEFF;entities@4.0.0 | [13.6 kB](https://bundlephobia.com/package/speedy-entities@3.1.0) | 🥇 **161.74** |  🥈 181.92 | 🥇 **85.43** | 🥇 **216.82** |
|                      [entities](https://github.com/fb55/entities)@9.0.0 |        [21.7 kB](https://bundlephobia.com/package/entities@6.0.1) |        150.36 | **202.38** |        66.02 |        198.83 |
| [html-&#xFEFF;entities](https://github.com/mdevils/html-entities)@2.6.0 |   [13.3 kB](https://bundlephobia.com/package/html-entities@2.6.0) |         39.64 |      49.36 |        33.76 |        127.65 |
|                         [he](https://github.com/mathiasbynens/he)@2.0.0 |              [29.9 kB](https://bundlephobia.com/package/he@1.2.0) |         30.52 |      30.92 |        21.78 |        129.98 |

Tests were conducted using [TooFast](https://github.com/smikhalevski/toofast#readme) on Apple M1 with Node.js v26.11.1.

To reproduce [the performance test suite](src/test/perf.ts) results, clone this repo and run:

```shell
npm ci
npm run build
GROUP_MEASURE=2 npm run perf
```

The inputs of each function are split into groups, such as short and long inputs. `GROUP_MEASURE` sets what a test
covers:

<dl>
<dt>Unset</dt>
<dd>

Each input is one test per library.

</dd>
<dt><code>GROUP_MEASURE=1</code></dt>
<dd>

Each group of inputs is one test per library.

</dd>
<dt><code>GROUP_MEASURE=2</code></dt>
<dd>

Each function is one test per library.

</dd>
</dl>

A grouped test measures each of its inputs separately and combines the results, so its margin of error includes the
spread between inputs.

Pass a name pattern to run some of the tests:

```shell
GROUP_MEASURE=1 npm run perf -- 'decodeHTML*'
```
