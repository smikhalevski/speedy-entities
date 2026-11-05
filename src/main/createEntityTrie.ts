import type { DoubleArrayTrie } from './DoubleArrayTrie.ts';

declare const entityTrieBrand: unique symbol;

/**
 * A trie of entity names, see {@linkcode createEntityTrie}. Its contents are internal, so they can change in any
 * release.
 */
export interface EntityTrie {
  /**
   * Makes the type opaque, so only {@linkcode createEntityTrie} returns it.
   *
   * @internal
   */
  readonly [entityTrieBrand]: true;
}

/**
 * An optional "&", a name of ASCII letters, digits and "-.:_", and an optional ";".
 */
const entityReferenceRegExp = /^&?[a-zA-Z0-9.:_-]+;?$/;

/**
 * Builds a trie of entity names. Pass it to {@linkcode createEntityTrieDecoder} to create decoders that share it,
 * since building a trie takes time and memory.
 *
 * It's a [double-array trie](https://en.wikipedia.org/wiki/Trie#Implementation_strategies): finding the child of a
 * node takes two array reads and no hashing.
 *
 * @param entities Entity references mapped to their values, see {@linkcode EntityDecoderOptions.entities}.
 * @throws Error if an entity reference is invalid.
 */
export function createEntityTrie(entities: Record<string, string>): EntityTrie {
  const entityReferences = Object.keys(entities);

  // Entity tables are usually sorted, so references are sorted only if they aren't
  return (
    buildEntityTrie(entities, entityReferences) ??
    buildEntityTrie(entities, entityReferences.sort(compareEntityReferences))!
  );
}

/**
 * Builds a trie from references sorted by name, or returns `undefined` if they aren't sorted.
 *
 * In sorted order, the nodes that a name shares with earlier names are those of its common prefix with the previous
 * name. So nodes are numbered in preorder without lookups, and the first child of a node is the next node. Nodes are
 * placed in the same order, so a parent is placed before its children.
 */
