import entitiesData from './gen/entities.json';
import legacyEntitiesData from './gen/legacy-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {createEntityManager} from './createEntityManager';
import {unpackMap} from './unpackMap';

/**
 * An entity manager that supports HTML entities.
 */
export const htmlEntityManager = createEntityManager();

htmlEntityManager.setAll(unpackMap(entitiesData));
htmlEntityManager.setAll(unpackMap(legacyEntitiesData), true);

/**
 * Decodes HTML entities in a string.
 */
export const decodeHtml = createEntityDecoder(htmlEntityManager);
