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
EventStore.setupSigning({
  signEvent(event) {
    return { ...event, issuer: 'issuer', signature: 'signature' };
  },
  verifyEvent(event) {
    return event.issuer === 'issuer' && event.signature === 'signature';
  },
});

await publishEvent({ event: createEntity(), sign: true });
await publishEvent({ event: updateEntity() });

console.log('instance', await getInstance(Entity, '1').then((e) => e.name));
console.log('lazy', await lazyInstance('Entity', '1').name);
