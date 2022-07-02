const re = /["&'<>]/g;

export function escapeXml(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let charRef;

    const lastIndex = re.lastIndex;
    const startIndex = lastIndex - 1;

    switch (input.charCodeAt(startIndex)) {
      case 34: // "
        charRef = '&quot;';
        break;
      case 38: // &
        charRef = '&amp;';
        break;
      case 39: // '
        charRef = '&apos;';
        break;
      case 60: // <
        charRef = '&lt;';
        break;
      case 62: // >
        charRef = '&gt;';
        break;
    }

    output += textIndex === startIndex ? charRef : input.substring(textIndex, startIndex) + charRef;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.substring(textIndex);
}
