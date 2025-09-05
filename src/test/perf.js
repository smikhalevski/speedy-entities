import { describe, measure, test } from 'toofast';
import * as lib from '../../lib/index.js';
import * as entities from 'entities';
import * as htmlEntities from 'html-entities';
import he from 'he';

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

const isAverageMeasure = true;

describe('decodeHTML', () => {
  if (isAverageMeasure) {
    test('speedy-entities', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          lib.decodeHTML(value);
        });
      }
    });

    test('entities', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          entities.decodeHTML(value);
        });
      }
    });

    test('html-entities', () => {
      const options = {
        level: 'html5',
        scope: 'body',
      };

      for (const value of valuesToDecode) {
        measure(() => {
          htmlEntities.decode(value, options);
        });
      }
    });

    test('he', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          he.decode(value);
        });
      }
    });

    return;
  }

  for (const value of valuesToDecode) {
    describe(value, () => {
      test('speedy-entities', () => {
        measure(() => {
          lib.decodeHTML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities.decodeHTML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'html5',
          scope: 'body',
        };

        measure(() => {
          htmlEntities.decode(value, options);
        });
      });

      test('he', () => {
        measure(() => {
          he.decode(value);
        });
      });
    });
  }
});

describe('decodeXML', () => {
  if (isAverageMeasure) {
    test('speedy-entities', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          lib.decodeXML(value);
        });
      }
    });

    test('entities', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          entities.decodeXML(value);
        });
      }
    });

    test('html-entities', () => {
      const options = {
        level: 'xml',
        strict: true,
      };

      for (const value of valuesToDecode) {
        measure(() => {
          htmlEntities.decode(value, options);
        });
      }
    });

    test('he', () => {
      for (const value of valuesToDecode) {
        measure(() => {
          he.decode(value);
        });
      }
    });

    return;
  }

  for (const value of valuesToDecode) {
    describe(value, () => {
      test('speedy-entities', () => {
        measure(() => {
          lib.decodeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities.decodeXML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          strict: true,
        };

        measure(() => {
          htmlEntities.decode(value, options);
        });
      });

      test('he', () => {
        measure(() => {
          he.decode(value);
        });
      });
    });
  }
});

describe('encodeXML', () => {
  if (isAverageMeasure) {
    test('speedy-entities', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          lib.encodeXML(value);
        });
      }
    });

    test('entities', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          entities.encodeXML(value);
        });
      }
    });

    test('html-entities', () => {
      const options = {
        level: 'xml',
        mode: 'nonAscii',
      };

      for (const value of valuesToEncode) {
        measure(() => {
          htmlEntities.encode(value, options);
        });
      }
    });

    test('he', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          he.encode(value);
        });
      }
    });

    return;
  }

  for (const value of valuesToEncode) {
    describe(value, () => {
      test('speedy-entities', () => {
        measure(() => {
          lib.encodeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities.encodeXML(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          mode: 'nonAscii',
        };

        measure(() => {
          htmlEntities.encode(value, options);
        });
      });

      test('he', () => {
        measure(() => {
          he.encode(value);
        });
      });
    });
  }
});

describe('escapeXML', () => {
  if (isAverageMeasure) {
    test('speedy-entities', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          lib.escapeXML(value);
        });
      }
    });

    test('entities', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          entities.escapeUTF8(value);
        });
      }
    });

    test('html-entities', () => {
      const options = {
        level: 'xml',
        mode: 'specialChars',
      };

      for (const value of valuesToEncode) {
        measure(() => {
          htmlEntities.encode(value, options);
        });
      }
    });

    test('he', () => {
      for (const value of valuesToEncode) {
        measure(() => {
          he.escape(value);
        });
      }
    });

    return;
  }

  for (const value of valuesToEncode) {
    describe(value, () => {
      test('speedy-entities', () => {
        measure(() => {
          lib.escapeXML(value);
        });
      });

      test('entities', () => {
        measure(() => {
          entities.escapeUTF8(value);
        });
      });

      test('html-entities', () => {
        const options = {
          level: 'xml',
          mode: 'specialChars',
        };

        measure(() => {
          htmlEntities.encode(value, options);
        });
      });

      test('he', () => {
        measure(() => {
          he.escape(value);
        });
      });
    });
  }
});
