import { htmlEntities } from '../main';

describe('htmlEntities', () => {
  test('contains HTML entities', () => {
    expect(htmlEntities['AMP']).toBe('&');
    expect(htmlEntities['AMP;']).toBe('&');
    expect(htmlEntities['amp']).toBe('&');
    expect(htmlEntities['amp;']).toBe('&');
    expect(htmlEntities['FilledVerySmallSquare;']).toBe('\u25AA');
    expect(htmlEntities['FilledVerySmallSquare']).toBe(undefined);
  });
});
