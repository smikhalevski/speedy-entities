const re = /["&'<>\u0080-\uffff]/g;

export function encodeXml(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let entity;
    let lastIndex = re.lastIndex;

    const startIndex = lastIndex - 1;
    const codePoint = input.codePointAt(startIndex)!;

    switch (codePoint) {
      case 34: // "
        entity = '&quot;';
        break;
      case 38: // &
        entity = '&amp;';
        break;
      case 39: // '
        entity = '&apos;';
        break;
      case 60: // <
        entity = '&lt;';
        break;
      case 62: // >
        entity = '&gt;';
        break;
      default:
        entity = '&#x' + codePoint.toString(16) + ';';

        if (codePoint > 0xffff) {
          re.lastIndex = ++lastIndex;
        }
        break;
    }

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
