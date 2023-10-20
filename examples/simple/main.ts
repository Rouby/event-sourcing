import { EventSourcing } from '../../src';
import { createEntity, updateEntity } from '../events';
import * as models from '../models';

const source = new EventSourcing({ models });

await source.publishEvent({ event: createEntity('1') });
await source.publishEvent({ event: updateEntity('Updated') });

console.log('instance', source.getInstance(models.Entity, '1').name); // Updated
