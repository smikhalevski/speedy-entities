import {createEntityEncoder} from '../main';

describe('createEntityEncoder', () => {

  test('supports arbitrary named entities', () => {
    const encode = createEntityEncoder({
      namedCharacterReferences: {
        foo: 'okay',
      },
      numericCharacterReferences: [60],
    });

    expect(encode('abc')).toBe('abc');
    expect(encode('<')).toBe('&#60;');
    expect(encode('okay')).toBe('&foo;');
  });

  test('supports numeric entities', () => {
    const encode = createEntityEncoder({
      numericCharacterReferences: [38, 255, 252, 39],
    });

    expect(encode('&ÿü\'')).toBe('&#38;&#255;&#252;&#39;');
  });
});
