import {createEntityLookup} from './createEntityLookup';

export const lookupXmlEntity = createEntityLookup({
  amp: '&',
  apos: '\'',
  gt: '>',
  lt: '<',
  quot: '"',
});
