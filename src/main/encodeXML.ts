const encodedCharRegExp = /["&'<>\u0080-\uFFFF]/g;

/**
 * Same as {@linkcode escapeXML}, but also encodes non-ASCII characters as numeric character references, so the output
 * is ASCII-only and safe for any document encoding.
 */
export function encodeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  while (encodedCharRegExp.test(input)) {
    let lastIndex = encodedCharRegExp.lastIndex;

    const startIndex = lastIndex - 1;

    // Lone surrogates are encoded as is
    const codePoint = input.codePointAt(startIndex)!;

    let entity;

    if (codePoint >= 0x80) {
      if (codePoint > 0xffff) {
        // Skip the low surrogate
        encodedCharRegExp.lastIndex = ++lastIndex;
      }
      entity = '&#x' + codePoint.toString(16) + ';';
    } else if (codePoint === 34) {
      entity = '&quot;';
    } else if (codePoint === 38) {
      entity = '&amp;';
    } else if (codePoint === 39) {
      entity = '&apos;';
    } else if (codePoint === 60) {
      entity = '&lt;';
    } else {
      entity = '&gt;';
    }

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
