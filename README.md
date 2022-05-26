# speedy-entities&ensp;🏎&ensp;[![build](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml)

[The fastest](#performance) XML/HTML entity decoder that supports customizable named character references.

```shell
npm install --save-prod speedy-entities
```

# Usage

[API documentation is available here.](https://smikhalevski.github.io/speedy-entities/)

## Preconfigured decoders

There are two preconfigured decoders: `decodeXml` and `decodeHtml`.

```ts
import {decodeXml, decodeHtml} from 'speedy-entities';

decodeXml('&#X61;&#98;&lt;'); // → "ab&lt"
decodeHtml('&ltfoo&AElig'); // → "<foo\u00c6"
decodeHtml('&NotNestedGreaterGreater;&CounterClockwiseContourIntegral;');
// → "\u2aa2\u0338\u2233"
```

You can add custom entities that `decodeXml` and `decodeHtml` would recognize:

```ts
import {decodeXml, decodeHtml, xmlEntityManager, htmlEntityManager} from 'speedy-entities';

xmlEntityManager.set('foo', 'okay');
decodeXml('&foo;'); // → "okay"

htmlEntityManager.set('bar', 'nope');
decodeHtml('&bar;'); // → "nope"
```

## Custom decoders

You can create a custom decoder that would recognize custom entities.

```ts
import {createEntityDecoder, EntityManager} from 'speedy-entities';

// Create an entity manager
const entityManager = new EntityManager();

// Register a new entity
entityManager.set('foo', 'okay');

// Register a new legacy entity
entityManager.set('bar', 'nope', true);

// Register a batch of entities
entityManager.set({
  foo: 'okay',
  qux: 'yeah',
});

// Create a decoder
const decode = createEntityDecoder(entityManager);

// Decode non-legacy entities
decode('&foo'); // → "&foo"
decode('&foo;'); // → "okay"

// Decode legacy entities
decode('&bar'); // → "nope"
decode('&bar;'); // → "nope"

// Decode numeric character references
decode('&#X61;&#x62;&#x63;'); // → "abc"
```

# Performance

Clone this repo and use `npm ci && npm run perf` to run the performance testsuite.

Results are in millions of operations per second. The higher number is better.

|  | speedy-entities <br/>`decodeXml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeXML` | speedy-entities <br/>`decodeHtml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeHTML` |
| ----------------------------- | ---: | ---: | ---: | ---: |
| `"&#X61;&#x62;&#x63;"`        | 2.36 | 1.25 | 2.29 | 0.88 |
| `"&#X61&#x62&#x63"`           | 4.61 | 3.00 | 2.39 | 0.72 |
| `"&#97;&#98;&#99;"`           | 2.24 | 0.71 | 2.25 | 0.92 |
| `"&#97&#98&#99"`              | 5.09 | 3.07 | 2.21 | 0.88 |
| `"&amp;&lt;&gt;"`             | 3.98 | 1.28 | 3.34 | 1.06 |
| `"&amp&lt&gt"`                | 4.08 | 3.10 | 3.46 | 1.02 |
| `"&NotNestedGreaterGreater;"` | 6.47 | 1.84 | 3.80 | 1.64 |
| `"&NotNestedGreaterGreater"`  | 6.44 | 2.74 | 4.00 | 2.41 |
