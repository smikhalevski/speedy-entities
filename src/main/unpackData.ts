/**
 * Unpacks a mapping packed at build time.
 */
export function unpackData(data: string): Record<string, string> {
  const unpackedData: Record<string, string> = {};
  const tokens = data.split(' ');

  for (let i = 0; i < tokens.length; i += 2) {
    const raw = parseInt(tokens[i + 1], 36);
    unpackedData[tokens[i]] = raw > 0xffff ? String.fromCharCode(raw / 0xffff, raw % 0xffff) : String.fromCharCode(raw);
  }
  return unpackedData;
}
