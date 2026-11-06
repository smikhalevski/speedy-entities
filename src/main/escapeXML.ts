const escapedCharRegExp = /["&'<>]/g;

/**
 * Replaces `"&'<>` with entity references and keeps other chars, so the output needs a Unicode encoding. Use
 * {@linkcode encodeXML} for ASCII output.
 */
export function escapeXML(input: string): string {
  let output = '';
  let textStartIndex = 0;

  // A call that threw midway doesn't reset lastIndex, and the search would skip the start of the input
  escapedCharRegExp.lastIndex = 0;

  while (escapedCharRegExp.test(input)) {
    const nextIndex = escapedCharRegExp.lastIndex;
    const charIndex = nextIndex - 1;
    const charCode = input.charCodeAt(charIndex);

    let reference;

    if (charCode === /* " */ 34) {
      reference = '&quot;';
    } else if (charCode === /* & */ 38) {
      reference = '&amp;';
    } else if (charCode === /* ' */ 39) {
      reference = '&apos;';
    } else if (charCode === /* < */ 60) {
      reference = '&lt;';
    } else {
      reference = '&gt;';
    }

    if (textStartIndex !== charIndex) {
      output += input.slice(textStartIndex, charIndex);
    }
    output += reference;

    textStartIndex = nextIndex;
  }

  if (textStartIndex === 0) {
    return input;
  }
  if (textStartIndex === input.length) {
    return output;
  }
  return output + input.slice(textStartIndex);
}
