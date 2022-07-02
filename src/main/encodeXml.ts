const re = /["&'<>\u0080-\uffff]/g;

export function encodeXml(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let charRef;
    let lastIndex = re.lastIndex;

    const startIndex = lastIndex - 1;
    const codePoint = input.codePointAt(startIndex)!;

    switch (codePoint) {
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
      default:
        charRef = '&#x' + codePoint.toString(16) + ';';

        if (codePoint > 0xffff) {
          re.lastIndex = ++lastIndex;
        }
        break;
    }

    output += textIndex === startIndex ? charRef : input.slice(textIndex, startIndex) + charRef;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
