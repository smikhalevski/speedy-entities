import fs from 'fs';
import path from 'path';
import htmlEntities from './html-entities.json';
import xmlEntities from './xml-entities.json';
import { arrayTrieCreate, trieCreate, trieSet } from '@smikhalevski/trie';

const htmlEntitiesTrie = trieCreate<string>();

const xmlEntitiesTrie = trieCreate<string>();

for (const [reference, { characters }] of Object.entries(htmlEntities)) {
  trieSet(htmlEntitiesTrie, reference.slice(1), characters);
}

for (const [reference, characters] of Object.entries<any>(xmlEntities)) {
  trieSet(xmlEntitiesTrie, reference.slice(1), characters);
}

const htmlEntitiesArrayTrie = arrayTrieCreate(htmlEntitiesTrie);

const xmlEntitiesArrayTrie = arrayTrieCreate(xmlEntitiesTrie);

const dir = path.resolve(__dirname, '../main/gen');

fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(
  path.join(dir, 'html-entities.ts'),
  'export default ' + JSON.stringify(htmlEntitiesArrayTrie),
  'utf-8'
);

fs.writeFileSync(path.join(dir, 'xml-entities.ts'), 'export default ' + JSON.stringify(xmlEntitiesArrayTrie), 'utf-8');
