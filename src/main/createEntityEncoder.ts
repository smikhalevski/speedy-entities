import {EntityManager} from './EntityManager';

export function createEntityEncoder(entityManager: EntityManager): (input: string) => string {
  return function entityEncoder(input) {

    let str = '';
    let prevIndex = 0;

    const entityRe = entityManager.getRe();

    entityRe.lastIndex = 0;

    while (entityRe.test(input)) {
      const index = entityRe.lastIndex - 1;

      str += input.substring(prevIndex, index);

      const entityTrie = entityManager.getByValue(input, index);

      // Named entity
      if (entityTrie !== undefined) {
        str += entityTrie.value;
        prevIndex = index + entityTrie.length;
      } else {
        const charCode = input.charCodeAt(index);
        const codePoint = input.codePointAt(index) || charCode;

        str += '&#' + codePoint + ';';
        prevIndex = index + (codePoint !== charCode ? 2 : 1);
      }
    }

    str += input.substring(prevIndex);

    return str;
  };
}
