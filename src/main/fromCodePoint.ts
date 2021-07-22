import illegalCodePoints from './data/illegal-code-points.json';
import overridesData from './gen/overrides.json';
import {unpackMap} from './unpackMap';
import {die, fromCharCode} from './misc';

const overridesMap = unpackMap(overridesData);

/**
 * @see https://github.com/mathiasbynens/he/blob/master/data/decode-map-overrides.json
 * @see https://github.com/mathiasbynens/he/blob/master/data/invalid-character-reference-code-points.json
 */
export function fromCodePoint(codePoint: number, replacementChar?: string, strict?: boolean) {
  replacementChar ||= '\ufffd';

  if (codePoint >= 0xd800 && codePoint <= 0xdfff || codePoint > 0x10ffff) {
    if (strict) {
      die('Character reference outside the permissible Unicode range');
    }
    return replacementChar;
  }
  const overrideChar = overridesMap[codePoint];
  if (overrideChar != null) {
    if (strict) {
      die('Disallowed character reference');
    }
    return overrideChar;
  }
  if (strict && illegalCodePoints.indexOf(codePoint) !== -1) {
    die('Disallowed character reference');
  }
  if (codePoint > 0xffff) {
    codePoint -= 0x10000;
    return fromCharCode(codePoint >>> 10 & 0x3ff | 0xd800) + fromCharCode(0xdc00 | codePoint & 0x3ff);
  }
  return fromCharCode(codePoint);
}
