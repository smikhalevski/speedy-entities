const lib = require('../../lib');
const entities = require('entities');
const htmlEntities = require('html-entities');
const he = require('he');

const valuesToDecode = [
  '___&uuml;___&#x3f;___',
  'abc', // nothing to decode
  '&gtrapprox;&LeftTee;', // terminated non-legacy HTML
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&#x1f44a;&#x1f609;', // surrogate pair reference
  '&#x20AC;&#x2013;', // overridden char codes
  '&unknown;&leftxx;', // unknown
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#97;&#98;&#99;', // terminated decimal
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
  'decodeHTML',
  () => {
    for (const value of valuesToDecode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            lib.decodeHTML(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            entities.decodeHTML(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'html5',
            scope: 'body',
          };

          measure(() => {
            htmlEntities.decode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            he.decode(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'decodeXML',
  () => {
    for (const value of valuesToDecode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            lib.decodeXML(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            entities.decodeXML(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'xml',
            strict: true,
          };

          measure(() => {
            htmlEntities.decode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            he.decode(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'encodeXML',
  () => {
    for (const value of valuesToEncode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            lib.encodeXML(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            entities.encodeXML(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'xml',
            mode: 'nonAscii',
          };

          measure(() => {
            htmlEntities.encode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            he.encode(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'escapeXML',
  () => {
    for (const value of valuesToEncode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            lib.escapeXML(value);
          });
        });

        test('entities', measure => {
          measure(() => {
            entities.escapeUTF8(value);
          });
        });

        test('html-entities', measure => {
          const options = {
            level: 'xml',
            mode: 'specialChars',
          };

          measure(() => {
            htmlEntities.encode(value, options);
          });
        });

        test('he', measure => {
          measure(() => {
            he.escape(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
