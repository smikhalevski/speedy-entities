import htmlEntitiesData from './gen/html-entities.json';
import legacyHtmlEntitiesData from './gen/legacy-html-entities.json';
import { createEntityDecoder } from './createEntityDecoder';
import { unpackData } from './unpackData';
import { createEntityEncoder } from './createEntityEncoder';

export const htmlNamedCharRefs = unpackData(htmlEntitiesData);
export const legacyHtmlNamedCharRefs = unpackData(legacyHtmlEntitiesData);

export const decodeHtml = createEntityDecoder({
  namedCharRefs: htmlNamedCharRefs,
  legacyNamedCharRefs: legacyHtmlNamedCharRefs,
});

export const encodeHtml = createEntityEncoder({
  namedCharRefs: Object.assign({}, legacyHtmlNamedCharRefs, htmlNamedCharRefs),
});

export const encodeAsciiHtml = createEntityEncoder({
  namedCharRefs: Object.assign({}, legacyHtmlNamedCharRefs, htmlNamedCharRefs),
  numericCharRefs: [[0x80, 0xffff]],
});
