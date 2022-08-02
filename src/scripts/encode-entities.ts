import fs from 'fs';
import path from 'path';
import htmlEntities from './entities.json';
import { trieCreate, trieSet } from '@smikhalevski/trie';
import { encodeTrie } from './encodeTrie';

const trie = trieCreate<number[]>();

for (const [reference, { codepoints }] of Object.entries(htmlEntities)) {
  trieSet(trie, reference.slice(0), codepoints);
}

const arr: number[] = [];

encodeTrie(trie, 0, arr);

const data = arr.map(v => v.toString(36)).join(' ');

fs.writeFileSync(path.resolve(__dirname, '../main/html-entities.json'), JSON.stringify(data), 'utf-8');
