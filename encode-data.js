const path = require('path');
const fs = require('fs');
const entities = require('./src/main/data/entities.json');
const legacyEntities = require('./src/main/data/legacy-entities.json');
const overrides = require('./src/main/data/overrides.json');

const genDir = path.join(__dirname, './src/main/gen');

fs.mkdirSync(genDir, {recursive: true});

const encodeValue = (str) => str.split('').reduce((code, char, i) => code + char.charCodeAt(0) * 0xffff ** i, 0).toString(36);

let entitiesSrc = '';

entitiesSrc += Object.entries(entities).reduce((src, [key, value]) => src + key + (key in legacyEntities ? ',' : ';') + encodeValue(value) + ' ', '');

entitiesSrc += Object.entries(legacyEntities).reduce((src, [key, value]) => key in entities ? src : src + key + ',' + encodeValue(value) + ' ', '');

fs.writeFileSync(path.join(genDir, 'entities.json'), JSON.stringify(entitiesSrc.trim()));


const overridesSrc = Object.entries(overrides).reduce((src, [key, value]) => src + key + ';' + encodeValue(value) + ' ', '');

fs.writeFileSync(path.join(genDir, 'overrides.json'), JSON.stringify(overridesSrc.trim()));
