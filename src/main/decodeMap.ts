const OFFSET = 0xffff;

function decodeChars(src: string): string {
  let code = parseInt(src, 36);
  let chars = '';

  while (code > 0) {
    chars += String.fromCharCode(code % OFFSET);
    code = (code - code % OFFSET) / OFFSET;
  }
  return chars;
}

export function decodeMap(src: string, keyValueSep: string, pairSep?: string): Record<string, string> {
  const decodedMap: Record<string, string> = {};

  for (const pair of src.split(pairSep || ' ')) {
    const i = pair.indexOf(keyValueSep);
    if (i === -1) {
      continue;
    }
    decodedMap[pair.substr(0, i)] = decodeChars(pair.substr(i + 1));
  }
  return decodedMap;
}
