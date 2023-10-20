import type { EventSourcing } from './EventSourcing.js';
import { RegisterEvents, RegisteredModels, SourcingEvent } from './types.js';

export abstract class Model {
  abstract get kind(): string;

  lastEvent?: Date;
  eventSourcing!: EventSourcing;

  /** @internal */
  applyEvent(event: SourcingEvent): boolean | void {}

  getInstance<
    TModel extends keyof RegisteredModels,
    TIds extends RegisteredModels[TModel] extends new (
      ...args: infer TArgs
    ) => any
      ? TArgs
      : never,
  >(model: TModel, ...ids: TIds) {
    return this.eventSourcing.getInstanceInTimeFromName<TModel, TIds>(
      this.lastEvent ?? new Date(0),
      model,
      ...ids,
    );
  }
}

export function applyEvent<
  TEventType extends keyof RegisterEvents,
  TEvent = RegisterEvents[TEventType],
>(
  eventType: TEventType,
  accessor: TEvent extends { payload: infer TPayload }
    ? keyof TPayload | ((payload: TPayload) => any)
    : never,
  condition?: (event: TEvent & SourcingEvent) => boolean,
) {
  return (target: any, context?: ClassFieldDecoratorContext) => {
    if (!(target instanceof Model)) {
      throw new Error('applyEvent decorator can only be used on Model classes');
    }

    const originalApply = target.applyEvent;
    target.applyEvent = function (event) {
      let handled = false;
      if (
        event.type === eventType &&
        (!condition || condition.call(this, event as TEvent & SourcingEvent))
      ) {
        const payload = event.payload;

        if (typeof accessor === 'function') {
          // @ts-expect-error
          this[context] = accessor(payload);
        } else {
          // @ts-expect-error
          this[context] = payload[accessor];
        }
        handled = true;
      }

      return originalApply.call(this, event) || handled;
    };
  };
}
