import {allCharBy, CharCodeChecker} from 'tokenizer-dsl';
import {CharCode} from './CharCode';
import {fromCodePoint} from './fromCodePoint';
import {EntityLookup} from './createEntityLookup';

// [0-9]
const isNumberChar: CharCodeChecker = (c) => c >= 48 && c <= 57;

// [0-9A-Fa-f]
const isHexNumberChar: CharCodeChecker = (c) =>
    isNumberChar(c)
    || c >= CharCode['a'] && c <= CharCode['f']
    || c >= CharCode['A'] && c <= CharCode['F'];

// [0-9A-Za-z]
const isAlphaNumericChar: CharCodeChecker = (c) =>
    isNumberChar(c)
    || c >= CharCode['a'] && c <= CharCode['z']
    || c >= CharCode['A'] && c <= CharCode['Z'];

const takeNumber = allCharBy(isNumberChar);

const takeHexNumber = allCharBy(isHexNumberChar);

export function createDecoder(lookupEntity: EntityLookup, fromCharCode = fromCodePoint): (str: string) => string {

  return (str) => {
    let result = '';

    let x = 0;
    let i = 0;

    const charCount = str.length;

    while (i < charCount) {

      let j = str.indexOf('&', i);
      if (j === -1) {
        break;
      }

      i = j;

      let char;
      let k;

      if (str.charCodeAt(++j) === CharCode['#']) {
        // Numeric character reference
        let radix;

        const q = str.charCodeAt(++j);
        if (q === CharCode['x'] || q === CharCode['X']) {
          k = takeHexNumber(str, ++j);
          radix = 16;
        } else {
          k = takeNumber(str, j);
          radix = 10;
        }
        if (k !== j) {
          char = fromCharCode(parseInt(str.substring(j, k), radix));
        }
        if (str.charCodeAt(k) === CharCode[';']) {
          k++;
        }
      } else {
        // Named character reference
        k = j;

        const entityMatch = lookupEntity(str, k);
        if (entityMatch) {

          let q = k + entityMatch.charCount;
          const terminated = q < charCount && str.charCodeAt(q) === CharCode[';'];

          if (terminated) {
            q++;
          }
          if (terminated || entityMatch.legacy) {
            char = entityMatch.value;
            k = q;
          }
        }

      }

      if (char != null) {
        result += x !== i ? str.substring(x, i) + char : char;
        x = k;
      }
      i = k;
    }
    if (x === 0) {
      return str;
    }
    if (x !== charCount) {
      result += str.substr(x);
    }
    return result;
  };
}
