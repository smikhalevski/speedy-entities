import type { createEntityTrie, EntityTrie } from './createEntityTrie.ts';

/**
 * The key of the brand of an {@linkcode EntityTrie}. The package doesn't export it, so an object has the brand only if
 * this copy of the package built it. Tries built by another copy don't have it either, since their layout can differ.
 */
export const entityTrieBrand = Symbol('EntityTrie');

/**
 * The contents of an {@linkcode EntityTrie}, see {@linkcode createEntityTrie}. The package doesn't export this module,
 * so the layout can change in any release.
 */
export interface DoubleArrayTrie extends EntityTrie {
  /**
   * The child of a node for a char is at `nodeBases[node] + charCode`.
   */
  nodeBases: Int32Array;

  /**
   * `nodeChecks[node] >> 1` is the parent of a node, and the low bit is set if an entity name ends at the node. -1
   * marks an unused index.
   */
  nodeChecks: Int32Array;

  /**
   * The index in `values` of the value of the entity name that ends at a node. Most nodes have no value, so values
   * aren't stored per node.
   */
  nodeValueIndexes: Uint16Array | Int32Array;

  /**
   * The values of entity names, see `nodeValueIndexes`.
   */
  values: string[];
}

/**
 * Returns `true` if the value is a trie built by this copy of the package.
 */
export function isDoubleArrayTrie(value: unknown): value is DoubleArrayTrie {
  return typeof value === 'object' && value !== null && entityTrieBrand in value;
}

/**
 * Builds a trie from entity names and their values in turn, like `['amp', '&', 'amp;', '&']`. Names must be sorted,
 * valid, and have no leading "&", see {@linkcode createEntityTrie}. If a name is listed several times, its last value
 * is used.
 *
 * Nodes are visited depth first, and the children of a node are placed when it's visited. In sorted order, the names
 * that go through a child of a node are next to each other, so they are found without lookups. The rest of a name that
 * no other name goes through is a chain of single children, which is placed in one go.
 */
