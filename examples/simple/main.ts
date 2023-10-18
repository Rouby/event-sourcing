import { EventSourcing } from '../../src';
import { createEntity, updateEntity } from './events';
import { Entity } from './models';

const source = new EventSourcing();

await source.publishEvent({ event: createEntity() });
await source.publishEvent({ event: updateEntity('Updated') });

console.log('instance', source.getInstance(Entity, '1').name); // Updated
