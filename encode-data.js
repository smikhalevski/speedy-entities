const path = require('path');
const fs = require('fs');
const entities = require('./src/main/data/entities.json');
const legacyEntities = require('./src/main/data/legacy-entities.json');
const overrides = require('./src/main/data/overrides.json');

const genDir = path.join(__dirname, './src/main/gen');

fs.mkdirSync(genDir, {recursive: true});

const encodeValue = (str) => str.split('').reduce((code, char, i) => code + char.charCodeAt(0) * 0xffff ** i, 0).toString(36);

const stringifyEntries = (entries) => JSON.stringify(entries.map(([key, value]) => key + ' ' + encodeValue(value)).join(' '));

fs.writeFileSync(path.join(genDir, 'entities.json'), stringifyEntries(Object.entries(entities).filter(([key]) => !(key in legacyEntities))));

fs.writeFileSync(path.join(genDir, 'legacy-entities.json'), stringifyEntries(Object.entries(legacyEntities)));

fs.writeFileSync(path.join(genDir, 'overrides.json'), stringifyEntries(Object.entries(overrides)));
