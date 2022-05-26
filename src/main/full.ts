import entitiesData from './gen/entities.json';
import {unpackMap} from './unpackMap';
import {EntityManager} from './EntityManager';
import legacyEntitiesData from './gen/legacy-entities.json';
import {createEntityDecoder} from './createEntityDecoder';

export * from './createEntityDecoder';
export * from './EntityManager';
export * from './decodeXml';

export const htmlEntities = unpackMap(entitiesData);
export const legacyHtmlEntities = unpackMap(legacyEntitiesData);

/**
 * An entity manager that supports HTML entities.
 */
export const htmlEntityManager = new EntityManager();

htmlEntityManager.setAll(htmlEntities);
htmlEntityManager.setAll(legacyHtmlEntities, true);

export const decodeHtml = createEntityDecoder(htmlEntityManager);
