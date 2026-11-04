import * as entities from 'entities';
import * as he from 'he';
import * as htmlEntities from 'html-entities';
import { describe, measure, test } from 'toofast';
// @ts-ignore npm run docs must not require lib
import * as speedyEntities from '../../lib/index.js';

// Node.js types aren't loaded by tsconfig.json
declare const process: { env: { GROUP_MEASURE?: '1' | '2' } };

/**
 * If `true`, each group of inputs gets one test per library. Set by GROUP_MEASURE=1.
 */
const isTestPerGroup = process.env.GROUP_MEASURE === '1';

/**
 * If `true`, each function gets one test per library. Set by GROUP_MEASURE=2.
 */
const isTestPerFunction = process.env.GROUP_MEASURE === '2';

const REPEAT_COUNT = 200;
const MIXED_TEXT_LENGTH = 10_000;

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

const decodeInputs = {
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

const encodeInputs = {
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

// Created once, so measured calls don't allocate them
const htmlEntitiesDecodeHTMLOptions: htmlEntities.DecodeOptions = { level: 'html5', scope: 'body' };
const htmlEntitiesDecodeXMLOptions: htmlEntities.DecodeOptions = { level: 'xml', scope: 'strict' };
const htmlEntitiesEncodeXMLOptions: htmlEntities.EncodeOptions = { level: 'xml', mode: 'nonAscii' };
const htmlEntitiesEscapeXMLOptions: htmlEntities.EncodeOptions = { level: 'xml', mode: 'specialChars' };

describeFunction('decodeHTML', decodeInputs, {
  'speedy-entities': speedyEntities.decodeHTML,
  entities: entities.decodeHTML,
  'html-entities': input => htmlEntities.decode(input, htmlEntitiesDecodeHTMLOptions),
  he: he.decode,
});

describeFunction('decodeXML', decodeInputs, {
  'speedy-entities': speedyEntities.decodeXML,
  entities: entities.decodeXML,
  'html-entities': input => htmlEntities.decode(input, htmlEntitiesDecodeXMLOptions),
  he: he.decode,
});

describeFunction('encodeXML', encodeInputs, {
  'speedy-entities': speedyEntities.encodeXML,
  entities: entities.encodeXML,
  'html-entities': input => htmlEntities.encode(input, htmlEntitiesEncodeXMLOptions),
  he: he.encode,
});

describeFunction('escapeXML', encodeInputs, {
  'speedy-entities': speedyEntities.escapeXML,
  entities: entities.escapeUTF8,
  'html-entities': input => htmlEntities.encode(input, htmlEntitiesEscapeXMLOptions),
  he: he.escape,
});

type Libraries = Record<string, (input: string) => string>;

/**
 * Declares a test for each library and each input, or fewer tests if {@linkcode isTestPerGroup} or
 * {@linkcode isTestPerFunction}. Tests run in separate processes, so libraries don't affect each other's optimizations.
 */
function describeFunction(
  functionName: string,
  inputGroups: Record<string, Record<string, string>>,
  libraries: Libraries
) {
  describe(functionName, () => {
    if (isTestPerFunction) {
      const allInputs = Object.values(inputGroups).flatMap(inputs => Object.values(inputs));

      testLibraries(libraries, allInputs);
      return;
    }

    for (const [groupName, inputs] of Object.entries(inputGroups)) {
      describe(groupName, () => {
        if (isTestPerGroup) {
          testLibraries(libraries, Object.values(inputs));
          return;
        }

        for (const [inputName, input] of Object.entries(inputs)) {
          describe(inputName, () => {
            testLibraries(libraries, [input]);
          });
        }
      });
    }
  });
}

/**
 * Declares a test for each library, with a measure for each input. toofast averages the call durations of all measures
 * in a test, so slow inputs weigh more, and the margin of error includes the spread between inputs.
 */
function testLibraries(libraries: Libraries, inputs: string[]) {
  const sequentialInputs = inputs.map(toSequentialString);

  for (const [libraryName, run] of Object.entries(libraries)) {
    test(libraryName, () => {
      for (const input of sequentialInputs) {
        measure(() => {
          run(input);
        });
      }
    });
  }
}

/**
 * Joins tokens in a fixed pseudo-random order until the text is long enough. Unlike a repeated pattern, branch
 * prediction can't memorize it.
 */
function makeMixedText(tokens: string[], length: number) {
  let text = '';
  let seed = 1;

  while (text.length < length) {
    // Linear congruential generator, high bits are more random than low bits
    seed = (Math.imul(seed, 1_103_515_245) + 12_345) >>> 0;
    text += tokens[(seed >>> 16) % tokens.length];
  }
  return text;
}

/**
 * Returns a flat copy of a string. Strings built with `+=` or `repeat` are ropes, and how fast a rope is read depends
 * on when GC flattens it.
 */
function toSequentialString(str: string): string {
  return JSON.parse(JSON.stringify(str));
}
