import type { createEntityTrie, EntityTrie } from './createEntityTrie.ts';

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
   * The value of the entity name that ends at a node.
   */
  nodeValues: Array<string | undefined>;
}
