const {decodeXML, decodeHTML} = require('entities');
const {decodeXml, decodeHtml} = require('../../lib/index-cjs');

const numericCharacterReferencesTestData = [
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#X61&#x62&#x63', // unterminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&#97&#98&#99', // unterminated decimal
];

const namedCharacterReferencesTestData = [
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&NotNestedGreaterGreater;', // terminated non-legacy HTML
  '&NotNestedGreaterGreater', // unterminated non-legacy HTML
];

// describe('Average across ' + values.length + ' samples', () => {
//
//   test('speedy-entities', (measure) => {
//     values.forEach((value) => {
//       measure(() => {
//         decodeXml(value);
//       });
//     });
//   });
//
//   test('fb55/entities', (measure) => {
//     values.forEach((value) => {
//       measure(() => {
//         decodeXML(value);
//       });
//     });
//   });
//
// }, {warmupIterationCount: 1_000, targetRme: 0});

describe('orig test', () => {
  const textToDecode = `This is a simple text &uuml;ber &#x3f; something.`;

  test('speedy-entities', (measure) => {
    measure(() => {
      decodeHtml(textToDecode);
    });
  });

  test('fb55/entities', (measure) => {
    measure(() => {
      decodeHTML(textToDecode);
    });
  });
}, {warmupIterationCount: 100, targetRme: 0.002});

describe('Numeric character references', () => {
  numericCharacterReferencesTestData.forEach((value) => {
    describe(value, () => {

      test('speedy-entities', (measure) => {
        measure(() => {
          decodeXml(value);
        });
      });

      test('fb55/entities', (measure) => {
        measure(() => {
          decodeXML(value);
        });
      });
    });
  });
}, {warmupIterationCount: 100, targetRme: 0.002});

describe('XML named character references', () => {
  namedCharacterReferencesTestData.forEach((value) => {
    describe(value, () => {

      test('speedy-entities', (measure) => {
        measure(() => {
          decodeXml(value);
        });
      });

      test('fb55/entities', (measure) => {
        measure(() => {
          decodeXML(value);
        });
      });
    });
  });
}, {warmupIterationCount: 100, targetRme: 0.002});

describe('HTML named character references', () => {
  namedCharacterReferencesTestData.forEach((value) => {
    describe(value, () => {

      test('speedy-entities', (measure) => {
        measure(() => {
          decodeHtml(value);
        });
      });

      test('fb55/entities', (measure) => {
        measure(() => {
          decodeHTML(value);
        });
      });
    });
  });
}, {warmupIterationCount: 100, targetRme: 0.002});
