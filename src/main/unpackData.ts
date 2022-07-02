/**
 * Unpacks a mapping packed at build time.
 */
export function unpackData(data: string): { [name: string]: string } {
  const unpackedData: { [name: string]: string } = {};
  const tokens = data.split(' ');
  const fromCharCode = String.fromCharCode;

  for (let i = 0; i < tokens.length; i += 2) {
    const raw = parseInt(tokens[i + 1], 36);
    unpackedData[tokens[i]] = raw > 0xffff ? fromCharCode(raw / 0xffff, raw % 0xffff) : fromCharCode(raw);
  }
  return unpackedData;
}
