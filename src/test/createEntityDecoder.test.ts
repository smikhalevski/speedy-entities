import {createEntityDecoder, EntityManager} from '../main';

describe('createEntityDecoder', () => {

  test('supports arbitrary named entities', () => {
    const entityManager = new EntityManager();

    entityManager.set('foo', 'okay');
    entityManager.set('bar', 'nope', true);

    const decode = createEntityDecoder(entityManager);

    expect(decode('&foo;')).toBe('okay');
    expect(decode('&bar')).toBe('nope');
    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decode('&#97;&#98;&#99;')).toBe('abc');
    expect(decode('&#X3C;')).toBe('<');
    expect(decode('&#x1d11e')).toBe('\ud834\udd1e');
  });

  test('supports numeric entities', () => {
    const decode = createEntityDecoder(new EntityManager());

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });
});
