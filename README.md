# speedy-entities 🏎💨

[The fastest](#performance) XML/HTML entity encoder/decoder in
[13 kB gzipped](https://bundlephobia.com/package/speedy-entities).

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

Results are in millions of operations per second (MHz). The higher number is better.

|                           Library | Decode HTML | Decode XML | Encode XML | Escape XML |
| --------------------------------: | ----------: | ---------: | ---------: | ---------: |
| **speedy-entities**&#x200B;@3.1.0 |     **4.9** |    **5.2** |    **5.3** |    **7.2** |
|        **entities**&#x200B;@6.0.1 |         3.4 |        3.6 |        4.5 |        6.1 |
|   **html-entities**&#x200B;@2.6.0 |         2.2 |        2.3 |        3.3 |        5.1 |
|              **he**&#x200B;@1.2.0 |         1.9 |        1.8 |        2.2 |        5.2 |

Tests were conducted using [TooFast](https://github.com/smikhalevski/toofast#readme) on Apple M1 with Node.js v23.11.1.

To reproduce [the performance test suite](./src/test/perf/overall.perf.js) results, clone this repo and run:

```shell
npm ci
npm run build
npm run perf
```
