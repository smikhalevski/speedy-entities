# speedy-entities&ensp;🏎💨&ensp;[![build](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/speedy-entities/actions/workflows/master.yml)

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

You can create a custom decoder that would recognize numeric and custom entities.

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

|                               | speedy-entities <br/>`decodeXml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeXML` | speedy-entities <br/>`decodeHtml` | [fb55/entities](https://github.com/fb55/entities) <br/>`decodeHTML` |
|-------------------------------|---------------------------------:| ---: | ---: | ---: |
| `"&#X61;&#x62;&#x63;"`        | 3.9 | 2.5 | 4.3 | 2.5 |
| `"&#X61&#x62&#x63"`           | 5.1 | 2.7 | 4.3 | 2.4 |
| `"&#97;&#98;&#99;"`           | 4.5 | 2.4 | 4.5 | 2.4 |
| `"&#97&#98&#99"`              | 5.5 | 2.4 | 4.2 | 2.3 |
| `"&amp;&lt;&gt;"`             | 3.8 | 3.3 | 3.7 | 3.1 |
| `"&amp&lt&gt"`                | 3.6 | 3.4 | 3.6 | 3.3 |
| `"&NotNestedGreaterGreater;"` | 5.3 | 4.6 | 3.9 | 3.2 |
| `"&NotNestedGreaterGreater"`  | 5.3 | 4.6 | 3.9 | 3.3 |
