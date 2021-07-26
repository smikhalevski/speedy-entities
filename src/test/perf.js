const {test} = require('@smikhalevski/perf-test');
const {decodeXML, decodeHTML} = require('entities');
const {decodeXml, decodeHtml} = require('../../lib/full-cjs');
const chalk = require('chalk');

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

console.log(chalk.bold.inverse(' XML benchmark '));

values.map((value) => {
  console.log('\n"' + chalk.bold(value) + '"');
  test('  speedy-entities  ', () => decodeXml(value));
  test('  fb55/entities    ', () => decodeXML(value));
});

console.log('\n\n' + chalk.bold.inverse(' HTML benchmark '));

values.map((value) => {
  console.log('\n"' + chalk.bold(value) + '"');
  test('  speedy-entities  ', () => decodeHtml(value));
  test('  fb55/entities    ', () => decodeHTML(value));
});
