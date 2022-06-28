export function die(message: string): never {
  throw new Error(message);
}

export const fromCharCode = String.fromCharCode;

export function appendNumberOrRange(x: number | [number, number], ranges: Array<[number, number]>): void {
  let x0, x1;

  if (typeof x === 'number') {
    x0 = x;
    x1 = x;
  } else {
    x0 = x[0];
    x1 = x[1];
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
