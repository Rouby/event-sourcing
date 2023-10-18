import { EventSourcing } from '../../src';
import { createEntity, updateEntity } from './events';
import { Entity } from './models';

const source = new EventSourcing({
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

await source.publishEvent({ event: createEntity() });

const instance = source.getInstance(Entity, '1');
source.subscribeInstance(instance, () => {
  console.log('instance-update-received', instance.name);
});

await source.publishEvent({ event: updateEntity('Updated') });
