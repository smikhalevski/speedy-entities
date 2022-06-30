const { escapeUTF8, encodeHTML, decodeXML, decodeHTML } = require('entities');
const { encodeXml, encodeAsciiHtml, decodeXml, decodeHtml } = require('../../lib/index-cjs');

const valuesToDecode = [
  'abc', // ASCII text
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#X61&#x62&#x63', // unterminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&#97&#98&#99', // unterminated decimal
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&NotNestedGreaterGreater;', // terminated non-legacy HTML
  '&NotNestedGreaterGreater', // unterminated non-legacy HTML
  '&NotNestedGreaterGreate', // unrecognized entity
];

const valuesToEncode = [
  'abc', // ASCII text
  '<>&', // numeric character reference
  '\u00FF', // named character reference
  '\u2269\uFE00', // code point, named character reference
];

describe(
  'Decode end-to-end',
  () => {
    const textToDecode = 'This is a simple text &uuml;ber &#x3f; something.';

    test('speedy-entities', measure => {
      measure(() => {
        decodeHtml(textToDecode);
      });
    });

    test('fb55/entities', measure => {
      measure(() => {
        decodeHTML(textToDecode);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Encode end-to-end',
  () => {
    const textToDecode = "über & unter's sprießende <boo> ❤️👊😉";

    test('speedy-entities', measure => {
      measure(() => {
        encodeAsciiHtml(textToDecode);
      });
    });

    test('fb55/entities', measure => {
      measure(() => {
        encodeHTML(textToDecode);
      });
    });
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Decode XML',
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
  'Decode HTML',
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
  'Encode XML',
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
            escapeUTF8(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);

describe(
  'Encode HTML',
  () => {
    for (const value of valuesToEncode) {
      describe(value, () => {
        test('speedy-entities', measure => {
          measure(() => {
            encodeAsciiHtml(value);
          });
        });

        test('fb55/entities', measure => {
          measure(() => {
            encodeHTML(value);
          });
        });
      });
    }
  },
  { warmupIterationCount: 100, targetRme: 0.002 }
);
