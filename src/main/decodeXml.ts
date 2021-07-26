import {createEntityDecoder} from './createEntityDecoder';
import {createEntityManager} from './createEntityManager';

export const xmlEntities: Record<string, string> = {
  amp: '&',
  apos: '\'',
  gt: '>',
  lt: '<',
  quot: '"',
};

/**
 * An entity manager that supports XML entities.
 */
export const xmlEntityManager = createEntityManager();

xmlEntityManager.setAll(xmlEntities);

/**
 * Decodes XML entities in a string.
 */
export const decodeXml = createEntityDecoder(xmlEntityManager, {numericCharacterReferenceTerminated: true});
