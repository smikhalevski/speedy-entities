import { buildDoubleArrayTrie } from './DoubleArrayTrie.ts';

declare const entityTrieBrand: unique symbol;

/**
 * A trie of entity names, see {@linkcode createEntityTrie}. Its contents are internal, so they can change in any
 * release.
 */
export interface EntityTrie {
  /**
   * Makes the type opaque, so only {@linkcode createEntityTrie} returns it.
   *
   * @internal
   */
  readonly [entityTrieBrand]: true;
}

/**
 * An optional "&", a name of ASCII letters, digits and "-.:_", and an optional ";".
 */
const entityReferenceRegExp = /^&?[a-zA-Z0-9.:_-]+;?$/;

/**
 * Builds a trie of entity names. Pass it to {@linkcode createEntityTrieDecoder} to create decoders that share it,
 * since building a trie takes time and memory.
 *
 * It's a [double-array trie](https://en.wikipedia.org/wiki/Trie#Implementation_strategies): finding the child of a
 * node takes two array reads and no hashing.
 *
 * @param entities Entity references mapped to their values, or a list of references and values in turn, see
 * {@linkcode EntityDecoderOptions.entities}.
 * @throws Error if an entity reference is invalid, or a listed reference has no value.
 */
export function createEntityTrie(entities: Record<string, string> | readonly string[]): EntityTrie {
  // Names without "&" and values in turn
  const entityList: string[] = [];

  if (isEntityList(entities)) {
    if (entities.length % 2 !== 0) {
      throw new Error('entities must list references and values in turn');
    }
    for (let index = 0; index < entities.length; index += 2) {
      addEntity(entityList, entities[index], entities[index + 1]);
    }
  } else {
    for (const entityReference of Object.keys(entities)) {
      addEntity(entityList, entityReference, entities[entityReference]);
    }
  }

  // Entity tables are usually sorted, so entities are sorted only if they aren't
  return buildDoubleArrayTrie(isSortedByName(entityList) ? entityList : sortByName(entityList));
}

function isEntityList(entities: Record<string, string> | readonly string[]): entities is readonly string[] {
  return Array.isArray(entities);
}

function addEntity(entityList: string[], entityReference: string, value: string) {
  if (!entityReferenceRegExp.test(entityReference)) {
    throw new Error('Invalid entity reference: ' + JSON.stringify(entityReference));
  }

  // Skip the leading ampersand
  entityList.push(entityReference.charCodeAt(0) === /* & */ 38 ? entityReference.slice(1) : entityReference, value);
}

function isSortedByName(entityList: string[]) {
  for (let index = 2; index < entityList.length; index += 2) {
    if (entityList[index - 2] > entityList[index]) {
      return false;
    }
  }
  return true;
}

// Sort is stable, so "&lt;" and "lt;" keep their order, and the value of the latter is used
function sortByName(entityList: string[]) {
  const nameIndexes = [];

  for (let index = 0; index < entityList.length; index += 2) {
    nameIndexes.push(index);
  }

  nameIndexes.sort((a, b) => (entityList[a] < entityList[b] ? -1 : entityList[a] > entityList[b] ? 1 : 0));

  const sortedEntityList = [];

  for (const index of nameIndexes) {
    sortedEntityList.push(entityList[index], entityList[index + 1]);
  }
  return sortedEntityList;
}
