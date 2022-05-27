import {EntityManager} from './EntityManager';

// const entityRe = /[\t\n!-,./:-@[-`\f{-}$\x80-\uFFFF]/g;

export function createEntityEncoder(entityManager: EntityManager): (input: string) => string {
  return function entityEncoder(input) {

    let str = '';
    let prevIndex = 0;

    const entityRe = entityManager.getRe();

    entityRe.lastIndex = 0;

    while (entityRe.test(input)) {
      const index = entityRe.lastIndex - 1;

      str += input.substring(prevIndex, index);

      const entityNode = entityManager.getByValue(input, index);

      // Named entity
      if (entityNode != null) {
        str += entityNode.value;
        prevIndex = index + entityNode.charCount;
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
