import { RegisterEvents, SourcingEvent } from './types.js';

export abstract class Model {
  abstract get kind(): string;

  lastEvent?: Date;

  /** @internal */
  applyEvent(event: SourcingEvent): boolean | void {}
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
