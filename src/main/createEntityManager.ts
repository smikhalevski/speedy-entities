import {createTrie, searchTrie, setTrie} from './trie';

export interface IEntity {
  name: string,
  value: string;
  legacy: boolean;
}

export interface IEntityManager {

  /**
   * Sets a new mapping from entity name to a replacement value.
   *
   * @param name The entity name.
   * @param value The value that the entity reference is replaced with.
   * @param legacy If `true` then entity reference doesn't require a trailing semicolon.
   */
  set(name: string, value: string, legacy?: boolean): void;

  /**
   * Sets multiple entity mappings.
   *
   * @param entities The map from an entity name to a value.
   * @param legacy If `true` then entity reference doesn't require a trailing semicolon.
   */
  setAll(entities: Record<string, string>, legacy?: boolean): void;

  /**
   * Searches an entity name in the `input` string staring from `offset`.
   *
   * ```ts
   * const entityManager = createEntityManager();
   *
   * entityManager.set('foo', 'bar');
   *
   * entityManager.search('__foo__', 2);
   * // → {key: "foo", value: "bar", legacy: false}
   * ```
   *
   * @param input The string to search entity names in.
   * @param offset The offset in the `input` to start searching from.
   */
  search(input: string, offset: number): IEntity | undefined;
}

/**
 * Creates a new {@link IEntityManager}.
 */
export function createEntityManager(): IEntityManager {

  const trie = createTrie<IEntity>();

  const set = (name: string, value: string, legacy = false): void => setTrie(trie, name, {name, value, legacy});

  const setAll = (entities: Record<string, string>, legacy = false): void => {
    for (const [name, value] of Object.entries(entities)) {
      set(name, value, legacy);
    }
  };

  const search = (input: string, offset: number) => searchTrie(trie, input, offset)?.value;

  return {
    set,
    setAll,
    search,
  };
}
