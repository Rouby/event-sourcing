import { Model, SourcingEvent, applyEvent } from '../src';

export class Entity extends Model {
  kind = 'Entity' as const;

  @applyEvent('createEntity', 'name', matchesId)
  @applyEvent('updateEntity', 'name')
  name = '';

  others: OtherEntity[] = [];

  constructor(public id: string) {
    super();
  }

  applyEvent(event: SourcingEvent) {
    if (event.type === 'addOtherEntity') {
      this.others.push(this.getInstance('OtherEntity', event.payload.id));
    }

    this.getInstance('Entity', '1');
    this.getInstance('List');
  }
}

export class OtherEntity extends Model {
  kind = 'OtherEntity' as const;

  @applyEvent('addOtherEntity', 'name', matchesId)
  @applyEvent('updateOtherEntity', 'name')
  name = '';

  parent?: Entity;

  constructor(public id: string) {
    super();
  }

  applyEvent(event: SourcingEvent) {
    if (event.type === 'addOtherEntity') {
      this.parent = this.getInstance('Entity', event.payload.parent);
    }
  }
}

export class List extends Model {
  kind = 'List' as const;

  entities: Entity[] = [];

  applyEvent(event: SourcingEvent) {
    if (event.type === 'createEntity') {
      this.entities.push(this.getInstance('Entity', event.payload.id));
    }
  }
}

function matchesId(this: OtherEntity, e: { payload: { id: string } }) {
  return e.payload.id === this.id;
}

declare module '../src' {
  interface RegisterModels {
    Entity: typeof Entity;
    OtherEntity: typeof OtherEntity;
    List: typeof List;
  }
}
