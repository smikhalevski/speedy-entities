import htmlEntitiesData from './gen/html-entities.json';
import legacyHtmlEntitiesData from './gen/legacy-html-entities.json';

const fromCharCode = String.fromCharCode;

function unpackData(data: string, legacy: boolean, entities: { [name: string]: string }): { [name: string]: string } {
  const tokens = data.split(' ');

  for (let i = 0; i < tokens.length; i += 2) {
    const name = tokens[i];
    const raw = parseInt(tokens[i + 1], 36);
    const value = raw > 0xffff ? fromCharCode(raw / 0xffff, raw % 0xffff) : fromCharCode(raw);

    if (legacy) {
      entities[name] = value;
    }
    entities[name + ';'] = value;
  }
  return entities;
}

/**
 * The character reference names that are supported by HTML, and the code points to which they refer as listed in
 * [Named character references section of WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/named-characters.html).
 */
export const htmlEntities = unpackData(htmlEntitiesData, false, unpackData(legacyHtmlEntitiesData, true, {}));
