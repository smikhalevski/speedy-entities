const re = /["&'<>]/g;

export function escapeXml(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    const lastIndex = re.lastIndex;
    const startIndex = lastIndex - 1;
    const c = input.charCodeAt(startIndex);
    const entity = c === 34 ? '&quot;' : c === 38 ? '&amp;' : c === 39 ? '&apos;' : c === 60 ? '&lt;' : '&gt;';

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
