import { createEntityDecoder } from './createEntityDecoder';
// import { unpackData } from './unpackData';
// import xmlData from './gen/xml-data';

/**
 * Decodes XML entities and numeric character references in the input.
 */
export const decodeXML = createEntityDecoder({
  // entitiesTrie: unpackData(xmlData),
  numericReferenceSemicolonRequired: true,
});
