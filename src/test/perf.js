const {decodeXML, decodeHTML} = require('entities');
const {decodeXml, decodeHtml} = require('../../lib/index-cjs');
const readline = require('readline');
const bench = require('nodemark');
const chalk = require('chalk');

function test(label, cb, timeout) {
  global.gc();
  process.stdout.write(label);
  readline.cursorTo(process.stdout, 0, null);
  const result = bench(cb, null, timeout);
  console.log(label + result);
}

const samples = [
  '&#X61;&#x62;&#x63;', // terminated hex
  '&#X61&#x62&#x63', // unterminated hex
  '&#97;&#98;&#99;', // terminated decimal
  '&#97&#98&#99', // unterminated decimal
  '&amp;&lt;&gt;', // terminated XML/legacy
  '&amp&lt&gt', // unterminated XML/legacy
  '&NotNestedGreaterGreater;&PrecedesSlantEqual;', // terminated non-legacy HTML
  '&NotNestedGreaterGreater&PrecedesSlantEqual', // unterminated non-legacy HTML
];

console.log(chalk.bold.inverse(' XML benchmark '));

samples.map((sample) => {
  console.log('\n"' + chalk.bold(sample) + '"');
  test('  decodeXml           ', () => decodeXml(sample), 3000);
  test('  entities.decodeXML  ', () => decodeXML(sample), 3000);
});

console.log('\n\n' + chalk.bold.inverse(' HTML benchmark '));

samples.map((sample) => {
  console.log('\n"' + chalk.bold(sample) + '"');
  test('  decodeHtml           ', () => decodeHtml(sample), 3000);
  test('  entities.decodeHTML  ', () => decodeHTML(sample), 3000);
});
