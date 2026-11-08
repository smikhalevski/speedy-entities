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
   * Two numbers for each node, next to each other, so a lookup reads one array:
   *
   * - `nodes[nodeIndex * 2]` is the base offset: the child of a node for a char is at `baseOffset + charCode`. The base
   *   offset of the root is 0, so its child for a char is at the char code.
   * - `nodes[nodeIndex * 2 + 1]` is the check: `check >> 1` is the index of the parent node, and the low bit is set if
   *   an entity name ends at the node. -1 marks an unused index.
   */
  nodes: Int32Array;

  /**
   * The index in `values` of the value of the longest entity name that ends at a node or at one of its ancestors, or 0
   * if there's no such name. A walk that stops at any node finds the longest match with one lookup, instead of
   * tracking the nodes where names end. Most nodes have no value of their own, so values aren't stored per node.
   */
  nodeValueIndexes: Uint16Array | Int32Array;

  /**
   * The values of entity names, see `nodeValueIndexes`. The value at index 0 is unused.
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

  // Unused nodes are -1, and a node gets base offset 0 when it's placed, see DoubleArrayEntityTrie.nodes
  let nodes = new Int32Array(size * 2).fill(-1);

  // The root has no children until they are placed. Its check stays -1: the children of the root are at their char
  // codes, so a NUL char after "&" lands on the root, and the check tells the decoder that it's not a child.
  nodes[0] = 0;

  // The index in values of the value of the longest entity name that ends at a node or at one of its ancestors
  let valueIndexes = new Int32Array(size);

  // Index 0 means that no name ends at a node or at its ancestors
  const values = [''];

  // Indexes below 128 are used only by the children of the root, which has base offset 0. The base offset of any other
  // node is never negative, and baseOffset + charCode is in bounds for any ASCII char.
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

    // Parents are visited before their children, so a node gets the value of its parent if no name ends at it
    let valueIndex = nodeIndex === 0 ? 0 : valueIndexes[nodes[(nodeIndex << 1) | 1] >> 1];

    if (nameStartIndex !== nameEndIndex && entities[nameStartIndex].length === depth) {
      // A name ends at the node, it sorts before longer names, and copies of it follow it
      do {
        nameStartIndex += 2;
      } while (nameStartIndex !== nameEndIndex && entities[nameStartIndex].length === depth);

      valueIndex = values.length;
      values.push(entities[nameStartIndex - 1]);
    }

    valueIndexes[nodeIndex] = valueIndex;

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
          nodes = growInt32Array(nodes, size * 2, -1);
          valueIndexes = growInt32Array(valueIndexes, size, 0);
        }

        // The child of the root is at the char code, see DoubleArrayEntityTrie.nodes
        const childNodeIndex = parentNodeIndex === 0 ? name.charCodeAt(charIndex) : firstUnusedIndex;

        nodes[parentNodeIndex << 1] = childNodeIndex - name.charCodeAt(charIndex);
        nodes[childNodeIndex << 1] = 0;
        nodes[(childNodeIndex << 1) | 1] = (parentNodeIndex << 1) | (charIndex === name.length - 1 ? 1 : 0);
        valueIndexes[childNodeIndex] = valueIndex;
        parentNodeIndex = childNodeIndex;

        while (firstUnusedIndex < size && nodes[(firstUnusedIndex << 1) | 1] !== -1) {
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
    // siblings that can't be placed before it. Children of the root are at their char codes, which are unused.
    const startBaseOffset =
      nodeIndex === 0
        ? 0
        : (hasSiblings && searchStartIndex > firstUnusedIndex ? searchStartIndex : firstUnusedIndex) -
          childCharCodes[0];

    let baseOffset = startBaseOffset;

    // Find a base offset that puts all children on unused indexes
    while (true) {
      if (baseOffset + 128 > size) {
        size <<= 1;
        nodes = growInt32Array(nodes, size * 2, -1);
        valueIndexes = growInt32Array(valueIndexes, size, 0);
      }
      if (!hasSiblings || nodeIndex === 0) {
        break;
      }

      let isUnused = true;

      for (let childIndex = 0; childIndex < childCount; ++childIndex) {
        if (nodes[((baseOffset + childCharCodes[childIndex]) << 1) | 1] !== -1) {
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

    nodes[nodeIndex << 1] = baseOffset;

    for (let childIndex = 0; childIndex < childCount; ++childIndex) {
      const childNodeIndex = baseOffset + childCharCodes[childIndex];

      // An entity name ends at a child if the first name that goes through it ends there
      nodes[childNodeIndex << 1] = 0;
      nodes[(childNodeIndex << 1) | 1] =
        (nodeIndex << 1) | (entities[childNameStartIndexes[childIndex]].length === depth + 1 ? 1 : 0);

      if (hasSiblings && childNodeIndex > maxIndex) {
        maxIndex = childNodeIndex;
      }
    }

    while (firstUnusedIndex < size && nodes[(firstUnusedIndex << 1) | 1] !== -1) {
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
    nodes: nodes.slice(0, finalSize * 2),
    nodeValueIndexes,
    values,
  } as DoubleArrayEntityTrie;
}

/**
 * Returns the value of an entity name, like "amp;", or `undefined` if the trie doesn't have the name. Names must be
 * ASCII, see {@linkcode DoubleArrayEntityTrie.nodes}.
 */
export function getEntityValue(entityTrie: EntityTrie, name: string): string | undefined {
  const { nodes, nodeValueIndexes, values } = entityTrie as DoubleArrayEntityTrie;

  let nodeIndex = 0;

  for (let index = 0; index < name.length; ++index) {
    const childNodeIndex = nodes[nodeIndex << 1] + name.charCodeAt(index);

    if (nodes[(childNodeIndex << 1) | 1] >> 1 !== nodeIndex) {
      return undefined;
    }
    nodeIndex = childNodeIndex;
  }

  return nodeIndex !== 0 && (nodes[(nodeIndex << 1) | 1] & 1) === 1 ? values[nodeValueIndexes[nodeIndex]] : undefined;
}

function growInt32Array(array: Int32Array, size: number, fillValue: number) {
  const grownArray = new Int32Array(size).fill(fillValue, array.length);

  grownArray.set(array);

  return grownArray;
}
