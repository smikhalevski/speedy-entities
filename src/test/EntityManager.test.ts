import {EntityManager, IEntity} from '../main';

describe('EntityManager', () => {

  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test('searches for a previously added entity', () => {
    manager.set('foo', 'bar');

    expect(manager.search('foo', 0)).toEqual(<IEntity>{
      name: 'foo',
      value: 'bar',
      legacy: false,
    });
  });

  test('can add multiple entities', () => {
    manager.setAll({foo: '123', bar: 'abc'}, true);

    expect(manager.search('__foo__', 2)).toEqual(<IEntity>{
      name: 'foo',
      value: '123',
      legacy: true,
    });

    expect(manager.search('bar', 0)).toEqual(<IEntity>{
      name: 'bar',
      value: 'abc',
      legacy: true,
    });
  });
});