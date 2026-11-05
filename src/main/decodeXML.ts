/**
 * Decodes numeric references and the five predefined XML entities. References must end with ";", as XML requires.
 */
export function decodeXML(input: string): string {
  // Unlike decoders from createEntityDecoder, this one compares chars with the five entity names directly instead of
  // walking a trie, which makes it 20-40% faster

  let charIndex = input.indexOf('&');

  if (charIndex === -1) {
    // Most text has no references
    return input;
  }

  let output = '';
  let textIndex = 0;

  const inputLength = input.length;

  while (charIndex !== -1 && charIndex < inputLength - 1) {
    let startIndex = charIndex + 1;

    let value: string | undefined;
    let endIndex = startIndex;

    const charCode = input.charCodeAt(startIndex);

    if (charCode === /* # */ 35) {
      // Numeric character reference

      if (startIndex < inputLength - 1) {
        // All digits are consumed, out-of-range code points (Infinity included) are replaced with U+FFFD below
        let codePoint = 0;

        // The char after the digits, or -1 at the end of the input
        let terminatorCharCode = -1;

        if ((input.charCodeAt(++startIndex) | 32) === /* x */ 120) {
          endIndex = ++startIndex;

          // parseInt of a hexadecimal number
          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);

            // Convert alpha to lower case
            const lowerCharCode = digitCharCode | 32;

            if (digitCharCode >= /* 0 */ 48 && digitCharCode <= /* 9 */ 57) {
              codePoint = codePoint * 16 + digitCharCode - 48;
            } else if (lowerCharCode >= /* a */ 97 && lowerCharCode <= /* f */ 102) {
              codePoint = codePoint * 16 + lowerCharCode - 87;
            } else {
              terminatorCharCode = digitCharCode;
              break;
            }
            ++endIndex;
          }
        } else {
          endIndex = startIndex;

          // parseInt of a decimal number
          while (endIndex < inputLength) {
            const digitCharCode = input.charCodeAt(endIndex);

            if (digitCharCode >= /* 0 */ 48 && digitCharCode <= /* 9 */ 57) {
              codePoint = codePoint * 10 + digitCharCode - 48;
            } else {
              terminatorCharCode = digitCharCode;
              break;
            }
            ++endIndex;
          }
        }

        // At least one digit and ";" must be present
        if (endIndex !== startIndex && terminatorCharCode === /* ; */ 59) {
          ++endIndex;

          if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
            // Null char code, or character reference is outside the permissible Unicode range
            value = '\uFFFD';
          } else {
            value = String.fromCodePoint(codePoint);
          }
        }
      }
    } else if (charCode === /* l */ 108 || charCode === /* g */ 103) {
      // "&lt;" or "&gt;"

      if (
        startIndex + 2 < inputLength &&
        input.charCodeAt(startIndex + 1) === /* t */ 116 &&
        input.charCodeAt(startIndex + 2) === /* ; */ 59
      ) {
        value = charCode === /* l */ 108 ? '<' : '>';
        endIndex = startIndex + 3;
      }
    } else if (charCode === /* a */ 97) {
      // "&amp;" or "&apos;"

      if (startIndex + 3 < inputLength) {
        const nextCharCode = input.charCodeAt(startIndex + 1);

        if (
          nextCharCode === /* m */ 109 &&
          input.charCodeAt(startIndex + 2) === /* p */ 112 &&
          input.charCodeAt(startIndex + 3) === /* ; */ 59
        ) {
          value = '&';
          endIndex = startIndex + 4;
        } else if (
          nextCharCode === /* p */ 112 &&
          startIndex + 4 < inputLength &&
          input.charCodeAt(startIndex + 2) === /* o */ 111 &&
          input.charCodeAt(startIndex + 3) === /* s */ 115 &&
          input.charCodeAt(startIndex + 4) === /* ; */ 59
        ) {
          value = "'";
          endIndex = startIndex + 5;
        }
      }
    } else if (charCode === /* q */ 113) {
      // "&quot;"

      if (
        startIndex + 4 < inputLength &&
        input.charCodeAt(startIndex + 1) === /* u */ 117 &&
        input.charCodeAt(startIndex + 2) === /* o */ 111 &&
        input.charCodeAt(startIndex + 3) === /* t */ 116 &&
        input.charCodeAt(startIndex + 4) === /* ; */ 59
      ) {
        value = '"';
        endIndex = startIndex + 5;
      }
    }

    if (value === undefined) {
      charIndex = endIndex < inputLength - 1 ? input.indexOf('&', endIndex) : -1;
      continue;
    }

    // Appending the preceding text and the value separately avoids joining them into a new string first
    if (textIndex !== charIndex) {
      output += input.slice(textIndex, charIndex);
    }
    output += value;
    textIndex = endIndex;

    if (endIndex >= inputLength - 1) {
      break;
    }

    // References often follow each other, and checking the next char is cheaper than calling indexOf
    charIndex = input.charCodeAt(endIndex) === /* & */ 38 ? endIndex : input.indexOf('&', endIndex);
  }

  return textIndex === 0 ? input : textIndex === inputLength ? output : output + input.slice(textIndex);
}
