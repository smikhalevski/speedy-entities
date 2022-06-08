import htmlEntitiesData from './gen/html-entities.json';
import legacyHtmlEntitiesData from './gen/legacy-html-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {unpackMap} from './unpackMap';

export const htmlNamedCharacterReferences = unpackMap(htmlEntitiesData);
export const legacyHtmlNamedCharacterReferences = unpackMap(legacyHtmlEntitiesData);

export const decodeHtml = createEntityDecoder({
  namedCharacterReferences: htmlNamedCharacterReferences,
  legacyNamedCharacterReferences: legacyHtmlNamedCharacterReferences,
});
