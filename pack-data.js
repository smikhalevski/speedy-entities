const path = require('path');
const fs = require('fs');
const htmlEntities = require('./src/main/data/html-entities.json');
const legacyHtmlEntities = require('./src/main/data/legacy-html-entities.json');

const genDir = path.join(__dirname, './src/main/gen');

const htmlEntityEntities = Object.entries(htmlEntities).filter(([key]) => !legacyHtmlEntities[key]);

fs.mkdirSync(genDir, { recursive: true });

fs.writeFileSync(path.join(genDir, 'html-entities.json'), packEntries(htmlEntityEntities));

fs.writeFileSync(path.join(genDir, 'legacy-html-entities.json'), packEntries(Object.entries(legacyHtmlEntities)));

function packEntries(entries) {
  return JSON.stringify(
    entries
      .map(([key, value]) => {
        const raw = value.length === 1 ? value.charCodeAt(0) : value.charCodeAt(0) * 0xffff + value.charCodeAt(1);
        return key + ' ' + raw.toString(36);
      })
      .join(' ')
  );
}
