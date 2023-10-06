import {
  EventStore,
  MemoryStore,
  getInstance,
  lazyInstance,
  publishEvent,
} from '../../src';
import { createEntity, updateEntity } from './events';
import { Entity } from './models';

EventStore.setupStore(MemoryStore);

await publishEvent({ event: createEntity() });
await publishEvent({ event: updateEntity() });

console.log('instance', await getInstance(Entity, '1').then((e) => e.name));
console.log('lazy', await lazyInstance('Entity', '1').name);
