import cuid from 'cuid';
import { Model } from './Model.js';
import { Plugin } from './plugins/index.js';
import { RegisteredEvent, SourcingEvent } from './types.js';

export class EventSourcing {
  private readonly events: SourcingEvent[] = [];
  private readonly subscribers: ((event: SourcingEvent) => void)[] = [];
  private readonly plugins: Plugin<SourcingEvent>[];

  constructor(options?: { plugins?: Plugin<SourcingEvent>[] }) {
    this.plugins = options?.plugins || [];
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        plugin.initialize({
          addEvent: async (event) => {
            let eventOrAbort: typeof event | null = event;
            for (const plugin of this.plugins) {
              if (plugin.beforeAddingEvent) {
                eventOrAbort = await plugin.beforeAddingEvent(event);
                if (eventOrAbort === null) {
                  break;
                }
              }
            }

            if (eventOrAbort) {
              const event = eventOrAbort;
              this.events.push(event);
              this.subscribers.forEach((subscriber) => subscriber(event));

              for (const plugin of this.plugins) {
                if (plugin.afterAddingEvent) {
                  plugin.afterAddingEvent(event);
                }
              }
            }
          },
        });
      }
    }
  }

  async publishEvent<TEvent extends RegisteredEvent>({
    event,
    trigger,
  }: {
    event: TEvent;
    trigger?: { id: string; correlationId: string };
  }): Promise<void> {
    const eventId = cuid();
    let sourcingEvent: SourcingEvent = {
      id: eventId,
      causationId: trigger?.id ?? eventId,
      correlationId: trigger?.correlationId ?? eventId,
      createdAt: new Date(),
      ...event,
    };

    this.events.push(sourcingEvent);
    this.subscribers.forEach((subscriber) => subscriber(sourcingEvent));

    for (const plugin of this.plugins) {
      if (plugin.prepareEventBeforePublishing) {
        sourcingEvent = await plugin.prepareEventBeforePublishing(
          sourcingEvent,
        );
      }
    }
    for (const plugin of this.plugins) {
      if (plugin.publishEvent) {
        await plugin.publishEvent(sourcingEvent);
      }
    }
  }

  getInstance<TModel extends Model, TIds extends any[]>(
    model: new (...ids: TIds) => TModel,
    ...ids: TIds
  ) {
    const instance = new model(...ids);

    const lastEventIdx = instance.lastEvent
      ? this.events.findIndex(
          (event) =>
            event.createdAt.getTime() === instance.lastEvent?.getTime(),
        )
      : -1;

    this.events.slice(lastEventIdx + 1).forEach((event) => {
      instance.applyEvent(event);
    });

    return instance;
  }

  subscribeInstance<TModel extends Model>(
    instance: TModel,
    onUpdate: () => void,
  ) {
    const onEvent = (event: SourcingEvent) => {
      const previous = JSON.stringify(instance);
      const applied = instance.applyEvent(event);
      if (applied || JSON.stringify(instance) !== previous) {
        onUpdate();
      }
    };

    this.subscribers.push(onEvent);

    return () => {
      const idx = this.subscribers.indexOf(onEvent);
      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }
}