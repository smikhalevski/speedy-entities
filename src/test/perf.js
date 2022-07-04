const { escapeUTF8, encodeXML, decodeXML, decodeHTML } = require('entities');
const { escapeXml, encodeXml, decodeXml, decodeHtml } = require('../../lib/index-cjs');

const valuesToDecode = [
  '___&uuml;___&#x3f;___',
  'abc', // ASCII text, noop
  '&#x1f44a;&#x1f609;', // terminated code point
  '&#x20AC;&#x2013;', // overridden char codes
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#X61&#x62&#x63', // unterminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&#97&#98&#99', // unterminated decimal
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&NotNestedGreaterGreater;', // terminated non-legacy HTML
  '&NotNestedGreaterGreater', // unterminated non-legacy HTML, unrecognized
];

const valuesToEncode = [
  '___ü___😘❤️___&<>___',
  'abc', // ASCII text, noop
  '<>&', // legacy entity
  '\u00FF', // non-legacy entity
  '\u2269\uFE00', // code point
];

describe(
  'decodeHtml',
  () => {
    for (const value of valuesToDecode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            decodeHtml(value);
          });
        });

        test('fb55/entities', measure => {
          measure(() => {
            decodeHTML(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'decodeXml',
  () => {
    for (const value of valuesToDecode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            decodeXml(value);
          });
        });

        test('fb55/entities', measure => {
          measure(() => {
            decodeXML(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'encodeXml',
  () => {
    for (const value of valuesToEncode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            encodeXml(value);
          });
        });

        test('fb55/entities', measure => {
          measure(() => {
            encodeXML(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'escapeXml',
  () => {
    for (const value of valuesToEncode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            escapeXml(value);
          });
        });

        test('fb55/entities', measure => {
          measure(() => {
            escapeUTF8(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
