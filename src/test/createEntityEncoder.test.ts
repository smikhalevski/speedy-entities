// noinspection ES6PreferShortImport
import {createEntityEncoder} from '../main/createEntityEncoder';

describe('createEntityEncoder', () => {

  test('supports arbitrary named entities', () => {
    const encode = createEntityEncoder({
      namedCharRefs: {
        foo: 'okay',
      },
      numericCharRefs: [60],
    });

    expect(encode('abc')).toBe('abc');
    expect(encode('<')).toBe("&#x3c;");
    expect(encode('okay')).toBe('&foo;');
    expect(encode('o')).toBe('o');
  });

  test('supports numeric entities', () => {
    const encode = createEntityEncoder({
      numericCharRefs: [38, 255, 252, 39],
    });

    expect(encode('&ÿü\'')).toBe("&#x26;&#xff;&#xfc;&#x27;");
  });
});
