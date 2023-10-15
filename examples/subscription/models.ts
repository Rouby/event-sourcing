import { Model, SourcingEvent, applyEvent, registerModel } from '../../src';

@registerModel
export class Entity extends Model {
  kind = 'Entity' as const;

  @applyEvent('createEntity', 'name')
  @applyEvent('updateEntity', 'name')
  name = '';

  constructor(public id: string) {
    super();
  }

  protected applyEvent(event: SourcingEvent): void {}
}

declare module '../../src' {
  interface RegisterModels {
    Entity: typeof Entity;
  }
}