import {fromCharCode} from './misc';

const OFFSET = 0xffff;

/**
 * Unpacks mapping created at build time.
 */
export function unpackMap(data: string): Record<string, string> {
  const unpackedMap: Record<string, string> = {};
  const tokens = data.split(' ');

  for (let i = 0; i < tokens.length; i += 2) {
    unpackedMap[tokens[i]] = unpackValue(tokens[i + 1]);
  }
  return unpackedMap;
}

function unpackValue(data: string): string {
  let value = '';
  let packedValue = parseInt(data, 36);

  while (packedValue > 0) {
    value += fromCharCode(packedValue % OFFSET);
    packedValue = (packedValue - packedValue % OFFSET) / OFFSET;
  }
  return value;
}
