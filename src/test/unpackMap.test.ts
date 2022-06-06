import entitiesData from '../main/gen/entities.json';
import {unpackMap} from '../main/unpackMap';

describe('unpackMap', () => {

  test('unpacks entities that consist of a single chars', () => {
    expect(unpackMap(entitiesData).get('ClockwiseContourIntegral')).toBe('\u2232');
  });

  test('unpacks entities that consist of two chars', () => {
    expect(unpackMap(entitiesData).get('acE')).toBe('\u223E\u0333');
    expect(unpackMap(entitiesData).get('Jscr')).toBe('\uD835\uDCA5');
  });
});
