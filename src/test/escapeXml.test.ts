import { escapeXml } from '../main';

describe('escapeXml', () => {
  test('encodes to names character references', () => {
    expect(escapeXml('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('does not encode UTF code points', () => {
    expect(escapeXml('\u2269\uFE00')).toBe('\u2269\uFE00');
  });

  test('does not encode ASCII', () => {
    expect(escapeXml('abc')).toBe('abc');
  });
});
