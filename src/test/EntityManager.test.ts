import {EntityManager, IEntity} from '../main';

describe('EntityManager', () => {

  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test('searches for a previously added entity', () => {
    manager.set('foo', 'bar');

    expect(manager.getByName('foo', 0)).toEqual(<IEntity>{
      name: 'foo',
      value: 'bar',
      legacy: false,
    });
  });

  test('can add multiple entities', () => {
    manager.setAll({foo: '123', bar: 'abc'}, true);

    expect(manager.getByName('__foo__', 2)).toEqual(<IEntity>{
      name: 'foo',
      value: '123',
      legacy: true,
    });

    expect(manager.getByName('bar', 0)).toEqual(<IEntity>{
      name: 'bar',
      value: 'abc',
      legacy: true,
    });
  });
});
