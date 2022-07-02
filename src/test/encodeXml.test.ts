import { encodeXml } from '../main';

describe('encodeXml', () => {
  test('encodes XML entities', () => {
    expect(encodeXml('&\'><"')).toBe('&amp;&apos;&gt;&lt;&quot;');
  });

  test('encodes XML entities surrounded by text', () => {
    expect(encodeXml('__&__')).toBe('__&amp;__');
  });

  test('encodes non-ASCII code points', () => {
    expect(encodeXml('__❤️👊😉__')).toBe('__&#x2764;&#xfe0f;&#x1f44a;&#x1f609;__');
  });
});
