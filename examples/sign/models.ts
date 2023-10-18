import { Model, applyEvent } from '../../src';

export class Entity extends Model {
  kind = 'Entity' as const;

  @applyEvent('createEntity', 'name')
  @applyEvent('updateEntity', 'name')
  name = '';

  constructor(public id: string) {
    super();
  }
}

declare module '../../src' {
  interface RegisterModels {
    Entity: typeof Entity;
  }
}
