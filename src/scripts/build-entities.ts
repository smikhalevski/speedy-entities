import * as fs from 'node:fs';
import * as path from 'node:path';
import htmlEntities from './html-entities.json' with { type: 'json' };
import xmlEntities from './xml-entities.json' with { type: 'json' };

const OUT_DIR = path.join(import.meta.dirname, '../main/gen');

fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, 'html-entities.ts'), buildModule(htmlEntities));
fs.writeFileSync(path.join(OUT_DIR, 'xml-entities.ts'), buildModule(xmlEntities));

function buildModule(entities: Record<string, string>): string {
  let str = '';

  for (const [key, value] of Object.entries(entities)) {
    str += (str === '' ? '0x' : ',0x') + getHashCode(key.substring(1)).toString(16) + ',' + JSON.stringify(value);
  }

  return 'export default [' + str + '];';
}

function getHashCode(str: string): number {
  let hashCode = 0;

  for (let i = 0; i < str.length; ++i) {
    hashCode = (hashCode << 5) - hashCode + str.charCodeAt(i);
  }

  return hashCode >>> 0;
}
