import xmlEntitiesData from './gen/xml-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {unpackData} from './unpackData';

export const xmlNamedCharacterReferences = unpackData(xmlEntitiesData);

/**
 * Decodes XML entities in a string.
 */
export const decodeXml = createEntityDecoder({
  namedCharacterReferences: xmlNamedCharacterReferences,
  numericCharacterReferenceTerminated: true,
});
