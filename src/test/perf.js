const {decodeXML, decodeHTML} = require('entities');
const {decodeXml, decodeHtml} = require('../../lib/index-cjs');
const readline = require('readline');
const bench = require('nodemark');
const chalk = require('chalk');

function test(label, cb, timeout) {
  // global.gc();
  process.stdout.write(label);
  readline.cursorTo(process.stdout, 0, null);
  const result = bench(cb, null, timeout);
  console.log(label + result);
}

const xmlTerminatedKnownNamedEntities = '&amp;&lt;&gt;';
const xmlTerminatedUnknownNamedEntities = '&NotNestedGreaterGreater;';

const unterminatedKnownNamedEntities = '&amp&lt&gt';
const mixedHtmlEntities = '&amp&NotNestedGreaterGreater;&gt';

console.log(chalk.bold('XML benchmark'));

console.log('\nTerminated known named entities');
test('  decodeXml          ', () => decodeXml(xmlTerminatedKnownNamedEntities), 3000);
test('  entities.decodeXML ', () => decodeXML(xmlTerminatedKnownNamedEntities), 3000);

console.log('\nTerminated unknown named entities');
test('  decodeXml          ', () => decodeXml(xmlTerminatedUnknownNamedEntities), 3000);
test('  entities.decodeXML ', () => decodeXML(xmlTerminatedUnknownNamedEntities), 3000);

console.log('\nUnterminated known named entities');
test('  decodeXml          ', () => decodeXml(unterminatedKnownNamedEntities), 3000);
test('  entities.decodeXML ', () => decodeXML(unterminatedKnownNamedEntities), 3000);


console.log(chalk.bold('\n\nHTML benchmark'));

console.log('\nTerminated known named entities');
test('  decodeHtml         ', () => decodeHtml(xmlTerminatedKnownNamedEntities), 3000);
test('  entities.decodeHTML', () => decodeHTML(xmlTerminatedKnownNamedEntities), 3000);

console.log('\nUnterminated known named entities');
test('  decodeHtml         ', () => decodeHtml(unterminatedKnownNamedEntities), 3000);
test('  entities.decodeHTML', () => decodeHTML(unterminatedKnownNamedEntities), 3000);

console.log('\nMixed terminated and unterminated known entities');
test('  decodeHtml          ', () => decodeHtml(mixedHtmlEntities), 3000);
test('  entities.decodeHTML ', () => decodeHTML(mixedHtmlEntities), 3000);
