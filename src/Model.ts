import { RegisterEvents, SourcingEvent } from './index.js';

export abstract class Model {
  abstract get kind(): string;

  lastEvent?: Date;

  protected applyEvent(event: SourcingEvent) {}
}

export function applyEvent<
  TEventType extends keyof RegisterEvents,
  TEvent = RegisterEvents[TEventType],
>(
  eventType: TEventType,
  accessor: TEvent extends { payload: infer TPayload }
    ? keyof TPayload | ((payload: TPayload) => any)
    : never,
) {
  return (target: any, context?: ClassFieldDecoratorContext) => {
    if (!(target instanceof Model)) {
      throw new Error('applyEvent decorator can only be used on Model classes');
    }

    // @ts-expect-error
    const originalApply = target.applyEvent;
    // @ts-expect-error
    target.applyEvent = function (event) {
      if (event.type === eventType) {
        const payload = event.payload;

        if (typeof accessor === 'function') {
          // @ts-expect-error
          this[context] = accessor(payload);
        } else {
          // @ts-expect-error
          this[context] = payload[accessor];
        }
      }

      originalApply.call(this, event);
    };
  };
}