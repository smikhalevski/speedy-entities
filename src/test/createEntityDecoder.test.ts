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
    expect(decode('&#x1D11E')).toBe('\uD834\uDD1E');
  });

  test('code points are case-insensitive', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X3C;')).toBe(decode('&#x3c;'));
  });

  test('supports single digit char code', () => {
    const decode = createEntityDecoder();

    expect(decode('&#1;')).toBe('\u0001');
  });

  test('supports illegal code points', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X11FFFF;')).toBe('\uFFFd');
  });

  test('supports numeric entities', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });

  test('preserves invalid entities as is', () => {
    const decode = createEntityDecoder();

    expect(decode('&#;')).toBe('&#;');
    expect(decode('&#x;')).toBe('&#x;');
    expect(decode('&#X;')).toBe('&#X;');
    expect(decode('&# ;')).toBe('&# ;');
    expect(decode('&#Q;')).toBe('&#Q;');
  });
});
