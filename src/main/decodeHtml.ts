import {createDecoder} from './createDecoder';
import {lookupHtmlEntity} from './lookupHtmlEntity';

export const decodeHtml = createDecoder(lookupHtmlEntity);
