/**
 * The options recognized by {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions {
  /**
   * Mapping from an [character entity reference](https://www.w3.org/TR/html4/charset.html#h-5.3.2) to its decoded value.
   * Entity references may contain the ASCII chars that XML allows in names: letters, digits, "-", ".", ":" and "_".
   * They may optionally start with an ampersand "&" and end with a semicolon ";". An error is thrown if an entity
   * reference is invalid.
   *
   * ```json
   * {
   *   "&Delta;": "\u0394",
   *   "LongRightArrow;": "\u27F6"
   * }
   * ```
   */
  entities?: Record<string, string>;

  /**
   * If `true` then [numeric character references](https://www.w3.org/TR/html4/charset.html#h-5.3.1) must be terminated
   * with a semicolon to be decoded. Otherwise, numeric character references are recognized even if they aren't
   * terminated with a semicolon.
   *
   * @default false
   */
  isNumericReferenceSemicolonRequired?: boolean;

  /**
   * If `true` then numeric character references to C1 control characters (U+0080 to U+009F) are decoded as
   * Windows-1252 characters, [as HTML does](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state).
   * For example, "&#128;" is decoded as "\u20AC" instead of "\u0080". XML doesn't do this.
   *
   * @default true
   */
  areC1ControlsRemapped?: boolean;

  /**
   * If `true` then a named character reference that isn't terminated with a semicolon isn't decoded if it's followed
   * by "=" or an ASCII alphanumeric char, [as HTML does in attribute values](https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state).
   * This keeps URL query parameters intact, for example "?a=1&copy=2" isn't decoded as "?a=1\u00A9=2".
   *
   * @default false
   */
  isAttributeValue?: boolean;
}

/**
 * A trie of entity names, see {@linkcode createEntityTrie}.
 */
export interface EntityTrie {
  /**
   * The offset of the children of a node: the child for a char is at `nodeBases[node] + charCode`.
   */
  nodeBases: Int32Array;

  /**
   * The parent of a node shifted left by one bit, with the low bit set if an entity name ends at the node. -1 marks
   * an unused node.
   */
  nodeChecks: Int32Array;

  /**
   * The decoded value of a node, or `undefined` if no entity name ends at the node.
   */
  nodeValues: Array<string | undefined>;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities = {} } = options;

  return createEntityTrieDecoder(createEntityTrie(entities), options);
}

/**
 * Same as {@linkcode createEntityDecoder}, but uses a prebuilt trie, so decoders that differ only in options can share
 * a trie instead of building their own.
 */
export function createEntityTrieDecoder(
  entityTrie: EntityTrie,
  options: Omit<EntityDecoderOptions, 'entities'>
): (input: string) => string {
  const {
    isNumericReferenceSemicolonRequired = false,
    areC1ControlsRemapped = true,
    isAttributeValue = false,
  } = options;

  const { nodeBases, nodeChecks, nodeValues } = entityTrie;

  return input => {
    let output = '';

    let textIndex = 0;

    const inputLength = input.length;

    // A reference is "&" followed by at least one char, so it can't start at the last char
    let charIndex = inputLength > 1 ? input.indexOf('&') : -1;

    while (charIndex !== -1 && charIndex < inputLength - 1) {
      let startIndex = charIndex + 1;

      let value: string | undefined;
      let endIndex = startIndex;

      // Both reads below must stay in bounds: reading past the end of the input makes V8 deoptimize this function,
      // and it stays about twice as slow on short inputs afterwards
      if (startIndex < inputLength - 1 && input.charCodeAt(startIndex) === /* # */ 35) {
        // Numeric character reference

        // All digits are consumed, out-of-range code points (Infinity included) are replaced with U+FFFD below
        let codePoint = 0;

        if ((input.charCodeAt(++startIndex) | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex < inputLength) {
            const charCode = input.charCodeAt(endIndex);

            // Convert alpha to lower case
            const lowerCharCode = charCode | 32;

            if (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) {
              codePoint = codePoint * 16 + charCode - 48;
            } else if (lowerCharCode >= /* a */ 97 && lowerCharCode <= /* f */ 102) {
              codePoint = codePoint * 16 + lowerCharCode - 87;
            } else {
              break;
            }
            ++endIndex;
          }
        } else {
          endIndex = startIndex;

          // parseInt of a decimal number
          while (endIndex < inputLength) {
            const charCode = input.charCodeAt(endIndex);

            if (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57) {
              codePoint = codePoint * 10 + charCode - 48;
            } else {
              break;
            }
            ++endIndex;
          }
        }

        if (endIndex !== startIndex) {
          // At least one digit must present

          const isTerminated = endIndex < inputLength && input.charCodeAt(endIndex) === /* ; */ 59;

          if (isTerminated || !isNumericReferenceSemicolonRequired) {
            // Convert a code point to a string

            if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
              // Null char code, or character reference is outside the permissible Unicode range
              value = '\uFFFD';
            } else if (areC1ControlsRemapped && codePoint >= 0x80 && codePoint <= 0x9f) {
              value = c1ControlValues[codePoint - 0x80];
            } else {
              value = String.fromCodePoint(codePoint);
            }
          }

          if (isTerminated) {
            ++endIndex;
          }
        }
      } else {
        // Character entity reference

        let index = startIndex;
        let node = 0;

        while (index < inputLength) {
          const charCode = input.charCodeAt(index);

          // Only ASCII chars have nodes, and bases keep base + charCode in bounds for them
          if (charCode > 127) {
            break;
          }

          const childNode = nodeBases[node] + charCode;
          const childCheck = nodeChecks[childNode];

          if (childCheck >> 1 !== node) {
            // No entity name starts with chars read so far
            break;
          }

          node = childNode;
          ++index;

          if ((childCheck & 1) === 1) {
            // An entity name ends at the node
            value = nodeValues[node];
            endIndex = index;
          }
        }

        if (
          isAttributeValue &&
          value !== undefined &&
          endIndex < inputLength &&
          input.charCodeAt(endIndex - 1) !== /* ; */ 59
        ) {
          const charCode = input.charCodeAt(endIndex);

          // An unterminated reference followed by "=" or an alphanumeric char is likely a URL query parameter
          if (charCode === /* = */ 61 || isAlphanumericCharCode(charCode)) {
            value = undefined;
          }
        }
      }

      if (value !== undefined) {
        // Appending the preceding text and the value separately avoids joining them into a new string first. Once
        // the output is long enough to be a rope, each append only adds a node, even if the encodings differ.
        if (textIndex !== charIndex) {
          output += input.slice(textIndex, charIndex);
        }
        output += value;
        textIndex = endIndex;
      }

      if (endIndex >= inputLength - 1) {
        break;
      }

      // Entities often follow each other, and checking the next char is cheaper than calling indexOf
      if (value === undefined || input.charCodeAt(endIndex) !== /* & */ 38) {
        charIndex = input.indexOf('&', endIndex);
      } else {
        charIndex = endIndex;
      }
    }
    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
  };
}

