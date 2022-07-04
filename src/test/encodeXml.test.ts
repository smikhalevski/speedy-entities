import { encodeXml } from '../main';

describe('encodeXml', () => {
  test('encodes entities', () => {
    expect(encodeXml('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('preserves ASCII text', () => {
    expect(encodeXml('abc')).toBe('abc');
  });

  test('encodes entities surrounded by text', () => {
    expect(encodeXml('__&__')).toBe('__&amp;__');
  });

  test('encodes surrogate pairs', () => {
    expect(encodeXml('😘❤️')).toBe('&#x1f618;&#x2764;&#xfe0f;');
  });
});
