/**
 * The options recognized by {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions {
  /**
   * Mapping from an [character entity reference](https://www.w3.org/TR/html4/charset.html#h-5.3.2) to its decoded value.
   * Entity references should contain only [a-zA-Z0-9] and may optionally start with an ampersand "&" and end with
   * a semicolon ";". An error is thrown if an entity reference is invalid.
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
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities = {}, isNumericReferenceSemicolonRequired = false, areC1ControlsRemapped = true } = options;

  const { edgeKeys, edgeNodes, nodeValues, slotMask, slotShift } = createEntityTrie(entities);

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

          const edgeKey = getEdgeKey(node, charCode);

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

// Char codes are ASCII, so they take the low 7 bits
function getEdgeKey(node: number, charCode: number): number {
  return (node << 7) | charCode;
}

/**
 * Builds a trie of entity names, where each name prefix is a node and node 0 is the root. The edge from a node to its
 * child is keyed by `(node << 7) | charCode`. Edges are stored in a hash table with
 * [linear probing](https://en.wikipedia.org/wiki/Linear_probing), where the first slot to probe is picked by
 * [Fibonacci hashing](https://en.wikipedia.org/wiki/Hash_function#Fibonacci_hashing) of the edge key.
 *
 * A lookup starts at the root and follows an edge for each char of the input. It stops when there's no edge for
 * the next char. The last visited node that has a value is the longest matching entity name.
 *
 * @see https://softwareengineering.stackexchange.com/questions/402542
 */
function createEntityTrie(entities: Record<string, string>) {
  const edgeMap = new Map<number, number>();
  const nodeValues: Array<string | undefined> = [undefined];

  for (const entity of Object.keys(entities)) {
    // Skip the leading ampersand
    const startIndex = entity.charCodeAt(0) === /* & */ 38 ? 1 : 0;

    // Semicolon is optional, but if present must be the last char
    const endIndex = entity.charCodeAt(entity.length - 1) === /* ; */ 59 ? entity.length - 1 : entity.length;

    if (startIndex >= endIndex) {
      throw new Error('Invalid entity reference: ' + entity);
    }

    let node = 0;

    for (let index = startIndex; index < entity.length; ++index) {
      const charCode = entity.charCodeAt(index);

      if (index < endIndex && !isEntityNameCharCode(charCode)) {
        throw new Error('Invalid entity reference: ' + entity);
      }

      const edgeKey = getEdgeKey(node, charCode);

      let childNode = edgeMap.get(edgeKey);

      if (childNode === undefined) {
        childNode = nodeValues.push(undefined) - 1;
        edgeMap.set(edgeKey, childNode);
      }

      node = childNode;
    }

    // "&lt;" and "lt;" have the same node, so the latter overwrites the former
    nodeValues[node] = entities[entity];
  }

  let tableSize = 16;

  while (tableSize * MAX_LOAD_FACTOR < edgeMap.size) {
    tableSize <<= 1;
  }

  const slotMask = tableSize - 1;
  const slotShift = Math.clz32(tableSize) + 1;

  // -1 marks an empty slot
  const edgeKeys = new Int32Array(tableSize).fill(-1);
  const edgeNodes = new Int32Array(tableSize);

  for (const [edgeKey, node] of edgeMap) {
    let slotIndex = Math.imul(edgeKey, GOLDEN_RATIO) >>> slotShift;

    while (edgeKeys[slotIndex] !== -1) {
      slotIndex = (slotIndex + 1) & slotMask;
    }

    edgeKeys[slotIndex] = edgeKey;
    edgeNodes[slotIndex] = node;
  }

  return { edgeKeys, edgeNodes, nodeValues, slotMask, slotShift };
}

function isEntityNameCharCode(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    (charCode >= /* 0 */ 48 && charCode <= /* 9 */ 57)
  );
}
