import {fromCharCode} from './misc';

/**
 * Unpacks mapping created at build time.
 */
export function unpackMap(data: string): Map<string, string> {
  const map = new Map<string, string>();
  const tokens = data.split(' ');

  for (let i = 0; i < tokens.length; i += 2) {
    const raw = parseInt(tokens[i + 1], 36);
    map.set(tokens[i], raw > 0xffff ? fromCharCode(raw / 0xffff, raw % 0xffff) : fromCharCode(raw));
  }
  return map;
}
