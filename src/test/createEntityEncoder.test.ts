import {createEntityEncoder, EntityManager} from '../main';

describe('createEntityEncoder', () => {

  test('supports arbitrary named entities', () => {
    const entityManager = new EntityManager();

    entityManager.set('foo', 'okay');
    entityManager.set('bar', 'nope', true);

    const encode = createEntityEncoder(entityManager);

    expect(encode('abc')).toBe('abc');
    expect(encode('<')).toBe('&#60;');
    expect(encode('okay')).toBe('&foo;');
  });

  test('supports numeric entities', () => {
    const encode = createEntityEncoder(new EntityManager());

    expect(encode('&ÿü\'')).toBe('&#38;&#255;&#252;&#39;');
  });
});