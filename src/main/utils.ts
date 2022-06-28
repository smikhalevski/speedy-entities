export function die(message: string): never {
  throw new Error(message);
}

export const fromCharCode = String.fromCharCode;

export function appendNumberOrRange(x: string | number | [string | number, string | number], ranges: Array<[number, number]>): void {
  let x0, x1;

  if (typeof x === 'object') {
    x0 = toCharCode(x[0]);
    x1 = toCharCode(x[1]);
  } else {
    x0 = x1 = toCharCode(x);
  }

  for (let i = 0; i < ranges.length; ++i) {
    const [y0, y1] = ranges[i];

    if (y0 - 1 <= x1 && x0 <= y1 + 1) {
      ranges.splice(i, 1);
      x0 = Math.min(x0, y0);
      x1 = Math.max(x1, y1);
      --i;
    }
  }

  ranges.push([x0, x1]);
}

export function convertRangesToRegExp(ranges: [number, number][]): RegExp {
  let pattern = '';

  for (const [x0, x1] of ranges) {
    pattern += x0 === x1 ? escapeUnicode(x0) : escapeUnicode(x0) + '-' + escapeUnicode(x1);
  }
  return RegExp('[' + pattern + ']', 'g');
}

function escapeUnicode(charCode: number): string {
  return '\\u' + charCode.toString(16).padStart(4, '0');
}

function toCharCode(value: number | string): number {
  return typeof value === 'number' ? value : value.charCodeAt(0);
}
