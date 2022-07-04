import htmlEntitiesData from './gen/html-entities.json';
import legacyHtmlEntitiesData from './gen/legacy-html-entities.json';

export const htmlEntities = unpackEntities(htmlEntitiesData, false, unpackEntities(legacyHtmlEntitiesData, true, {}));

/**
 * Unpacks a mapping packed at build time.
 */
function unpackEntities(
  data: string,
  legacy: boolean,
  entities: { [name: string]: string }
): { [name: string]: string } {
  const arr = data.split(' ');

  for (let i = 0; i < arr.length; i += 2) {
    const value = parseInt(arr[i + 1], 36);
    const str = value > 0xffff ? String.fromCharCode(value / 0xffff, value % 0xffff) : String.fromCharCode(value);
    entities[arr[i] + ';'] = str;

    if (legacy) {
      entities[arr[i]] = str;
    }
  }
  return entities;
}
