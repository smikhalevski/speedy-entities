const re = /["&'<>\u0080-\uffff]/g;

export function encodeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let entity;
    let lastIndex = re.lastIndex;

    const startIndex = lastIndex - 1;
    const charCode = input.charCodeAt(startIndex);

    switch (charCode) {
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
        let codePoint = charCode;

        if ((charCode & 0xfc00) === 0xd800) {
          // Surrogate pair
          codePoint = charCode * 0x400 + input.charCodeAt(lastIndex) - 0x35fdc00;
          re.lastIndex = ++lastIndex;
        }
        entity = '&#x' + codePoint.toString(16) + ';';
        break;
    }

    output += textIndex === startIndex ? entity : input.slice(textIndex, startIndex) + entity;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.slice(textIndex);
}
