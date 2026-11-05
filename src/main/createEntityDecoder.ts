import { createEntityTrie } from './createEntityTrie.ts';
import { createEntityTrieDecoder, type EntityTrieDecoderOptions } from './createEntityTrieDecoder.ts';

/**
 * Options of {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions extends EntityTrieDecoderOptions {
  /**
   * Entity references mapped to their values, for example `{ '&amp;': '&', 'lt;': '<' }`, or a list of references and
   * values in turn, for example `['&amp;', '&', 'lt;', '<']`. A reference is an optional "&", a name of ASCII letters,
   * digits and "-.:_", and an optional ";". If the reference has the ";", the input needs it too.
   *
   * @default {}
   */
  entities?: Record<string, string> | readonly string[];
}

/**
 * Creates a decoder for numeric references and the given named entities.
 *
 * @throws Error if an entity reference is invalid, see {@linkcode EntityDecoderOptions.entities}.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities = {} } = options;

  return createEntityTrieDecoder(createEntityTrie(entities), options);
}
