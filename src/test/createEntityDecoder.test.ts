import {createEntityDecoder, createEntityManager} from '../main';

describe('createEntityDecoder', () => {

  test('supports arbitrary named entities', () => {
    const entityManager = createEntityManager();

    entityManager.set('foo', 'okay');
    entityManager.set('bar', 'nope', true);

    const decode = createEntityDecoder(entityManager);

    expect(decode('&foo;')).toBe('okay');
    expect(decode('&bar')).toBe('nope');
    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });

  test('supports numeric entities', () => {
    const decode = createEntityDecoder(createEntityManager());

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });
});
