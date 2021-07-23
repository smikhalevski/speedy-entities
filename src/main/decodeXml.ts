import {createEntityDecoder} from './createEntityDecoder';
import {createEntityManager} from './createEntityManager';

/**
 * An entity manager that supports XML entities.
 */
export const xmlEntityManager = createEntityManager();

xmlEntityManager.setAll({
  amp: '&',
  apos: '\'',
  gt: '>',
  lt: '<',
  quot: '"',
});

/**
 * Decodes XML entities in a string.
 */
export const decodeXml = createEntityDecoder(xmlEntityManager, {numericCharacterReferenceTerminated: true});
