import { EventSourcing } from '../../src';
import { createEntity, updateEntity } from '../events';
import * as models from '../models';

const source = new EventSourcing({
  models,
  plugins: [
    {
      initialize({ addEvent }) {
        setTimeout(() => {
          addEvent({
            id: '',
            causationId: '',
            correlationId: '',
            createdAt: new Date(),
            ...updateEntity('Updated at timeout'),
          });
        }, 1000);
      },
    },
  ],
});

await source.publishEvent({ event: createEntity('1') });

const instance = source.getInstance(models.Entity, '1');
source.subscribeInstance(instance, () => {
  console.log('instance-update-received', instance.name);
});

await source.publishEvent({ event: updateEntity('Updated') });
