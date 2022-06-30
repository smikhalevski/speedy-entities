import entitiesData from '../main/gen/html-entities.json';
import { unpackData } from '../main/unpackData';

describe('unpackData', () => {
  test('unpacks entities that consist of a single chars', () => {
    expect(unpackData(entitiesData).ClockwiseContourIntegral).toBe('\u2232');
  });

  test('unpacks entities that consist of two chars', () => {
    expect(unpackData(entitiesData).acE).toBe('\u223E\u0333');
    expect(unpackData(entitiesData).Jscr).toBe('\uD835\uDCA5');
  });
});
