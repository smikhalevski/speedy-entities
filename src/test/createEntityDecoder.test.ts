import { createEntityDecoder } from '../main';

describe('createEntityDecoder', () => {
  test('supports arbitrary named entities', () => {
    const decode = createEntityDecoder({
      namedCharRefs: { foo: 'okay' },
      legacyNamedCharRefs: { bar: 'nope' },
    });

    expect(decode('&foo;')).toBe('okay');
    expect(decode('&bar')).toBe('nope');
    expect(decode('&bar;')).toBe('nope');
    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decode('&#97;&#98;&#99;')).toBe('abc');
    expect(decode('&#X3C;')).toBe('<');
    expect(decode('&#x1d11e')).toBe('\ud834\udd1e');
  });

  test('supports numeric entities', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });
});
