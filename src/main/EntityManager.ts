import {Trie, trieCreate, trieSearch, trieSet} from '@smikhalevski/trie';

export interface IEntity {
  name: string,
  value: string;
  legacy: boolean;
}

export class EntityManager {

  private _decodeTrie = trieCreate<IEntity>();
  private _encodeTrie = trieCreate<string>();
  private _chars = new Set<number>();

  /**
   * Sets a new mapping from entity name to a replacement value.
   *
   * @param name The entity name.
   * @param value The value that the entity reference is replaced with.
   * @param legacy If `true` then entity reference doesn't require a trailing semicolon.
   */
  set(name: string, value: string, legacy?: boolean): void {
    trieSet(this._decodeTrie, name, {name, value, legacy: legacy || false});
    trieSet(this._encodeTrie, value, '&' + name + ';');
    this._chars.add(value.charCodeAt(0));
  }

  /**
   * Sets multiple entity mappings.
   *
   * @param entities The map from an entity name to a value.
   * @param legacy If `true` then entity reference doesn't require a trailing semicolon.
   */
  setAll(entities: Record<string, string>, legacy?: boolean): void {
    for (const [name, value] of Object.entries(entities)) {
      this.set(name, value, legacy);
    }
  }

  /**
   * Searches an entity name in the `input` string staring from `offset`.
   *
   * ```ts
   * const entityManager = new EntityManager();
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
  getByName(input: string, offset: number): IEntity | undefined {
    return trieSearch(this._decodeTrie, input, offset)?.value;
  }

  getRe(): RegExp {
    return new RegExp('[\\t\\n!-,./:-@[-`\\f{-}$\\x80-\\uFFFF' + Array.from(this._chars).map((char) => '\\u' + char.toString(16).padStart(4, '0')).join('') + ']', 'g');
  }

  getByValue(input: string, offset: number): Trie<string> | undefined {
    return trieSearch(this._encodeTrie, input, offset) || undefined;
  }
}
