import {fromCharCode} from './misc';

/**
 * Unpacks a mapping packed at build time.
 */
export function unpackMap(data: string): Map<string, string> {
  const unpackedMap = new Map<string, string>();
  const tokens = data.split(' ');

  for (let i = 0; i < tokens.length; i += 2) {
    const raw = parseInt(tokens[i + 1], 36);
    unpackedMap.set(tokens[i], raw > 0xffff ? fromCharCode(raw / 0xffff, raw % 0xffff) : fromCharCode(raw));
  }
  return unpackedMap;
}
