const {
  decodeHTML: lib_decodeHTML,
  decodeXML: lib_decodeXML,
  encodeXML: lib_encodeXML,
  escapeXML: lib_escapeXML,
} = require('../../lib');
const {
  decodeHTML: entities_decodeHTML,
  decodeXML: entities_decodeXML,
  encodeXML: entities_encodeXML,
  escapeUTF8: entities_escapeUTF8,
} = require('entities');
const { decode: htmlEntities_decode, encode: htmlEntities_encode } = require('html-entities');
const { decode: he_decode, encode: he_encode, escape: he_escape } = require('he');

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

describe('decodeHTML', () => {
  for (const value of valuesToDecode) {
    describe(value, () => {
      test('speedy-entities', measure => {
        measure(() => {
          lib_decodeHTML(value);
        });
      });

      test('entities', measure => {
        measure(() => {
          entities_decodeHTML(value);
        });
      });

      test('html-entities', measure => {
        const options = {
          level: 'html5',
          scope: 'body',
        };

        measure(() => {
          htmlEntities_decode(value, options);
        });
      });

      test('he', measure => {
        measure(() => {
          he_decode(value);
        });
      });
    });
  }
});

describe('decodeXML', () => {
  for (const value of valuesToDecode) {
    describe(value, () => {
      test('speedy-entities', measure => {
        measure(() => {
          lib_decodeXML(value);
        });
      });

      test('entities', measure => {
        measure(() => {
          entities_decodeXML(value);
        });
      });

      test('html-entities', measure => {
        const options = {
          level: 'xml',
          strict: true,
        };

        measure(() => {
          htmlEntities_decode(value, options);
        });
      });

      test('he', measure => {
        measure(() => {
          he_decode(value);
        });
      });
    });
  }
});

describe('encodeXML', () => {
  for (const value of valuesToEncode) {
    describe(value, () => {
      test('speedy-entities', measure => {
        measure(() => {
          lib_encodeXML(value);
        });
      });

      test('entities', measure => {
        measure(() => {
          entities_encodeXML(value);
        });
      });

      test('html-entities', measure => {
        const options = {
          level: 'xml',
          mode: 'nonAscii',
        };

        measure(() => {
          htmlEntities_encode(value, options);
        });
      });

      test('he', measure => {
        measure(() => {
          he_encode(value);
        });
      });
    });
  }
});

describe('escapeXML', () => {
  for (const value of valuesToEncode) {
    describe(value, () => {
      test('speedy-entities', measure => {
        measure(() => {
          lib_escapeXML(value);
        });
      });

      test('entities', measure => {
        measure(() => {
          entities_escapeUTF8(value);
        });
      });

      test('html-entities', measure => {
        const options = {
          level: 'xml',
          mode: 'specialChars',
        };

        measure(() => {
          htmlEntities_encode(value, options);
        });
      });

      test('he', measure => {
        measure(() => {
          he_escape(value);
        });
      });
    });
  }
});
