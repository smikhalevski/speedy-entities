import { createEntityDecoder } from '../main';

describe('createEntityDecoder', () => {
  test('supports arbitrary named entities', () => {
    const decode = createEntityDecoder({
      entities: {
        'foo;': 'okay',
        'bar;': 'nope',
        bar: 'nope',
      },
    });

    expect(decode('&foo;')).toBe('okay');
    expect(decode('&foo')).toBe('&foo');
    expect(decode('&bar;')).toBe('nope');
    expect(decode('&bar')).toBe('nope');
    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
    expect(decode('&#97;&#98;&#99;')).toBe('abc');
    expect(decode('&#X61&#x62&#x63')).toBe('abc');
    expect(decode('&#97&#98&#99')).toBe('abc');
    expect(decode('&#X3C;')).toBe('<');
    expect(decode('&#x1D11E')).toBe('\uD834\uDD1E');
  });

  test('supports numeric references', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X61;&#x62;&#x63;')).toBe('abc');
  });

  test('numeric references are case-insensitive', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X3C;')).toBe(decode('&#x3c;'));
  });

  test('supports single digit numeric references', () => {
    const decode = createEntityDecoder();

    expect(decode('&#1;')).toBe('\u0001');
  });

  test('renders illegal code points as a replacement character', () => {
    const decode = createEntityDecoder();

    expect(decode('&#X11FFFF;')).toBe('\uFFFd');
  });

  test('preserves invalid entities as is', () => {
    const decode = createEntityDecoder();

    expect(decode('&#;')).toBe('&#;');
    expect(decode('&;')).toBe('&;');
    expect(decode('&#x;')).toBe('&#x;');
    expect(decode('&#X;')).toBe('&#X;');
    expect(decode('&# ;')).toBe('&# ;');
    expect(decode('&#Q;')).toBe('&#Q;');
  });
});
