import fs from 'fs';
import path from 'path';
import htmlEntities from './html-entities.json';
import xmlEntities from './xml-entities.json';
import { ArrayTrie, arrayTrieEncode, trieCreate, trieSet } from '@smikhalevski/trie';

const htmlEntitiesTrie = trieCreate<string>();

const xmlEntitiesTrie = trieCreate<string>();

for (const [entity, value] of Object.entries(htmlEntities)) {
  trieSet(htmlEntitiesTrie, entity.slice(1), value);
}

for (const [entity, value] of Object.entries(xmlEntities)) {
  trieSet(xmlEntitiesTrie, entity.slice(1), value);
}

const dir = path.resolve(__dirname, '../main/gen');

fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'html-data.ts'), compileDataModule(arrayTrieEncode(htmlEntitiesTrie)));

fs.writeFileSync(path.join(dir, 'xml-data.ts'), compileDataModule(arrayTrieEncode(xmlEntitiesTrie)));

function compileDataModule(arrayTrie: ArrayTrie<string>): string {
  const data = Array.from(arrayTrie.values);
  data.unshift(String.fromCharCode(...Array.from(arrayTrie.nodes)));
  return 'export default ' + JSON.stringify(data).replace(/\\u00([0-9a-f]{2})/gi, '\\x$1');
}
