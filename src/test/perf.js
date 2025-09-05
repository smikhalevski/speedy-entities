import { describe, measure, test } from 'toofast';
import {
  decodeHTML as lib_decodeHTML,
  decodeXML as lib_decodeXML,
  encodeXML as lib_encodeXML,
  escapeXML as lib_escapeXML,
} from '../../lib/index.js';
import {
  decodeHTML as entities_decodeHTML,
  decodeXML as entities_decodeXML,
  encodeXML as entities_encodeXML,
  escapeUTF8 as entities_escapeUTF8,
} from 'entities';
import { decode as htmlEntities_decode, encode as htmlEntities_encode } from 'html-entities';
import he from 'he';

const { decode: he_decode, encode: he_encode, escape: he_escape } = he;

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
      test('speedy-entities', () => {
        measure(() => {
          lib_decodeHTML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities_decodeHTML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'html5',
          scope: 'body',
        };

        measure(() => {
          htmlEntities_decode(value, options);
        });
      });

      test('he', () => {
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
      test('speedy-entities', () => {
        measure(() => {
          lib_decodeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities_decodeXML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          strict: true,
        };

        measure(() => {
          htmlEntities_decode(value, options);
        });
      });

      test('he', () => {
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
      test('speedy-entities', () => {
        measure(() => {
          lib_encodeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities_encodeXML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          mode: 'nonAscii',
        };

        measure(() => {
          htmlEntities_encode(value, options);
        });
      });

      test('he', () => {
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
      test('speedy-entities', () => {
        measure(() => {
          lib_escapeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities_escapeUTF8(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          mode: 'specialChars',
        };

        measure(() => {
          htmlEntities_encode(value, options);
        });
      });

      test('he', () => {
        measure(() => {
          he_escape(value);
        });
      });
    });
  }
});
