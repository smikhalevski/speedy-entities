const re = /["&'<>]/g;

export function escapeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    const lastIndex = re.lastIndex;
    const startIndex = lastIndex - 1;
    const charCode = input.charCodeAt(startIndex);

    let entity;

    if (charCode === 34) {
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

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
