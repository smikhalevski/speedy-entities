import { createEntityDecoder } from './createEntityDecoder.js';
import xmlEntities from './xml-entities.js';

/**
 * Decodes numeric references and the five predefined XML entities. References must end with ";", as XML requires.
 */
export const decodeXML = createEntityDecoder({
  entities: xmlEntities,
  isNumericReferenceSemicolonRequired: true,
  areC1ControlsRemapped: false,
});
