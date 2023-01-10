import fs from 'fs';
import path from 'path';
import htmlEntities from './html-entities.json';
import xmlEntities from './xml-entities.json';
import { arrayTrieEncode, trieCreate, trieSet } from '@smikhalevski/trie';

const htmlEntitiesTrie = trieCreate<string>();

const xmlEntitiesTrie = trieCreate<string>();

for (const [entity, value] of Object.entries(htmlEntities)) {
  trieSet(htmlEntitiesTrie, entity.slice(1), value);
}

for (const [entity, value] of Object.entries(xmlEntities)) {
  trieSet(xmlEntitiesTrie, entity.slice(1), value);
}

const htmlEntitiesArrayTrie = arrayTrieEncode(htmlEntitiesTrie);

const xmlEntitiesArrayTrie = arrayTrieEncode(xmlEntitiesTrie);

const dir = path.resolve(__dirname, '../main/gen');

fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'html-entities-trie.ts'), 'export default ' + JSON.stringify(htmlEntitiesArrayTrie));

fs.writeFileSync(path.join(dir, 'xml-entities-trie.ts'), 'export default ' + JSON.stringify(xmlEntitiesArrayTrie));
