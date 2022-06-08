const path = require('path');
const fs = require('fs');
const xmlEntities = require('./src/main/data/xml-entities.json');
const htmlEntities = require('./src/main/data/html-entities.json');
const legacyHtmlEntities = require('./src/main/data/legacy-html-entities.json');
const overrides = require('./src/main/data/overrides.json');

const genDir = path.join(__dirname, './src/main/gen');

fs.mkdirSync(genDir, {recursive: true});

fs.writeFileSync(path.join(genDir, 'xml-entities.json'), packEntries(Object.entries(xmlEntities)));

fs.writeFileSync(path.join(genDir, 'html-entities.json'), packEntries(Object.entries(htmlEntities).filter(([key]) => !(key in legacyHtmlEntities))));

fs.writeFileSync(path.join(genDir, 'legacy-html-entities.json'), packEntries(Object.entries(legacyHtmlEntities)));

fs.writeFileSync(path.join(genDir, 'overrides.json'), packEntries(Object.entries(overrides)));

function packEntries(entries) {
  return JSON.stringify(entries.map(([key, value]) => key + ' ' + (value.length === 1 ? value.charCodeAt(0) : value.charCodeAt(0) * 0xffff + value.charCodeAt(1)).toString(36)).join(' '));
}
