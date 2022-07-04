const libSpeedyEntities = require('../../lib/index-cjs');
const libEntities = require('entities');
const libHtmlEntities = require('html-entities');
const libHe = require('he');

const valuesToDecode = [
  // '___&uuml;___&#x3f;___',
  'abc', // nothing to decode
  '&gtrapprox;&LeftTee;', // terminated non-legacy HTML
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&#x1f44a;&#x1f609;', // surrogate pair reference
  '&#x20AC;&#x2013;', // overridden char codes
  '&unknown;&leftxx;', // unknown
  // '&#X61&#x62&#x63', // unterminated hex
  // '&#97&#98&#99', // unterminated decimal
];

const valuesToEncode = [
  // '___ü___😘❤️___&<>___',
  'abc', // ASCII text, noop
  '<>&', // XML entity
  '\u00FF\u2A7D', // non-ASCII text
  '😘🔥', // surrogate pairs
];

describe(
  'decodeHtml',
  () => {
    for (const value of valuesToDecode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            libSpeedyEntities.decodeHtml(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            libEntities.decodeHTML(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'html5',
            scope: 'body',
          };

          measure(() => {
            libHtmlEntities.decode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            libHe.decode(value);
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
            libSpeedyEntities.decodeXml(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            libEntities.decodeXML(value);
          });
        });

        test('html-entities', measure => {
          measure(() => {
            const options = {
              level: 'xml',
              strict: true,
            };

            libHtmlEntities.decode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            libHe.decode(value);
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
            libSpeedyEntities.encodeXml(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            libEntities.encodeXML(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'xml',
            mode: 'nonAscii',
          };

          measure(() => {
            libHtmlEntities.encode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            libHe.encode(value);
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
            libSpeedyEntities.escapeXml(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            libEntities.escapeUTF8(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'xml',
            mode: 'specialChars',
          };

          measure(() => {
            libHtmlEntities.encode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            libHe.escape(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
