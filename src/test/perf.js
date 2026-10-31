import { describe, measure, test } from 'toofast';
import * as lib from '../../lib/index.js';
import * as entities from 'entities';
import * as htmlEntities from 'html-entities';
import * as he from 'he';

/**
 * If `true` then each measured operation processes all values of a group, so each value is weighted by its actual
 * cost. Otherwise, each value is measured in a separate test.
 *
 * Calling `measure` once per value in the same test doesn't work: toofast merges samples of all measures, and fast
 * values collect far more samples, so they dominate the result.
 */
const isGroupMeasure = false;

const REPEAT_COUNT = 200;
const MIXED_TEXT_LENGTH = 10_000;

/**
 * Concatenates tokens in a fixed pseudo-random order until the text reaches the length. Unlike a repeated pattern,
 * the result has no short period, so branch prediction can't memorize it.
 */
function makeMixedText(tokens, length) {
  let text = '';
  let seed = 1;

  while (text.length < length) {
    // Linear congruential generator, high bits are more random than low bits
    seed = (Math.imul(seed, 1_103_515_245) + 12_345) >>> 0;
    text += tokens[(seed >>> 16) % tokens.length];
  }
  return text;
}

// Common entities are listed several times, so they occur as often as in real HTML
// prettier-ignore
const htmlTextTokens = [
  'the ', 'quick ', 'brown ', 'fox ', 'jumps ', 'over ', 'lazy ', 'dog. ', 'Lorem ', 'ipsum ', 'dolor ', 'sit ',
  '&amp; ', '&amp; ', '&amp; ', '&lt;', '&lt;', '&gt;', '&gt;', '&quot;', '&quot;', '&#39;', '&#39;', '&nbsp;',
  '&nbsp;', '&mdash;', '&copy; ', '&eacute;', '&hellip;', '&#x2014;', '&#8217;', 'AT&T ', 'Q&A ',
];

// prettier-ignore
const escapedCodeTokens = [
  '&lt;', '&lt;/', '&gt;', '&quot;', '&amp;&amp; ', '&#39;', 'div', 'span ', 'class=', 'href=', 'const ', 'x ',
  '= ', '(', ')', '{ ', '} ', '\n  ',
];

const numericTokens = ['&#169;', '&#x2014;', '&#8217;', '&#39;', '&#x27;', '&#x1F600;', '&#128;', '&#160;', ' '];

const valuesToDecode = {
  // Measure per-call overhead, which dominates when a parser decodes each text node and attribute separately
  short: {
    empty: '',
    no_ampersand: 'The quick brown fox',
    text_node: 'Tom &amp; Jerry',
    attribute_url: '/search?q=a&amp;page=2&amp;sort=desc',
    escaped_quotes: 'It&#39;s &quot;fine&quot;',
    escaped_markup: '&lt;a href=&quot;#&quot;&gt;link&lt;/a&gt;',
    nbsp: '10&nbsp;km&nbsp;/&nbsp;h',
    numeric_references: '&#169; &#x2014; &#x1F600;',
    legacy_unterminated: '&copy 2026 &amp more',
    unknown_entities: 'AT&T &foo; &zzzzzzzz',
    bare_ampersands: 'Q&A & R&D',
    truncated: 'Tom &am',
  },

  // Measure throughput
  long: {
    no_entities: 'The quick brown fox jumps over the lazy dog. '.repeat(REPEAT_COUNT),
    html_text: makeMixedText(htmlTextTokens, MIXED_TEXT_LENGTH),
    escaped_code: makeMixedText(escapedCodeTokens, MIXED_TEXT_LENGTH),
    numeric_references: makeMixedText(numericTokens, MIXED_TEXT_LENGTH),
    url_query_strings: '/search?q=entities&lang=en&page=2&sort=desc&utm_source=newsletter&callback=handleResult'.repeat(
      REPEAT_COUNT
    ),
  },

  // Stress a specific path of the decoder, not representative of real text
  edge_cases: {
    deepest_trie_path: '&CounterClockwiseContourIntegral;&ClockwiseContourIntegral;',
    longest_match_falls_back: '&notit; &ampx &copyright &lta',
    letters_after: '&zzzzzzzzzzzzzzzz; &Abcdefghijklmnopqrstuvwxyz',
    non_ascii_after: '&\u00E9t\u00E9 &\u4E2D\u6587',
    numeric_edge_cases: '&#60abc &#x0000041; &#99999999; &#0; &#xD800;',
  },
};

