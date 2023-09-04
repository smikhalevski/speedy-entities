const fs = require('fs');
const path = require('path');
const entities = require('./html-entities.json');
const { createTrie, setValue } = require('@smikhalevski/trie');

const trie = createTrie();

for (const [entity, value] of Object.entries(entities)) {
  setValue(trie, entity.substring(1), value);
}

function convertTrie(node) {
  let obj = null;

  const { value } = node;

  for (let charCode in node) {
    if ((charCode = +charCode) === charCode) {
      (obj ||= {})[charCode] = convertTrie(node[charCode]);
    }
  }
  if (!node.isLeaf) {
    return obj || {};
  }
  if (obj !== null) {
    return [value, obj];
  }
  if (node.leafCharCodes !== null) {
    return [value, String.fromCharCode(...node.leafCharCodes)];
  }
  if (value !== null && typeof value === 'object') {
    return [value];
  }
  return value;
}

const dir = path.resolve(__dirname, '../main/gen');

fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'entities-trie.ts'), 'export default' + JSON.stringify(convertTrie(trie)));
