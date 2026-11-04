# speedy-entities 🏎💨

[The fastest](#performance) XML/HTML entity encoder/decoder in
[13 kB gzipped](https://bundlephobia.com/package/speedy-entities).

```shell
npm install --save-prod speedy-entities
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

Results are in millions of operations per second (MHz). The higher number is better.

|                                                                 Library |                                                      Library Size | Decode HTML | Decode XML | Encode XML | Escape XML |
| ----------------------------------------------------------------------: | ----------------------------------------------------------------: | ----------: | ---------: | ---------: | ---------: |
|                                           speedy-&#xFEFF;entities@3.1.0 | [13.3 kB](https://bundlephobia.com/package/speedy-entities@3.1.0) |     **4.9** |    **5.2** |    **5.3** |    **7.2** |
|                      [entities](https://github.com/fb55/entities)@6.0.1 |        [26.6 kB](https://bundlephobia.com/package/entities@6.0.1) |         3.4 |        3.6 |        4.5 |        6.1 |
| [html-&#xFEFF;entities](https://github.com/mdevils/html-entities)@2.6.0 |   [13.2 kB](https://bundlephobia.com/package/html-entities@2.6.0) |         2.2 |        2.3 |        3.3 |        5.1 |
|                         [he](https://github.com/mathiasbynens/he)@1.2.0 |              [29.6 kB](https://bundlephobia.com/package/he@1.2.0) |         1.9 |        1.8 |        2.2 |        5.2 |

Tests were conducted using [TooFast](https://github.com/smikhalevski/toofast#readme) on Apple M1 with Node.js v23.11.1.

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
