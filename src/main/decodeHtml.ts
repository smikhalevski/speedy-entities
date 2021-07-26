import legacyEntitiesData from './gen/legacy-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {createEntityManager} from './createEntityManager';
import {unpackMap} from './unpackMap';

export const legacyHtmlEntities = unpackMap(legacyEntitiesData);

/**
 * An entity manager that supports HTML entities.
 */
export const htmlEntityManager = createEntityManager();

htmlEntityManager.setAll(legacyHtmlEntities, true);

export const decodeHtml = createEntityDecoder(htmlEntityManager);
