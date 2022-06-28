import htmlEntitiesData from './gen/html-entities.json';
import legacyHtmlEntitiesData from './gen/legacy-html-entities.json';
import {createEntityDecoder} from './createEntityDecoder';
import {unpackData} from './unpackData';

export const htmlNamedCharacterReferences = unpackData(htmlEntitiesData);
export const legacyHtmlNamedCharacterReferences = unpackData(legacyHtmlEntitiesData);

export const decodeHtml = createEntityDecoder({
  namedCharacterReferences: htmlNamedCharacterReferences,
  legacyNamedCharacterReferences: legacyHtmlNamedCharacterReferences,
});