export function buildDoubleArrayTrie(entityList: readonly string[]): DoubleArrayTrie {
  let charCount = 0;

  for (let index = 0; index < entityList.length; index += 2) {
    charCount += entityList[index].length;
  }

  // Each char adds at most one node, and arrays grow if nodes don't pack tightly
  let size = charCount + 512;
  let nodeBases = new Int32Array(size);
  let nodeChecks = new Int32Array(size).fill(-1);

  // The index in values of the value of the entity name that ends at a node
  let valueIndexes = new Int32Array(size);

  const values: string[] = [];

  // Indexes below 128 stay unused, so a base is never negative and base + charCode is in bounds for any ASCII char
  let firstUnusedIndex = 128;

  // The largest index placed by a node with several children, other children are placed before firstUnusedIndex
  let maxIndex = 128;

  // The index where the search for a base of a node with several children starts, see below
  let searchStartIndex = 128;

  // The chars of the children of a node, and the names that go through each of them
  const childChars = new Int32Array(128);
  const childNameStarts = new Int32Array(128);
  const childNameEnds = new Int32Array(128);

  // Nodes to visit, four numbers each: the index of a node, the start and the end of the names in entityList that go
  // through it, and its depth
  const stack = [0, 0, entityList.length, 0];

  let stackLength = stack.length;

  while (stackLength !== 0) {
    stackLength -= 4;

    const nodeIndex = stack[stackLength];
    const nameEnd = stack[stackLength + 2];
    const depth = stack[stackLength + 3];

    let nameStart = stack[stackLength + 1];

    if (nameStart !== nameEnd && entityList[nameStart].length === depth) {
      // A name ends at the node, it sorts before longer names, and copies of it follow it
      do {
        nameStart += 2;
      } while (nameStart !== nameEnd && entityList[nameStart].length === depth);

      valueIndexes[nodeIndex] = values.length;
      values.push(entityList[nameStart - 1]);
    }

    if (nameStart === nameEnd) {
      continue;
    }

    if (nameStart + 2 === nameEnd) {
      // No other name goes through the rest of this name, so each of its chars is a single child
      const name = entityList[nameStart];

      let parentIndex = nodeIndex;

      for (let charIndex = depth; charIndex < name.length; ++charIndex) {
        if (firstUnusedIndex + 128 > size) {
          size <<= 1;
          nodeBases = growInt32Array(nodeBases, size, 0);
          nodeChecks = growInt32Array(nodeChecks, size, -1);
          valueIndexes = growInt32Array(valueIndexes, size, 0);
        }

        nodeBases[parentIndex] = firstUnusedIndex - name.charCodeAt(charIndex);
        nodeChecks[firstUnusedIndex] = (parentIndex << 1) | (charIndex === name.length - 1 ? 1 : 0);
        parentIndex = firstUnusedIndex;

        while (firstUnusedIndex < size && nodeChecks[firstUnusedIndex] !== -1) {
          ++firstUnusedIndex;
        }
      }

      valueIndexes[parentIndex] = values.length;
      values.push(entityList[nameStart + 1]);
      continue;
    }

    // The names that go through a child have the same char at this depth
    let childCount = 0;

    for (let index = nameStart; index !== nameEnd; ++childCount) {
      const charCode = entityList[index].charCodeAt(depth);

      childChars[childCount] = charCode;
      childNameStarts[childCount] = index;

      do {
        index += 2;
      } while (index !== nameEnd && entityList[index].charCodeAt(depth) === charCode);

      childNameEnds[childCount] = index;
    }

    const isOnlyChild = childCount === 1;

    // Children are sorted by char, so the first child lands on the first unused index, or on searchStartIndex if
    // several children can't be placed before it
    const startBase =
      (!isOnlyChild && searchStartIndex > firstUnusedIndex ? searchStartIndex : firstUnusedIndex) - childChars[0];

    let base = startBase;

    // Find a base that puts all children on unused indexes
    while (true) {
      if (base + 128 > size) {
        size <<= 1;
        nodeBases = growInt32Array(nodeBases, size, 0);
        nodeChecks = growInt32Array(nodeChecks, size, -1);
        valueIndexes = growInt32Array(valueIndexes, size, 0);
      }
      if (isOnlyChild) {
        break;
      }

      let isUnused = true;

      for (let childIndex = 0; childIndex < childCount; ++childIndex) {
        if (nodeChecks[base + childChars[childIndex]] !== -1) {
          isUnused = false;
          break;
        }
      }
      if (isUnused) {
        break;
      }
      ++base;
    }

    if (base - startBase > 256) {
      // The holes that a long search passed rarely fit several children. Later searches skip them, since passing the
      // same holes for each node would make building a table with many such nodes take quadratic time.
      searchStartIndex = base + childChars[0];
    }

    nodeBases[nodeIndex] = base;

    for (let childIndex = 0; childIndex < childCount; ++childIndex) {
      const index = base + childChars[childIndex];

      // An entity name ends at a child if the first name that goes through it ends there
      nodeChecks[index] = (nodeIndex << 1) | (entityList[childNameStarts[childIndex]].length === depth + 1 ? 1 : 0);

      if (!isOnlyChild && index > maxIndex) {
        maxIndex = index;
      }
    }

    while (firstUnusedIndex < size && nodeChecks[firstUnusedIndex] !== -1) {
      ++firstUnusedIndex;
    }

    // Pushed in reverse, so children are visited in char order, and nodes are placed in preorder
    for (let childIndex = childCount - 1; childIndex >= 0; --childIndex) {
      stack[stackLength] = base + childChars[childIndex];
      stack[stackLength + 1] = childNameStarts[childIndex];
      stack[stackLength + 2] = childNameEnds[childIndex];
      stack[stackLength + 3] = depth + 1;
      stackLength += 4;
    }
  }

  if (maxIndex < firstUnusedIndex) {
    maxIndex = firstUnusedIndex;
  }

  // Keep base + charCode in bounds for any ASCII char
  const finalSize = maxIndex + 128;

  // 2-byte indexes take half the memory and are enough for most tables
  const nodeValueIndexes = values.length <= 0x10000 ? new Uint16Array(finalSize) : new Int32Array(finalSize);

  nodeValueIndexes.set(valueIndexes.subarray(0, finalSize));

  return {
    [entityTrieBrand]: true,
    nodeBases: nodeBases.slice(0, finalSize),
    nodeChecks: nodeChecks.slice(0, finalSize),
    nodeValueIndexes,
    values,
  };
}

function growInt32Array(array: Int32Array, size: number, fillValue: number) {
  const grownArray = new Int32Array(size).fill(fillValue, array.length);

  grownArray.set(array);

  return grownArray;
}
