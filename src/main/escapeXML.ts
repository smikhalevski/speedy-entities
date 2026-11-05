const escapedCharRegExp = /["&'<>]/g;

/**
 * Replaces `"&'<>` with XML entities and keeps other chars, so the output needs a Unicode encoding. Use
 * {@linkcode encodeXML} for ASCII output.
 */
export function escapeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  // A call that threw midway doesn't reset lastIndex, and the search would skip the start of the input
  escapedCharRegExp.lastIndex = 0;

  while (escapedCharRegExp.test(input)) {
    const lastIndex = escapedCharRegExp.lastIndex;
    const startIndex = lastIndex - 1;
    const charCode = input.charCodeAt(startIndex);

    let entity;

    if (charCode === /* " */ 34) {
      entity = '&quot;';
    } else if (charCode === /* & */ 38) {
      entity = '&amp;';
    } else if (charCode === /* ' */ 39) {
      entity = '&apos;';
    } else if (charCode === /* < */ 60) {
      entity = '&lt;';
    } else {
      entity = '&gt;';
    }

    if (textIndex !== startIndex) {
      output += input.slice(textIndex, startIndex);
    }
    output += entity;

    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
