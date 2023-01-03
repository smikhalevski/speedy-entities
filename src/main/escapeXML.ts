const re = /["&'<>]/g;

export function escapeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    const lastIndex = re.lastIndex;
    const startIndex = lastIndex - 1;
    const charCode = input.charCodeAt(startIndex);

    // prettier-ignore
    const entity = charCode === 34 ? '&quot;' : charCode === 38 ? '&amp;' : charCode === 39 ? '&apos;' : charCode === 60 ? '&lt;' : '&gt;';

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
