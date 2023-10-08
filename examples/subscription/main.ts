import {
  EventStore,
  MemoryStore,
  getInstance,
  lazyInstance,
  publishEvent,
  subscribeInstance,
} from '../../src';
import { createEntity, updateEntity } from './events';
import { Entity } from './models';

EventStore.setupStore(MemoryStore);

await publishEvent({ event: createEntity() });

subscribeInstance(
  (entity) => {
    console.log('instance-update-received', entity.name);
  },
  Entity,
  '1',
);

await publishEvent({ event: updateEntity() });

console.log('instance', await getInstance(Entity, '1').then((e) => e.name));
console.log('lazy', await lazyInstance('Entity', '1').name);
