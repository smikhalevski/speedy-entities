import xmlEntitiesData from './gen/xml-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {unpackMap} from './unpackMap';

export const xmlNamedCharacterReferences = unpackMap(xmlEntitiesData);

/**
 * Decodes XML entities in a string.
 */
export const decodeXml = createEntityDecoder({
  namedCharacterReferences: xmlNamedCharacterReferences,
  numericCharacterReferenceTerminated: true,
});
