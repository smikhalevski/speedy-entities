import { createDoubleArrayEntityTrie, type EntityTrie } from './createDoubleArrayEntityTrie.ts';

/**
 * An optional "&", a name of ASCII letters, digits and "-.:_", and an optional ";".
 */
const entityRegExp = /^&?[a-zA-Z0-9.:_-]+;?$/;

/**
 * Builds a trie of entity names. Pass it to {@linkcode createEntityTrieDecoder} to create decoders that share it,
 * since building a trie takes time and memory.
 *
 * @param entities Entity references mapped to their values, or a list of references and values in turn, see
 * {@linkcode EntityDecoderOptions.entities}.
 */
export function createEntityTrie(entities: Record<string, string> | readonly string[]): EntityTrie {
  if (Array.isArray(entities)) {
    if (entities.length % 2 !== 0) {
      throw new Error('entities must list references and values in turn');
    }

    return createEntityTrieFromArray(entities);
  }

  const uncheckedEntities = [];

  for (const entity of Object.keys(entities)) {
    uncheckedEntities.push(entity, (entities as Record<string, string>)[entity]);
  }

  return createEntityTrieFromArray(uncheckedEntities);
}

/**
 * Builds a trie from references and values in turn. Lists are usually sorted and have no "&", so a list is copied only
 * if a name has "&" or names aren't sorted.
 */
function createEntityTrieFromArray(uncheckedEntities: string[]): EntityTrie {
  let checkedEntities = uncheckedEntities;

  let isSorted = true;
  let previousEntity = '';

  for (let index = 0; index < uncheckedEntities.length; index += 2) {
    let entity = uncheckedEntities[index];

    if (typeof entity !== 'string' || !entityRegExp.test(entity)) {
      throw new Error('Invalid entity reference: ' + JSON.stringify(entity));
    }

    if (typeof uncheckedEntities[index + 1] !== 'string') {
      throw new Error('Value of entity reference must be a string: ' + JSON.stringify(entity));
    }

    if (entity.charCodeAt(0) === /* & */ 38) {
      entity = entity.slice(1);

      if (checkedEntities === uncheckedEntities) {
        checkedEntities = uncheckedEntities.slice(0);
      }
      checkedEntities[index] = entity;
    }

    // Stripping "&" can change the order, so entities are compared without it
    if (entity < previousEntity) {
      isSorted = false;
    }

    previousEntity = entity;
  }

  return createDoubleArrayEntityTrie(isSorted ? checkedEntities : sortByEntityReference(checkedEntities));
}

// Sort is stable, so "&lt;" and "lt;" keep their order, and the value of the latter is used
function sortByEntityReference(entities: readonly string[]) {
  const indexes = new Uint32Array(entities.length / 2);

  for (let index = 0; index < indexes.length; ++index) {
    indexes[index] = index * 2;
  }

  indexes.sort((a, b) => (entities[a] < entities[b] ? -1 : entities[a] > entities[b] ? 1 : 0));

  const sortedEntities = [];

  for (const index of indexes) {
    sortedEntities.push(entities[index], entities[index + 1]);
  }

  return sortedEntities;
}
