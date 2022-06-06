const path = require('path');
const fs = require('fs');
const entities = require('./src/main/data/entities.json');
const legacyEntities = require('./src/main/data/legacy-entities.json');
const overrides = require('./src/main/data/overrides.json');

const genDir = path.join(__dirname, './src/main/gen');

fs.mkdirSync(genDir, {recursive: true});

fs.writeFileSync(path.join(genDir, 'entities.json'), packEntries(Object.entries(entities).filter(([key]) => !(key in legacyEntities))));

fs.writeFileSync(path.join(genDir, 'legacy-entities.json'), packEntries(Object.entries(legacyEntities)));

fs.writeFileSync(path.join(genDir, 'overrides.json'), packEntries(Object.entries(overrides)));

function packEntries(entries) {
  return JSON.stringify(entries.map(([key, value]) => key + ' ' + (value.length === 1 ? value.charCodeAt(0) : value.charCodeAt(0) * 0xffff + value.charCodeAt(1)).toString(36)).join(' '));
}
