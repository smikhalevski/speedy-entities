import {addToTrie, createTrie, lookupInTrie} from './trie';

export type EntityLookup = (str: string, offset: number) => IEntityMatch | undefined;

export interface IEntityMatch {
  charCount: number;
  value: string;
  legacy: boolean;
}

export function createEntityLookup(entities: Record<string, string>, legacyEntities?: Record<string, string>): EntityLookup {

  const trie = createTrie<IEntityMatch>();

  for (const [key, value] of Object.entries(entities)) {
    addToTrie(trie, key, {
      value,
      charCount: key.length,
      legacy: false,
    });
  }

  if (legacyEntities) {
    for (const [key, value] of Object.entries(legacyEntities)) {
      addToTrie(trie, key, {
        value,
        charCount: key.length,
        legacy: true,
      });
    }
  }

  return (str, offset) => lookupInTrie(trie, str, offset)?.value;
}
