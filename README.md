# speedy-entities [![build](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml)

[The fastest](#performance) XML/HTML entity decoder that supports customizable named character references.

```shell
npm install --save-prod speedy-entities
```

# Usage

⚠️ [API documentation is available here.](https://smikhalevski.github.io/speedy-entities/)

There are two preconfigured decoders: `decodeXml` and `decodeHtml`.

```ts
import {decodeXml, decodeHtml} from 'speedy-entities';

decodeXml('&#X61;&#98;&lt'); // → "ab&lt"

decodeHtml('&ltfoo&NotNestedGreaterGreater;'); // → "<foo\u2AA2\u0338"
```

You can create a custom decoder that would support custom entities.

```ts
import {createEntityDecoder, createEntityManager} from 'speedy-entities';

// Create an entity manager
const entityManager = createEntityManager();

// Register a new entity
entityManager.set('foo', 'okay');

// Register a new legacy entity
entityManager.set('bar', 'nope', true);

// Create a decoder
const decode = createEntityDecoder(entityManager);

decode('&foo;'); // → "okay"

decode('&bar'); // → "nope"

decode('&#X61;&#x62;&#x63;'); // → "abc"
```

# Performance

Clone this repo and use `npm ci && npm run perf` to run the performance testsuite. 

### XML character reference decoding

Results are in millions of operations per second. The higher number is better.

|  | speedy-entities <br/>`decodeXml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeXML` |
| ----------------------------- | ---: | ---: |
| `"&#X61;&#x62;&#x63;"`        |  3.26 | 1.42 |
| `"&#X61&#x62&#x63"`           | 10.81 | 4.70 |
| `"&#97;&#98;&#99;"`           |  3.09 | 1.41 |
| `"&#97&#98&#99"`              | 11.31 | 4.86 |
| `"&amp;&lt;&gt;"`             |  8.86 | 1.53 |
| `"&amp&lt&gt"`                |  9.33 | 4.71 |
| `"&NotNestedGreaterGreater;"` | 35.60 | 2.43 |
| `"&NotNestedGreaterGreater"`  | 34.82 | 3.80 |

### HTML character reference decoding

Results are in millions of operations per second. The higher number is better.

|  | speedy-entities <br/>`decodeHtml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeHTML` |
| ----------------------------- | ---: | ---: |
| `"&#X61;&#x62;&#x63;"`        | 3.18 | 1.07 |
| `"&#X61&#x62&#x63"`           | 3.25 | 1.04 |
| `"&#97;&#98;&#99;"`           | 3.06 | 1.06 |
| `"&#97&#98&#99"`              | 3.02 | 1.02 |
| `"&amp;&lt;&gt;"`             | 6.43 | 1.27 |
| `"&amp&lt&gt"`                | 6.72 | 1.24 |
| `"&NotNestedGreaterGreater;"` | 6.96 | 2.23 |
| `"&NotNestedGreaterGreater"`  | 7.05 | 3.63 |
