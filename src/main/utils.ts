export function createEntityMap(x: any): Map<number, string> {
  const m = new Map();

  for (let i = 0; i < x.length; i += 2) {
    m.set(x[i], x[i + 1]);
  }

  return m;
}
