import { Queue } from 'async-await-queue';
import cuid from 'cuid';
import { logger } from './EventStore.js';
import { handleEffects } from './handleEffects.js';
import { EventStore, RegisteredEvent } from './index.js';

export const eventQueue = new Queue();

export async function publishEvent<TEvent extends RegisteredEvent>({
  event,
  trigger,
  sign,
}: {
  event: TEvent;
  trigger?: { id: string; correlationId: string };
  sign?: boolean;
}) {
  const eventId = cuid();
  const sourcingEvent = await EventStore.storeEvent(
    {
      id: eventId,
      causationId: trigger?.id ?? eventId,
      correlationId: trigger?.correlationId ?? eventId,
      createdAt: new Date(),
      ...event,
    },
    sign,
  );

  logger.info('Event %s published', sourcingEvent.type);

  eventQueue.run(() => handleEffects(sourcingEvent));

  return sourcingEvent;
}
