import { ArrayTrie } from '@smikhalevski/trie';

export function unpackData(data: string[]): ArrayTrie<string> {
  const nodes = [];

  for (let i = 0, [nodesData] = data; i < nodesData.length; ++i) {
    nodes.push(nodesData.charCodeAt(i));
  }
  return { nodes, values: data.slice(1) };
}
