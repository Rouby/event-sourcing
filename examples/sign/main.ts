import { EventSourcing, SourcingEvent } from '../../src';
import { createEntity, updateEntity } from '../events';
import * as models from '../models';

const source = new EventSourcing({
  models,
  plugins: [
    {
      async prepareEventBeforePublishing(
        event: SourcingEvent & { issuer: string; signature: string },
      ) {
        return { ...event, issuer: 'issuer', signature: 'signature' };
      },
      async beforeAddingEvent(
        event: SourcingEvent & { issuer?: string; signature?: string },
      ) {
        if (event.issuer !== 'issuer' || event.signature !== 'signature') {
          return null;
        }

        return event;
      },
    },
    {
      initialize({ addEvent }) {
        setTimeout(() => {
          addEvent({
            id: '',
            causationId: '',
            correlationId: '',
            createdAt: new Date(),
            ...updateEntity('Updated signed'),
            issuer: 'issuer',
            signature: 'signature',
          } as SourcingEvent);
        }, 100);
        setTimeout(() => {
          addEvent({
            id: '',
            causationId: '',
            correlationId: '',
            createdAt: new Date(),
            ...updateEntity('Updated not signed'),
            issuer: 'failure',
            signature: 'signature',
          } as SourcingEvent);
        }, 200);
      },
    },
  ],
});

await source.publishEvent({ event: createEntity('1') });

await new Promise((resolve) => setTimeout(resolve, 300));

console.log('instance', source.getInstance(models.Entity, '1').name); // Updated