/**
 * Windows-1252 chars for the C1 control code points U+0080 to U+009F. Code points that have no Windows-1252
 * counterpart are preserved.
 *
 * Standing on the shoulders of giants
 * https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
 */
// prettier-ignore
const c1ControlValues = [
  '\u20AC', '\u0081', '\u201A', '\u0192', '\u201E', '\u2026', '\u2020', '\u2021',
  '\u02C6', '\u2030', '\u0160', '\u2039', '\u0152', '\u008D', '\u017D', '\u008F',
  '\u0090', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022', '\u2013', '\u2014',
  '\u02DC', '\u2122', '\u0161', '\u203A', '\u0153', '\u009D', '\u017E', '\u0178',
];

/**
 * An optional ampersand, a name made of the ASCII chars that XML allows in names, and an optional semicolon.
 */
const entityReferenceRegExp = /^&?[a-zA-Z0-9.:_-]+;?$/;

/**
 * Builds a [double-array trie](https://en.wikipedia.org/wiki/Trie#Implementation_strategies) of entity names, where
 * each name prefix is a node and node 0 is the root. The child of a node for a char is at
 * `nodeBases[node] + charCode`, and it belongs to the node if `nodeChecks[child] >> 1` is the node. So a lookup step
 * is two array reads, with no hashing or probing.
 *
 * A lookup starts at the root and follows a child for each char of the input. It stops when there's no child for
 * the next char. The last visited node where an entity name ends is the longest matching entity name.
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
 * Builds a trie from entity references sorted by name, or returns `undefined` if they aren't sorted.
 *
 * In sorted order, the only nodes that a name shares with preceding names are the nodes of the prefix it shares with
 * the previous name, and the rest of its nodes are new. So nodes are numbered in preorder without looking anything
 * up, and the first child of a node is the next node. Then nodes are placed in the double array in the same order,
 * so a node is placed after its parent.
 */
function buildEntityTrie(entities: Record<string, string>, entityReferences: string[]): EntityTrie | undefined {
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

  // The node of each entity reference
  const referenceNodes = new Int32Array(entityReferences.length);

  // The nodes of the previous name prefixes, indexed by prefix length
  const pathNodes = [0];

  let nodeCount = 1;
  let previousName = '';

  for (let referenceIndex = 0; referenceIndex < entityReferences.length; ++referenceIndex) {
    const entityReference = entityReferences[referenceIndex];

    if (!entityReferenceRegExp.test(entityReference)) {
      throw new Error('Invalid entity reference: ' + entityReference);
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
      return undefined;
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

    nodeFlags[pathNodes[nameLength]] |= 1;
    referenceNodes[referenceIndex] = pathNodes[nameLength];
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

  for (let node = 0; node < nodeCount; ++node) {
    if ((nodeFlags[node] & 2) === 0) {
      continue;
    }

    const nodeIndex = nodeIndexes[node];
    const firstChild = node + 1;
    const hasSiblings = nextSiblings[firstChild] !== 0;

    // Children are sorted by char, so the first child lands on the first unused index
    let base = firstUnusedIndex - nodeChars[firstChild];

    // Find a base that puts all children on unused indexes
    for (;;) {
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
  const nodeValues = new Array<string | undefined>(finalSize).fill(undefined);

  for (let referenceIndex = 0; referenceIndex < entityReferences.length; ++referenceIndex) {
    // "&lt;" and "lt;" have the same node, so the latter overwrites the former
    nodeValues[nodeIndexes[referenceNodes[referenceIndex]]] = entities[entityReferences[referenceIndex]];
  }

  return { nodeBases: nodeBases.slice(0, finalSize), nodeChecks: nodeChecks.slice(0, finalSize), nodeValues };
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

function isAlphanumericCharCode(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57)
  );
}
