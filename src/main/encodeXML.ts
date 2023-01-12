const re = /["&'<>\u0080-\uffff]/g;

export function encodeXML(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let lastIndex = re.lastIndex;

    const startIndex = lastIndex - 1;
    const charCode = input.charCodeAt(startIndex);

    let entity;

    if (charCode >= 0x80 && charCode <= 0xffff) {
      let codePoint = charCode;

      if ((charCode & 0xfc00) === 0xd800) {
        // Surrogate pair
        codePoint = charCode * 0x400 + input.charCodeAt(lastIndex) - 0x35fdc00;
        re.lastIndex = ++lastIndex;
      }
      entity = '&#x' + codePoint.toString(16) + ';';
    } else if (charCode === 34) {
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
