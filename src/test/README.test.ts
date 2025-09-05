import { expect, test } from 'vitest';
import { createEntityDecoder } from '../main/createEntityDecoder.js';

test('custom decoder example', () => {
  const decode = createEntityDecoder({
    entities: {
      '&foo;': 'okay',
      '&qux;': 'yeah',
    },
    isNumericReferenceSemicolonRequired: true,
  });

  expect(decode('&foo;'), 'okay');

  expect(decode('&foo'), '&foo');

  expect(decode('&#X61;&#x62;&#x63;'), 'abc');
});
