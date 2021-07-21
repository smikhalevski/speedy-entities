import {createDecoder} from './createDecoder';
import {lookupXmlEntity} from './lookupXmlEntity';

export const decodeXml = createDecoder(lookupXmlEntity);