const valuesToEncode = {
  short: {
    empty: '',
    text: 'Tom & Jerry',
    markup: "<b>Tom & Jerry's</b>",
    latin_text: 'Caf\u00E9 cr\u00E8me',
    emoji: '\uD83D\uDE18\u2764\uFE0F',
  },

  long: {
    ascii_no_specials: 'The quick brown fox jumps over the lazy dog. '.repeat(REPEAT_COUNT),
    ascii_markup: '<a href="/search?q=a&page=2">Tom & Jerry\'s</a> '.repeat(REPEAT_COUNT),
    latin_text: 'Caf\u00E9 cr\u00E8me br\u00FBl\u00E9e, na\u00EFve fa\u00E7ade. '.repeat(REPEAT_COUNT),
    cjk_text: '\u4E2D\u6587\u7684\u6587\u672C\u3002'.repeat(REPEAT_COUNT),
    emoji: '\uD83D\uDE18\u2764\uFE0F\uD83D\uDD25 '.repeat(REPEAT_COUNT),
  },
};

const htmlEntitiesDecodeHTMLOptions = { level: 'html5', scope: 'body' };
const htmlEntitiesDecodeXMLOptions = { level: 'xml', scope: 'strict' };
const htmlEntitiesEncodeXMLOptions = { level: 'xml', mode: 'nonAscii' };
const htmlEntitiesEscapeXMLOptions = { level: 'xml', mode: 'specialChars' };

/**
 * Measures each implementation on each group of values.
 *
 * Each test runs in a separate process, so implementations don't affect each other's optimizations.
 */
function describeImplementations(name, implementations, valueGroups) {
  describe(name, () => {
    for (const groupName of Object.keys(valueGroups)) {
      const values = valueGroups[groupName];

      describe(groupName, () => {
        if (isGroupMeasure) {
          const groupValues = Object.values(values);

          for (const libraryName of Object.keys(implementations)) {
            const implementation = implementations[libraryName];

            test(libraryName, () => {
              measure(() => {
                for (const value of groupValues) {
                  implementation(value);
                }
              });
            });
          }
          return;
        }

        for (const valueName of Object.keys(values)) {
          const value = values[valueName];

          describe(valueName, () => {
            for (const libraryName of Object.keys(implementations)) {
              const implementation = implementations[libraryName];

              test(libraryName, () => {
                measure(() => {
                  implementation(value);
                });
              });
            }
          });
        }
      });
    }
  });
}

describeImplementations(
  'decodeHTML',
  {
    'speedy-entities': value => lib.decodeHTML(value),
    entities: value => entities.decodeHTML(value),
    'html-entities': value => htmlEntities.decode(value, htmlEntitiesDecodeHTMLOptions),
    he: value => he.decode(value),
  },
  valuesToDecode
);

describeImplementations(
  'decodeXML',
  {
    'speedy-entities': value => lib.decodeXML(value),
    entities: value => entities.decodeXML(value),
    'html-entities': value => htmlEntities.decode(value, htmlEntitiesDecodeXMLOptions),
    he: value => he.decode(value),
  },
  valuesToDecode
);

describeImplementations(
  'encodeXML',
  {
    'speedy-entities': value => lib.encodeXML(value),
    entities: value => entities.encodeXML(value),
    'html-entities': value => htmlEntities.encode(value, htmlEntitiesEncodeXMLOptions),
    he: value => he.encode(value),
  },
  valuesToEncode
);

describeImplementations(
  'escapeXML',
  {
    'speedy-entities': value => lib.escapeXML(value),
    entities: value => entities.escapeUTF8(value),
    'html-entities': value => htmlEntities.encode(value, htmlEntitiesEscapeXMLOptions),
    he: value => he.escape(value),
  },
  valuesToEncode
);
