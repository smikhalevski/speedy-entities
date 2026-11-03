const encodedCharRegExp = /["&'<>\u0080-\uFFFF]/g;

/**
 * 1 for ASCII chars that are encoded.
 */
const encodedAsciiFlags = new Uint8Array(128);

for (const char of '"&\'<>') {
  encodedAsciiFlags[char.charCodeAt(0)] = 1;
}

/**
 * Numeric character references for U+0080 to U+07FF, the letters of Latin, Greek, Cyrillic, Hebrew and Arabic, among
 * others. Text in these scripts reuses a few dozen of them, so they are formatted in advance.
 */
const numericReferences: string[] = [];

for (let codePoint = 0x80; codePoint < 0x800; ++codePoint) {
  numericReferences.push('&#x' + codePoint.toString(16) + ';');
}

const hexDigitCharCodes = Uint8Array.from('0123456789abcdef', char => char.charCodeAt(0));

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

// The code point must be at least 0x80
function getNumericReference(codePoint: number): string {
  return codePoint < 0x800 ? numericReferences[codePoint - 0x80] : formatNumericReference(codePoint);
}

/**
 * Returns "&#x", the hex digits of the code point without leading zeros, and ";". Building the string from char codes
 * in one call is about twice as fast as toString(16) and concatenation. The code point must be at least 0x100.
 */
function formatNumericReference(codePoint: number): string {
  if (codePoint < 0x1000) {
    return String.fromCharCode(
      /* & */ 38,
      /* # */ 35,
      /* x */ 120,
      getHexDigitCharCode(codePoint, 8),
      getHexDigitCharCode(codePoint, 4),
      getHexDigitCharCode(codePoint, 0),
      /* ; */ 59
    );
  }

  if (codePoint < 0x10000) {
    return String.fromCharCode(
      /* & */ 38,
      /* # */ 35,
      /* x */ 120,
      getHexDigitCharCode(codePoint, 12),
      getHexDigitCharCode(codePoint, 8),
      getHexDigitCharCode(codePoint, 4),
      getHexDigitCharCode(codePoint, 0),
      /* ; */ 59
    );
  }

  if (codePoint < 0x100000) {
    return String.fromCharCode(
      /* & */ 38,
      /* # */ 35,
      /* x */ 120,
      getHexDigitCharCode(codePoint, 16),
      getHexDigitCharCode(codePoint, 12),
      getHexDigitCharCode(codePoint, 8),
      getHexDigitCharCode(codePoint, 4),
      getHexDigitCharCode(codePoint, 0),
      /* ; */ 59
    );
  }

  return String.fromCharCode(
    /* & */ 38,
    /* # */ 35,
    /* x */ 120,
    getHexDigitCharCode(codePoint, 20),
    getHexDigitCharCode(codePoint, 16),
    getHexDigitCharCode(codePoint, 12),
    getHexDigitCharCode(codePoint, 8),
    getHexDigitCharCode(codePoint, 4),
    getHexDigitCharCode(codePoint, 0),
    /* ; */ 59
  );
}

// The char code of the hex digit at the given bit offset
function getHexDigitCharCode(codePoint: number, offset: number): number {
  return hexDigitCharCodes[(codePoint >> offset) & 15];
}
