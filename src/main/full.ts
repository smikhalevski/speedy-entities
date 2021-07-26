import entitiesData from './gen/entities.json';
import {unpackMap} from './unpackMap';
import {createEntityManager} from './createEntityManager';
import legacyEntitiesData from './gen/legacy-entities.json';
import {createEntityDecoder} from './createEntityDecoder';

export * from './createEntityDecoder';
export * from './createEntityManager';
export * from './decodeXml';

export const htmlEntities = unpackMap(entitiesData);
export const legacyHtmlEntities = unpackMap(legacyEntitiesData);

/**
 * An entity manager that supports HTML entities.
 */
export const htmlEntityManager = createEntityManager();

htmlEntityManager.setAll(htmlEntities);
htmlEntityManager.setAll(legacyHtmlEntities, true);

export const decodeHtml = createEntityDecoder(htmlEntityManager);
