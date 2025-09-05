import { expect, test } from 'vitest';
import { decodeXML } from '../main/decodeXML.js';

test('decodes terminated decimal entities', () => {
  expect(decodeXML('&#60;')).toBe('<');
});

test('decodes terminated hex entities', () => {
  expect(decodeXML('&#x3c;')).toBe('<');
  expect(decodeXML('&#x3C;')).toBe('<');
  expect(decodeXML('&#X3c;')).toBe('<');
  expect(decodeXML('&#X3C;')).toBe('<');
});

test('ignores unterminated decimal entities', () => {
  expect(decodeXML('&#60')).toBe('&#60');
});

test('ignores unterminated hex entities', () => {
  expect(decodeXML('&#x3c')).toBe('&#x3c');
});

test('decodes known named entities', () => {
  expect(decodeXML('&lt;')).toBe('<');
});

test('ignores unknown named entities', () => {
  expect(decodeXML('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
});

test('ignores unterminated known named entities', () => {
  expect(decodeXML('&lt')).toBe('&lt');
  expect(decodeXML('&ltZZZ')).toBe('&ltZZZ');
});

test('ignores entities without a leading ampersand', () => {
  expect(decodeXML('&amp;amp;')).toBe('&amp;');
  expect(decodeXML('&amp;#38;')).toBe('&#38;');
  expect(decodeXML('&amp;#x26;')).toBe('&#x26;');
});

test('decodes multiple entities', () => {
  expect(decodeXML('&lt;&#34;&gt;')).toBe('<">');
});

test('decodes astral characters', () => {
  expect(decodeXML('&#x1d306;')).toBe('\ud834\udf06');
  expect(decodeXML('&#x1d11e;')).toBe('\ud834\udd1e');
});

test('decodes astral special characters', () => {
  expect(decodeXML('&#x80;')).toBe('\u20ac');
  expect(decodeXML('&#x110000;')).toBe('\ufffd');
});

test('decodes perf test samples', () => {
  expect(decodeXML('&#X61;&#x62;&#x63;')).toBe('abc');
  expect(decodeXML('&#X61&#x62&#x63')).toBe('&#X61&#x62&#x63');
  expect(decodeXML('&#97;&#98;&#99;')).toBe('abc');
  expect(decodeXML('&#97&#98&#99')).toBe('&#97&#98&#99');
  expect(decodeXML('&amp;&lt;&gt;')).toBe('&<>');
  expect(decodeXML('&amp&lt&gt')).toBe('&amp&lt&gt');
  expect(decodeXML('&NotNestedGreaterGreater;')).toBe('&NotNestedGreaterGreater;');
  expect(decodeXML('&NotNestedGreaterGreater')).toBe('&NotNestedGreaterGreater');
});
