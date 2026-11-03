import { describe, expect, test } from 'vitest';
import { escapeXML } from '../main/escapeXML.js';

describe('escapeXML', () => {
  test('escapes special chars', () => {
    expect(escapeXML('&\'<>"')).toBe('&amp;&apos;&lt;&gt;&quot;');
  });

  test('preserves ASCII text', () => {
    expect(escapeXML('abc')).toBe('abc');
  });

  test('escapes special chars surrounded by text', () => {
    expect(escapeXML('__&__')).toBe('__&amp;__');
  });

  test('preserves non-ASCII chars', () => {
    expect(escapeXML('\uD83D\uDE18\u2764\uFE0F')).toBe('\uD83D\uDE18\u2764\uFE0F');
  });

  test('escapes the whole input after the previous call threw', () => {
    const inputMock = {
      toString() {
        return '<';
      },
      charCodeAt() {
        throw new Error('expected');
      },
    };

    // @ts-expect-error The input isn't a string
    expect(() => escapeXML(inputMock)).toThrow('expected');
    expect(escapeXML('<')).toBe('&lt;');
  });
});
