import cuid from 'cuid';
import { Model } from './Model.js';
import { Plugin } from './plugins/index.js';
import {
  RegisterEvents,
  RegisteredEvent,
  RegisteredModels,
  SourcingEvent,
} from './types.js';

export class EventSourcing {
  public readonly events: SourcingEvent[] = [];
  private readonly subscribers: ((
    event: SourcingEvent,
    rehydrating: boolean,
  ) => void)[] = [];
  private readonly models: RegisteredModels;
  private readonly plugins: Plugin<SourcingEvent>[];
  private readonly logger: {
    trace: (...args: any[]) => void;
  };
  private rehydrating = false;

  constructor(options: {
    models: RegisteredModels;
    plugins?: Plugin<SourcingEvent>[];
    logger?: {
      trace: (...args: any[]) => void;
    };
  }) {
    this.models = options.models;
    this.plugins = options.plugins ?? [];
    this.logger = options.logger ?? {
      trace: () => {},
    };
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        plugin.initialize.call(this, {
          rehydrate: (events, replacePreviousEvents = false) => {
            this.events.splice(
              0,
              this.events.length,
              ...[...(replacePreviousEvents ? [] : this.events), ...events]
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .filter(
                  (event, idx, events) =>
                    events.findIndex((e) => e.id === event.id) === idx,
                ),
            );
            for (const plugin of this.plugins) {
              if (plugin.afterRehydration) {
                plugin.afterRehydration.call(this, this.events);
              }
            }
            this.logger.trace({}, 'rehydrate');
            this.rehydrating = true;
            this.events.forEach((event) => {
              this.subscribers.forEach((subscriber) =>
                subscriber(event, this.rehydrating),
              );
            });
            this.rehydrating = false;
          },
          addEvent: async (event) => {
            let eventOrAbort: typeof event | null = event;
            for (const plugin of this.plugins) {
              if (plugin.beforeAddingEvent) {
                eventOrAbort = await plugin.beforeAddingEvent.call(this, event);
                if (eventOrAbort === null) {
                  return;
                }
              }
            }

            if (!this.events.some((evt) => evt.id === eventOrAbort?.id)) {
              const event = eventOrAbort;

              this.logger.trace({ event }, 'addEvent');

              this.events.push(event);
              this.subscribers.forEach((subscriber) =>
                subscriber(event, this.rehydrating),
              );

              for (const plugin of this.plugins) {
                if (plugin.afterAddingEvent) {
                  plugin.afterAddingEvent.call(this, event);
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
    if (this.rehydrating) {
      this.logger.trace({ event }, 'publishEvent - ignored while rehydrating');
      return;
    }

    const eventId = cuid();
    let sourcingEvent: SourcingEvent | null = {
      id: eventId,
      causationId: trigger?.id ?? eventId,
      correlationId: trigger?.correlationId ?? eventId,
      createdAt: new Date(),
      ...event,
    };

    for (const plugin of this.plugins) {
      if (plugin.prepareEventBeforePublishing) {
        sourcingEvent = await plugin.prepareEventBeforePublishing.call(
          this,
          sourcingEvent,
        );
        if (sourcingEvent === null) {
          this.logger.trace({ event }, 'publishEvent - ignored by plugin');
          return;
        }
      }
    }

    {
      const event = sourcingEvent;
      this.logger.trace({ event }, 'publishEvent');

      this.events.push(event);
      this.subscribers.forEach((subscriber) =>
        subscriber(event, this.rehydrating),
      );

      for (const plugin of this.plugins) {
        if (plugin.publishEvent) {
          await plugin.publishEvent.call(this, event);
        }
      }
    }
  }

  getInstance<TModel extends Model, TIds extends any[]>(
    model: new (...ids: TIds) => TModel,
    ...ids: TIds
  ) {
    const instance = new model(...ids);
    instance.eventSourcing = this;

    const lastEventIdx = instance.lastEvent
      ? this.events.findIndex(
          (event) =>
            event.createdAt.getTime() === instance.lastEvent?.getTime(),
        )
      : -1;

    const eventsToApply = this.events.slice(lastEventIdx + 1);

    eventsToApply.forEach((event) => {
      instance.applyEvent(event);
      instance.lastEvent = event.createdAt;
    });

    this.logger.trace({ lastEvent: instance.lastEvent }, 'getInstance');

    return instance;
  }

  getInstanceInTime<TModel extends Model, TIds extends any[]>(
    tillTime: Date,
    model: new (...ids: TIds) => TModel,
    ...ids: TIds
  ) {
    const instance = new model(...ids);
    instance.eventSourcing = this;

    const lastEventIdx = instance.lastEvent
      ? this.events.findIndex(
          (event) =>
            event.createdAt.getTime() === instance.lastEvent?.getTime(),
        )
      : -1;

    const eventsToApply = this.events
      .slice(lastEventIdx + 1)
      .filter((event) => event.createdAt.getTime() <= tillTime.getTime());

    eventsToApply.forEach((event) => {
      instance.applyEvent(event);
      instance.lastEvent = event.createdAt;
    });

    this.logger.trace(
      { tillTime, lastEvent: instance.lastEvent },
      'getInstanceInTime',
    );

    return instance;
  }

  getInstanceInTimeFromName<
    TModel extends keyof RegisteredModels,
    TIds extends RegisteredModels[TModel] extends new (
      ...args: infer TArgs
    ) => any
      ? TArgs
      : never,
  >(parent: { lastEvent?: Date }, model: TModel, ...ids: TIds) {
    const instance = new (this.models[model] as new (...ids: any) => Model)(
      ...ids,
    );
    instance.eventSourcing = this;

    this.logger.trace({ model }, 'getInstanceInTimeFromName');

    return new Proxy(instance, {
      get: (target, prop) => {
        if (
          typeof prop === 'string' &&
          (prop === 'id' || prop === 'kind' || prop.endsWith('Id'))
        ) {
          // ids are always present and never change!
          return target[prop as keyof typeof target];
        }

        this.logger.trace({ model, prop }, 'getInstanceInTimeFromName - get');

        return this.getInstanceInTime(
          parent.lastEvent ?? new Date(0),
          this.models[model] as new (...ids: any) => Model,
          ...ids,
        )[prop as keyof typeof target];
      },
    }) as InstanceType<RegisteredModels[TModel]>;
  }

  subscribeInstance<TModel extends Model>(
    instance: TModel,
    onUpdate: (event: SourcingEvent, rehydrating: boolean) => void,
  ) {
    this.logger.trace({}, 'subscribeInstance');

    return this.subscribe((event: SourcingEvent, rehydrating) => {
      instance.applyEvent(event);
      instance.lastEvent = event.createdAt;
      onUpdate(event, rehydrating);
    });
  }

  subscribe(onEvent: (event: SourcingEvent, rehydrating: boolean) => void) {
    this.subscribers.push(onEvent);

    this.logger.trace({}, 'subscribe');

    return () => {
      const idx = this.subscribers.indexOf(onEvent);
      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  promised(type: keyof RegisterEvents) {
    return new Promise<SourcingEvent>((resolve) => {
      const unsubscribe = this.subscribe((event) => {
        if (event.type === type) {
          unsubscribe();
          resolve(event);
        }
      });
    });
  }
}
