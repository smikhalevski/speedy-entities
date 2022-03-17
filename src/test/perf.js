const {decodeXML, decodeHTML} = require('entities');
const {decodeXml, decodeHtml} = require('../../lib/full-cjs');

const values = [
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#X61&#x62&#x63', // unterminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&#97&#98&#99', // unterminated decimal
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&NotNestedGreaterGreater;', // terminated non-legacy HTML
  '&NotNestedGreaterGreater', // unterminated non-legacy HTML
];

describe('XML benchmark', () => {
  values.forEach((value) => {
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
});

describe('HTML benchmark', () => {
  values.forEach((value) => {
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
});
