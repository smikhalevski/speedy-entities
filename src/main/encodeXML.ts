const encodedCharRegExp = /["&'<>\u0080-\uFFFF]/g;

/**
 * 1 for ASCII chars that are encoded.
 */
const encodedAsciiFlags = new Uint8Array(128);

for (const char of '"&\'<>') {
  encodedAsciiFlags[char.charCodeAt(0)] = 1;
}

/**
 * Recently formatted numeric character references, indexed by the low 10 bits of their code point. Text usually reuses
 * a small set of chars, so most references are taken from here instead of being formatted again.
 */
const cachedCodePoints = new Int32Array(1024).fill(-1);
const cachedReferences = new Array<string>(1024).fill('');

/**
 * Same as {@linkcode escapeXML}, but also encodes non-ASCII characters as numeric character references, so the output
 * is ASCII-only and safe for any document encoding.
 */
export function encodeXML(input: string): string {
  const inputLength = input.length;

  let output = '';
  let textIndex = 0;
  let index = 0;

  while (index < inputLength) {
    const charCode = input.charCodeAt(index);

    if (!isEncodedCharCode(charCode)) {
      // Encoded chars are often close to each other, so a short run of plain chars is read inline
      const scanEndIndex = Math.min(index + 24, inputLength);

      do {
        ++index;
      } while (index < scanEndIndex && !isEncodedCharCode(input.charCodeAt(index)));

      if (index < scanEndIndex) {
        continue;
      }
      if (index === inputLength) {
        break;
      }

      // In a longer run, the regexp finds the next encoded char faster than reading chars one by one
      encodedCharRegExp.lastIndex = index;

      if (!encodedCharRegExp.test(input)) {
        break;
      }

      index = encodedCharRegExp.lastIndex - 1;
      continue;
    }

    let entity;
    let nextIndex = index + 1;

    if (charCode >= 0xd800 && charCode <= 0xdfff) {
      const codePoint = input.codePointAt(index)!;

      if (codePoint > 0xffff) {
        entity = getNumericReference(codePoint);
        nextIndex = index + 2;
      } else {
        // A lone surrogate isn't an XML char, so XML parsers reject a document that references it
        entity = '&#xfffd;';
      }
    } else if (charCode >= 0x80) {
      entity = getNumericReference(charCode);
    } else if (charCode === 34) {
      entity = '&quot;';
    } else if (charCode === 38) {
      entity = '&amp;';
    } else if (charCode === 39) {
      entity = '&apos;';
    } else if (charCode === 60) {
      entity = '&lt;';
    } else {
      entity = '&gt;';
    }

    if (textIndex !== index) {
      output += input.slice(textIndex, index);
    }
    output += entity;

    textIndex = nextIndex;
    index = nextIndex;
  }

  return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
}

function isEncodedCharCode(charCode: number): boolean {
  return charCode >= 0x80 || encodedAsciiFlags[charCode] === 1;
}

function getNumericReference(codePoint: number): string {
  const slot = codePoint & 1023;

  if (cachedCodePoints[slot] !== codePoint) {
    cachedCodePoints[slot] = codePoint;
    cachedReferences[slot] = '&#x' + codePoint.toString(16) + ';';
  }
  return cachedReferences[slot];
}