function buildEntityTrie(entities: Record<string, string>, entityReferences: string[]): DoubleArrayTrie | undefined {
  let charCount = 0;

  for (const entityReference of entityReferences) {
    charCount += entityReference.length;
  }

  // Each char adds at most one node
  const maxNodeCount = charCount + 1;

  const nodeChars = new Uint8Array(maxNodeCount);

  // Bit 0 is set if an entity name ends at the node, bit 1 is set if the node has children
  const nodeFlags = new Uint8Array(maxNodeCount);

  // The next child of the same parent, or 0 for the last child
  const nextSiblings = new Int32Array(maxNodeCount);

  // The index in values of the value of the entity name that ends at the node
  const valueIndexes = new Int32Array(maxNodeCount);

  const values: string[] = [];

  // The nodes of the previous name prefixes, indexed by prefix length
  const pathNodes = [0];

  let nodeCount = 1;
  let previousName = '';

  for (let referenceIndex = 0; referenceIndex < entityReferences.length; ++referenceIndex) {
    const entityReference = entityReferences[referenceIndex];

    if (!entityReferenceRegExp.test(entityReference)) {
      throw new Error('Invalid entity reference: ' + JSON.stringify(entityReference));
    }

    const name = getEntityName(entityReference);
    const nameLength = name.length;
    const previousNameLength = previousName.length;

    // The length of the prefix shared with the previous name
    let depth = 0;

    while (
      depth < nameLength &&
      depth < previousNameLength &&
      name.charCodeAt(depth) === previousName.charCodeAt(depth)
    ) {
      ++depth;
    }

    if (
      depth < previousNameLength &&
      (depth === nameLength || name.charCodeAt(depth) < previousName.charCodeAt(depth))
    ) {
      // The name goes before the previous name
      return;
    }

    if (depth < nameLength && depth < previousNameLength) {
      // The previous name went through another child of the node at this depth
      nextSiblings[pathNodes[depth + 1]] = nodeCount;
    }

    for (; depth < nameLength; ++depth) {
      nodeFlags[pathNodes[depth]] |= 2;
      nodeChars[nodeCount] = name.charCodeAt(depth);
      pathNodes[depth + 1] = nodeCount++;
    }

    const node = pathNodes[nameLength];

    if ((nodeFlags[node] & 1) === 0) {
      nodeFlags[node] |= 1;
      valueIndexes[node] = values.length;
    }

    // "&lt;" and "lt;" have the same node, so the latter overwrites the former
    values[valueIndexes[node]] = entities[entityReference];
    previousName = name;
  }

  // Grows if nodes don't pack tightly
  let size = nodeCount + 512;
  let nodeBases = new Int32Array(size);
  let nodeChecks = new Int32Array(size).fill(-1);

  // The double-array index of each node
  const nodeIndexes = new Int32Array(nodeCount);

  // Indexes below 128 stay unused, so a base is never negative and base + charCode is in bounds for any ASCII char
  let firstUnusedIndex = 128;

  // The largest index placed by a node with several children, other children are placed before firstUnusedIndex
  let maxIndex = 128;

  // The index where the search for a base of a node with several children starts, see below
  let searchStartIndex = 128;

  for (let node = 0; node < nodeCount; ++node) {
    if ((nodeFlags[node] & 2) === 0) {
      continue;
    }

    const nodeIndex = nodeIndexes[node];
    const firstChild = node + 1;
    const hasSiblings = nextSiblings[firstChild] !== 0;

    // Children are sorted by char, so the first child lands on the first unused index, or on searchStartIndex if a node
    // with several children can't be placed before it
    const startBase =
      (hasSiblings && searchStartIndex > firstUnusedIndex ? searchStartIndex : firstUnusedIndex) -
      nodeChars[firstChild];

    let base = startBase;

    // Find a base that puts all children on unused indexes
    while (true) {
      if (base + 128 > size) {
        size <<= 1;
        nodeBases = growInt32Array(nodeBases, size, 0);
        nodeChecks = growInt32Array(nodeChecks, size, -1);
      }
      if (!hasSiblings) {
        break;
      }

      let isUnused = true;

      for (let child = firstChild; child !== 0; child = nextSiblings[child]) {
        if (nodeChecks[base + nodeChars[child]] !== -1) {
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
      searchStartIndex = base + nodeChars[firstChild];
    }

    nodeBases[nodeIndex] = base;

    if (!hasSiblings) {
      // Most nodes have a single child
      nodeChecks[firstUnusedIndex] = (nodeIndex << 1) | (nodeFlags[firstChild] & 1);
      nodeIndexes[firstChild] = firstUnusedIndex;
    } else {
      for (let child = firstChild; child !== 0; child = nextSiblings[child]) {
        const childIndex = base + nodeChars[child];

        nodeChecks[childIndex] = (nodeIndex << 1) | (nodeFlags[child] & 1);
        nodeIndexes[child] = childIndex;

        if (childIndex > maxIndex) {
          maxIndex = childIndex;
        }
      }
    }

    while (firstUnusedIndex < size && nodeChecks[firstUnusedIndex] !== -1) {
      ++firstUnusedIndex;
    }
  }

  if (maxIndex < firstUnusedIndex) {
    maxIndex = firstUnusedIndex;
  }

  // Keep base + charCode in bounds for any ASCII char
  const finalSize = maxIndex + 128;

  // 2-byte indexes take half the memory and are enough for most tables
  const nodeValueIndexes = values.length <= 0x10000 ? new Uint16Array(finalSize) : new Int32Array(finalSize);

  for (let node = 1; node < nodeCount; ++node) {
    if ((nodeFlags[node] & 1) === 1) {
      nodeValueIndexes[nodeIndexes[node]] = valueIndexes[node];
    }
  }

  return {
    nodeBases: nodeBases.slice(0, finalSize),
    nodeChecks: nodeChecks.slice(0, finalSize),
    nodeValueIndexes,
    values,
  } as DoubleArrayTrie;
}

function growInt32Array(array: Int32Array, size: number, fillValue: number): Int32Array<ArrayBuffer> {
  const grownArray = new Int32Array(size).fill(fillValue, array.length);

  grownArray.set(array);

  return grownArray;
}

// Sort is stable, so "&lt;" and "lt;" keep their order
function compareEntityReferences(a: string, b: string): number {
  const aName = getEntityName(a);
  const bName = getEntityName(b);

  return aName < bName ? -1 : aName > bName ? 1 : 0;
}

function getEntityName(entityReference: string): string {
  // Skip the leading ampersand
  return entityReference.charCodeAt(0) === /* & */ 38 ? entityReference.slice(1) : entityReference;
}
