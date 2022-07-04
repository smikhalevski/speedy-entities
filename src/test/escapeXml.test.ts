import { escapeXml } from '../main';

describe('escapeXml', () => {
  test('encodes entities', () => {
    expect(escapeXml('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('preserves ASCII text', () => {
    expect(escapeXml('abc')).toBe('abc');
  });

  test('encodes entities surrounded by text', () => {
    expect(escapeXml('__&__')).toBe('__&amp;__');
  });

  test('does not encode surrogate pairs', () => {
    expect(escapeXml('😘❤️')).toBe('😘❤️');
  });
});
