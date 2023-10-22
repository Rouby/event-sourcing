import type { EventSourcing } from '../EventSourcing.js';
import type { SourcingEvent } from '../types.js';

export interface Plugin<TEvent extends SourcingEvent> {
  initialize?(
    this: EventSourcing,
    es: {
      rehydrate: (
        events: SourcingEvent[],
        replacePreviousEvents?: boolean,
        clearSubscribers?: boolean,
      ) => Promise<void>;
      addEvent: (event: SourcingEvent) => void;
    },
  ): void;

  prepareEventBeforePublishing?(
    this: EventSourcing,
    event: TEvent,
  ): Promise<TEvent | null>;

  publishEvent?(this: EventSourcing, event: TEvent): Promise<void>;

  beforeAddingEvent?(
    this: EventSourcing,
    event: TEvent,
  ): Promise<TEvent | null>;

  afterAddingEvent?(this: EventSourcing, event: TEvent): TEvent;

  afterRehydration?(
    this: EventSourcing,
    events: SourcingEvent[],
  ): Promise<void>;
}
