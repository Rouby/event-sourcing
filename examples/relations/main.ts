import { EventSourcing } from '../../src';
import { addOtherEntity, createEntity, updateEntity } from '../events';
import * as models from '../models';

const source = new EventSourcing({ models });

await source.publishEvent({ event: createEntity('1') });
await source.publishEvent({ event: addOtherEntity('a', '1', 'Another') });

const instanceNow = source.getInstance(models.Entity, '1');

await new Promise((resolve) => setTimeout(resolve, 10));
await source.publishEvent({ event: updateEntity('Updated') });

console.log('instance', instanceNow.others[0].name); // Another
console.log('instance', instanceNow.others[0].parent?.name); // New Entity, later events should not factor in
