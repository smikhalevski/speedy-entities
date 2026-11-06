import type { createEntityTrie } from './createEntityTrie.ts';

declare const OPAQUE_BRAND: unique symbol;

/**
 * A trie of entity names, see {@linkcode createEntityTrie}. Its contents are internal, so they can change in any
 * release.
 */
export interface EntityTrie {
  /**
   * Marks objects that {@linkcode createEntityTrie} returns. {@linkcode createEntityTrieDecoder} checks it at runtime,
   * so it doesn't read a trie of an unknown layout.
   *
   * @internal
   */
  readonly [OPAQUE_BRAND]: never;
}

/**
 * The contents of an {@linkcode EntityTrie}, see {@linkcode createEntityTrie}. The package doesn't export this module,
 * so the layout can change in any release.
 */
export interface DoubleArrayEntityTrie extends EntityTrie {
  /**
   * The child of a node for a char is at `nodeBaseOffsets[nodeIndex] + charCode`.
   */
  nodeBaseOffsets: Int32Array;

  /**
   * `nodeChecks[nodeIndex] >> 1` is the index of the parent node, and the low bit is set if an entity name ends at the
   * node. -1 marks an unused index.
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
 * Builds a trie from entity names and their values in turn, like `['amp', '&', 'amp;', '&']`. Names must be sorted,
 * valid, and have no leading "&", see {@linkcode createEntityTrie}. If a name is listed several times, its last value
 * is used.
 *
 * Nodes are visited depth first, and the children of a node are placed when it's visited. In sorted order, the names
 * that go through a child of a node are next to each other, so they are found without lookups. The rest of a name that
 * no other name goes through is a chain of children without siblings, which is placed in one go.
 */
export function createDoubleArrayEntityTrie(entities: readonly string[]): DoubleArrayEntityTrie {
  let charCount = 0;

  for (let index = 0; index < entities.length; index += 2) {
    charCount += entities[index].length;
  }

  // Each char adds at most one node, and arrays grow if nodes don't pack tightly
  let size = charCount + 512;
  let nodeBaseOffsets = new Int32Array(size);
  let nodeChecks = new Int32Array(size).fill(-1);

  // The index in values of the value of the entity name that ends at a node
  let valueIndexes = new Int32Array(size);

  const values: string[] = [];

  // Indexes below 128 stay unused, so a base offset is never negative and baseOffset + charCode is in bounds for any
  // ASCII char
  let firstUnusedIndex = 128;

  // The largest index of a child that has siblings, children without siblings are placed before firstUnusedIndex
  let maxIndex = 128;

  // The index where the search for a base offset of children that have siblings starts, see below
  let searchStartIndex = 128;

  // The char codes of the children of a node, and the start and end indexes of the names that go through each of them
  const childCharCodes = new Int32Array(128);
  const childNameStartIndexes = new Int32Array(128);
  const childNameEndIndexes = new Int32Array(128);

  // Nodes to visit, four numbers each: the index of a node, the start and end indexes of the names in entities that go
  // through it, and its depth
  const stack = [0, 0, entities.length, 0];

  let stackLength = stack.length;

  while (stackLength !== 0) {
    stackLength -= 4;

    const nodeIndex = stack[stackLength];
    const nameEndIndex = stack[stackLength + 2];
    const depth = stack[stackLength + 3];

    let nameStartIndex = stack[stackLength + 1];

    if (nameStartIndex !== nameEndIndex && entities[nameStartIndex].length === depth) {
      // A name ends at the node, it sorts before longer names, and copies of it follow it
      do {
        nameStartIndex += 2;
      } while (nameStartIndex !== nameEndIndex && entities[nameStartIndex].length === depth);

      valueIndexes[nodeIndex] = values.length;
      values.push(entities[nameStartIndex - 1]);
    }

    if (nameStartIndex === nameEndIndex) {
      continue;
    }

    if (nameStartIndex + 2 === nameEndIndex) {
      // No other name goes through the rest of this name, so each of its chars is a child without siblings
      const name = entities[nameStartIndex];

      let parentNodeIndex = nodeIndex;

      for (let charIndex = depth; charIndex < name.length; ++charIndex) {
        if (firstUnusedIndex + 128 > size) {
          size <<= 1;
          nodeBaseOffsets = growInt32Array(nodeBaseOffsets, size, 0);
          nodeChecks = growInt32Array(nodeChecks, size, -1);
          valueIndexes = growInt32Array(valueIndexes, size, 0);
        }

        nodeBaseOffsets[parentNodeIndex] = firstUnusedIndex - name.charCodeAt(charIndex);
        nodeChecks[firstUnusedIndex] = (parentNodeIndex << 1) | (charIndex === name.length - 1 ? 1 : 0);
        parentNodeIndex = firstUnusedIndex;

        while (firstUnusedIndex < size && nodeChecks[firstUnusedIndex] !== -1) {
          ++firstUnusedIndex;
        }
      }

      valueIndexes[parentNodeIndex] = values.length;
      values.push(entities[nameStartIndex + 1]);
      continue;
    }

    // The names that go through a child have the same char at this depth
    let childCount = 0;

    for (let index = nameStartIndex; index !== nameEndIndex; ++childCount) {
      const charCode = entities[index].charCodeAt(depth);

      childCharCodes[childCount] = charCode;
      childNameStartIndexes[childCount] = index;

      do {
        index += 2;
      } while (index !== nameEndIndex && entities[index].charCodeAt(depth) === charCode);

      childNameEndIndexes[childCount] = index;
    }

    const hasSiblings = childCount !== 1;

    // Children are sorted by char, so the first child lands on the first unused index, or on searchStartIndex if it has
    // siblings that can't be placed before it
    const startBaseOffset =
      (hasSiblings && searchStartIndex > firstUnusedIndex ? searchStartIndex : firstUnusedIndex) - childCharCodes[0];

    let baseOffset = startBaseOffset;

    // Find a base offset that puts all children on unused indexes
    while (true) {
      if (baseOffset + 128 > size) {
        size <<= 1;
        nodeBaseOffsets = growInt32Array(nodeBaseOffsets, size, 0);
        nodeChecks = growInt32Array(nodeChecks, size, -1);
        valueIndexes = growInt32Array(valueIndexes, size, 0);
      }
      if (!hasSiblings) {
        break;
      }

      let isUnused = true;

      for (let childIndex = 0; childIndex < childCount; ++childIndex) {
        if (nodeChecks[baseOffset + childCharCodes[childIndex]] !== -1) {
          isUnused = false;
          break;
        }
      }
      if (isUnused) {
        break;
      }
      ++baseOffset;
    }

    if (baseOffset - startBaseOffset > 256) {
      // The holes that a long search passed rarely fit a child and its siblings. Later searches skip them, since
      // passing the same holes for each node would make building a table with many such nodes take quadratic time.
      searchStartIndex = baseOffset + childCharCodes[0];
    }

    nodeBaseOffsets[nodeIndex] = baseOffset;

    for (let childIndex = 0; childIndex < childCount; ++childIndex) {
      const childNodeIndex = baseOffset + childCharCodes[childIndex];

      // An entity name ends at a child if the first name that goes through it ends there
      nodeChecks[childNodeIndex] =
        (nodeIndex << 1) | (entities[childNameStartIndexes[childIndex]].length === depth + 1 ? 1 : 0);

      if (hasSiblings && childNodeIndex > maxIndex) {
        maxIndex = childNodeIndex;
      }
    }

    while (firstUnusedIndex < size && nodeChecks[firstUnusedIndex] !== -1) {
      ++firstUnusedIndex;
    }

    // Pushed in reverse, so children are visited in char order, and nodes are placed in preorder
    for (let childIndex = childCount - 1; childIndex >= 0; --childIndex) {
      stack[stackLength] = baseOffset + childCharCodes[childIndex];
      stack[stackLength + 1] = childNameStartIndexes[childIndex];
      stack[stackLength + 2] = childNameEndIndexes[childIndex];
      stack[stackLength + 3] = depth + 1;
      stackLength += 4;
    }
  }

  if (maxIndex < firstUnusedIndex) {
    maxIndex = firstUnusedIndex;
  }

  // Keep baseOffset + charCode in bounds for any ASCII char
  const finalSize = maxIndex + 128;

  // 2-byte indexes take half the memory and are enough for most tables
  const nodeValueIndexes = values.length <= 0x10000 ? new Uint16Array(finalSize) : new Int32Array(finalSize);

  nodeValueIndexes.set(valueIndexes.subarray(0, finalSize));

  return {
    nodeBaseOffsets: nodeBaseOffsets.slice(0, finalSize),
    nodeChecks: nodeChecks.slice(0, finalSize),
    nodeValueIndexes,
    values,
  } as DoubleArrayEntityTrie;
}

function growInt32Array(array: Int32Array, size: number, fillValue: number) {
  const grownArray = new Int32Array(size).fill(fillValue, array.length);

  grownArray.set(array);

  return grownArray;
}
