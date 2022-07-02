const re = /["&\u00A0]/g;

export function escapeAttribute(input: string): string {
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
      case 160:
        charRef = '&nbsp;';
        break;
    }

    output += textIndex === startIndex ? charRef : input.slice(textIndex, startIndex) + charRef;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
