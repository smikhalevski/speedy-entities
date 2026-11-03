import { createEntityTrie } from './createEntityTrie.js';
import { createEntityTrieDecoder } from './createEntityTrieDecoder.js';

/**
 * The options recognized by {@linkcode createEntityDecoder}.
 */
export interface EntityDecoderOptions {
  /**
   * Mapping from an [character entity reference](https://www.w3.org/TR/html4/charset.html#h-5.3.2) to its decoded value.
   * Entity references may contain the ASCII chars that XML allows in names: letters, digits, "-", ".", ":" and "_".
   * They may optionally start with an ampersand "&" and end with a semicolon ";". An error is thrown if an entity
   * reference is invalid.
   *
   * ```json
   * {
   *   "&Delta;": "\u0394",
   *   "LongRightArrow;": "\u27F6"
   * }
   * ```
   */
  entities?: Record<string, string>;

  /**
   * If `true` then [numeric character references](https://www.w3.org/TR/html4/charset.html#h-5.3.1) must be terminated
   * with a semicolon to be decoded. Otherwise, numeric character references are recognized even if they aren't
   * terminated with a semicolon.
   *
   * @default false
   */
  isNumericReferenceSemicolonRequired?: boolean;

  /**
   * If `true` then numeric character references to C1 control characters (U+0080 to U+009F) are decoded as
   * Windows-1252 characters, [as HTML does](https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state).
   * For example, "&#128;" is decoded as "\u20AC" instead of "\u0080". XML doesn't do this.
   *
   * @default true
   */
  areC1ControlsRemapped?: boolean;

  /**
   * If `true` then a named character reference that isn't terminated with a semicolon isn't decoded if it's followed
   * by "=" or an ASCII alphanumeric char, [as HTML does in attribute values](https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state).
   * This keeps URL query parameters intact, for example "?a=1&copy=2" isn't decoded as "?a=1\u00A9=2".
   *
   * @default false
   */
  isAttributeValue?: boolean;
}

/**
 * Creates an entity decoder that rewrites numeric and named entities found in input to their respective values.
 *
 * @param options The decoder options.
 * @returns A function that decodes entities in the string.
 */
export function createEntityDecoder(options: EntityDecoderOptions = {}): (input: string) => string {
  const { entities = {} } = options;

  return createEntityTrieDecoder(createEntityTrie(entities), options);
}
