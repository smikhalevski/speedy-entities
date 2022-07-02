const re = /[&<>\u00A0]/g;

export function escapeText(input: string): string {
  let output = '';
  let textIndex = 0;

  while (re.test(input)) {
    let charRef;

    const lastIndex = re.lastIndex;
    const startIndex = lastIndex - 1;

    switch (input.charCodeAt(startIndex)) {
      case 38: // &
        charRef = '&amp;';
        break;
      case 60: // <
        charRef = '&lt;';
        break;
      case 62: // >
        charRef = '&gt;';
        break;
      case 160:
        charRef = '&nbsp;';
        break;
    }

    output += textIndex === startIndex ? charRef : input.substring(textIndex, startIndex) + charRef;
    textIndex = lastIndex;
  }

  return textIndex === 0 ? input : textIndex === input.length ? output : output + input.substring(textIndex);
}
