import { Trie, trieCreate, trieSet } from '@smikhalevski/trie';

export function appendRange(range: number | [number, number], ranges: [number, number][]): void {
  let range0, range1;

  if (typeof range === 'number') {
    range0 = range1 = range;
  } else {
    range0 = range[0];
    range1 = range[1];
  }

  for (let i = 0; i < ranges.length; ++i) {
    const [other0, other1] = ranges[i];

    if (other0 - 1 <= range1 && range0 <= other1 + 1) {
      ranges.splice(i, 1);
      range0 = Math.min(range0, other0);
      range1 = Math.max(range1, other1);
      --i;
    }
  }

  ranges.push([range0, range1]);
}

export function appendReplacement(
  name: string,
  value: string,
  replacementMap: Map<number, string | Trie<string>>,
  ranges: [number, number][]
): void {
  const charRef = '&' + name + ';';
  const charCode = value.charCodeAt(0);
  const codePoint = value.codePointAt(0)!;
  const replacement = replacementMap.get(codePoint);

  if (typeof replacement === 'object') {
    trieSet(replacement, value.substring(1), charRef);
    return;
  }

  if (value.length === 1) {
    if (replacement === undefined) {
      appendRange(charCode, ranges);
    }
    replacementMap.set(codePoint, charRef);
    return;
  }

  const trie = trieCreate<string>();
  trieSet(trie, value.substring(1), charRef);

  if (replacement === undefined) {
    for (const range of ranges) {
      if (codePoint >= range[0] && codePoint <= range[1]) {
        trieSet(trie, '', '&#x' + codePoint.toString(16) + ';');
        break;
      }
    }
    appendRange(charCode, ranges);
  } else {
    trieSet(trie, '', replacement);
  }

  replacementMap.set(codePoint, trie);
}

export function convertRangesToRegExp(ranges: readonly [number, number][]): RegExp {
  let pattern = '';

  for (const [range0, range1] of ranges) {
    if (range0 === range1) {
      pattern += escapeUnicode(range0);
    } else {
      pattern += escapeUnicode(range0) + (range1 - range0 === 1 ? '' : '-') + escapeUnicode(range1);
    }
  }
  return RegExp('[' + pattern + ']', 'g');
}

function escapeUnicode(charCode: number): string {
  return '\\u' + charCode.toString(16).padStart(4, '0');
}
