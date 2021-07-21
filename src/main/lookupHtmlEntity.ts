import {createEntityLookup} from './createEntityLookup';
import {decodeMap} from './decodeMap';
import entitiesSrc from './gen/entities.json';




export const lookupHtmlEntity = createEntityLookup(
    decodeMap(entitiesSrc, ';'),
    decodeMap(entitiesSrc, ','),
);
