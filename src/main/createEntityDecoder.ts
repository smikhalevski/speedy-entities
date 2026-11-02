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
  entityTrie: ReturnType<typeof createEntityTrie>,
  options: Omit<EntityDecoderOptions, 'entities'>
): (input: string) => string {
  const {
    isNumericReferenceSemicolonRequired = false,
    areC1ControlsRemapped = true,
    isAttributeValue = false,
  } = options;

  const { edgeKeys, edgeNodes, nodeValues, slotMask, slotShift } = entityTrie;

  return input => {
    let output = '';

    let textIndex = 0;
    let charIndex = 0;

    const inputLength = input.length;

    while (charIndex < inputLength - 1) {
      let startIndex = input.indexOf('&', charIndex);

      if (startIndex === -1) {
        break;
      }

      charIndex = startIndex++;

      let value: string | undefined;
      let endIndex = startIndex;

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
              // Some C1 controls don't have a Windows-1252 counterpart and are preserved
              value = c1ControlMap.get(codePoint) ?? String.fromCharCode(codePoint);
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

          // Edge keys are exact only for ASCII chars
          if (charCode > 127) {
            break;
          }

          const edgeKey = (node << 7) | charCode;

          let slotIndex = Math.imul(edgeKey, GOLDEN_RATIO) >>> slotShift;

          while (edgeKeys[slotIndex] !== -1 && edgeKeys[slotIndex] !== edgeKey) {
            slotIndex = (slotIndex + 1) & slotMask;
          }

          if (edgeKeys[slotIndex] === -1) {
            // No entity name starts with chars read so far
            break;
          }

          node = edgeNodes[slotIndex];
          ++index;

          const nodeValue = nodeValues[node];

          if (nodeValue !== undefined) {
            value = nodeValue;
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

      // Concat decoded entity and preceding substring
      if (value !== undefined) {
        output += textIndex === charIndex ? value : input.slice(textIndex, charIndex) + value;
        textIndex = endIndex;
      }

      charIndex = endIndex;
    }
    return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
  };
}

// Standing on the shoulders of giants
// https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
const c1ControlMap = new Map([
  [128, '\u20AC'],
  [130, '\u201A'],
  [131, '\u0192'],
  [132, '\u201E'],
  [133, '\u2026'],
  [134, '\u2020'],
  [135, '\u2021'],
  [136, '\u02C6'],
  [137, '\u2030'],
  [138, '\u0160'],
  [139, '\u2039'],
  [140, '\u0152'],
  [142, '\u017D'],
  [145, '\u2018'],
  [146, '\u2019'],
  [147, '\u201C'],
  [148, '\u201D'],
  [149, '\u2022'],
  [150, '\u2013'],
  [151, '\u2014'],
  [152, '\u02DC'],
  [153, '\u2122'],
  [154, '\u0161'],
  [155, '\u203A'],
  [156, '\u0153'],
  [158, '\u017E'],
  [159, '\u0178'],
]);

/**
 * The maximum share of used slots in the edge table.
 */
const MAX_LOAD_FACTOR = 0.6;

/**
 * 2^32 divided by the golden ratio (1.6180339887…), rounded down. Multiplying an edge key by it and taking the high
 * bits of the product gives a slot index that depends on all bits of the key, so keys that differ only slightly, such
 * as adjacent char codes or adjacent nodes, land far apart. Of all multipliers, the golden ratio spreads such keys most
 * evenly, see Knuth, The Art of Computer Programming, Vol. 3, Section 6.4.
 *
 * The multiplier is odd, so distinct edge keys never produce the same product.
 */
const GOLDEN_RATIO = 0x9e3779b9;

/**
 * An optional ampersand, a name made of the ASCII chars that XML allows in names, and an optional semicolon.
 */
const entityReferenceRegExp = /^&?[a-zA-Z0-9.:_-]+;?$/;

/**
 * Builds a trie of entity names, where each name prefix is a node and node 0 is the root. The edge from a node to its
 * child is keyed by `(node << 7) | charCode`, char codes are ASCII, so they take the low 7 bits. Edges are stored in
 * a hash table with [linear probing](https://en.wikipedia.org/wiki/Linear_probing), where the first slot to probe is
 * picked by [Fibonacci hashing](https://en.wikipedia.org/wiki/Hash_function#Fibonacci_hashing) of the edge key.
 *
 * A lookup starts at the root and follows an edge for each char of the input. It stops when there's no edge for
 * the next char. The last visited node that has a value is the longest matching entity name.
 *
 * @see https://softwareengineering.stackexchange.com/questions/402542
 */
export function createEntityTrie(entities: Record<string, string>) {
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
 * the previous name, and the rest of its nodes are new. So nodes are added without looking up edges, and edges are
 * inserted into a hash table once its size is known.
 */
function buildEntityTrie(entities: Record<string, string>, entityReferences: string[]) {
  let charCount = 0;

  for (const entityReference of entityReferences) {
    charCount += entityReference.length;
  }

  // The key of the edge that leads to a node, each char adds at most one node
  const incomingEdgeKeys = new Int32Array(charCount + 1);

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

    for (; depth < nameLength; ++depth) {
      incomingEdgeKeys[nodeCount] = (pathNodes[depth] << 7) | name.charCodeAt(depth);
      pathNodes[depth + 1] = nodeCount++;
    }

    referenceNodes[referenceIndex] = pathNodes[nameLength];
    previousName = name;
  }

  const nodeValues = new Array<string | undefined>(nodeCount).fill(undefined);

  for (let referenceIndex = 0; referenceIndex < entityReferences.length; ++referenceIndex) {
    // "&lt;" and "lt;" have the same node, so the latter overwrites the former
    nodeValues[referenceNodes[referenceIndex]] = entities[entityReferences[referenceIndex]];
  }

  // Each node except the root has an incoming edge
  const edgeCount = nodeCount - 1;

  let tableSize = 16;

  while (tableSize * MAX_LOAD_FACTOR < edgeCount) {
    tableSize <<= 1;
  }

  const slotMask = tableSize - 1;
  const slotShift = Math.clz32(tableSize) + 1;

  // -1 marks an empty slot
  const edgeKeys = new Int32Array(tableSize).fill(-1);
  const edgeNodes = new Int32Array(tableSize);

  for (let node = 1; node < nodeCount; ++node) {
    const edgeKey = incomingEdgeKeys[node];

    let slotIndex = Math.imul(edgeKey, GOLDEN_RATIO) >>> slotShift;

    while (edgeKeys[slotIndex] !== -1) {
      slotIndex = (slotIndex + 1) & slotMask;
    }

    edgeKeys[slotIndex] = edgeKey;
    edgeNodes[slotIndex] = node;
  }

  return { edgeKeys, edgeNodes, nodeValues, slotMask, slotShift };
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
