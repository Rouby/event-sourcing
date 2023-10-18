import { SourcingEvent } from '../types.js';

export interface Plugin<TEvent extends SourcingEvent> {
  initialize?(es: {
    rehydrate: (events: SourcingEvent[]) => void;
    addEvent: (event: SourcingEvent) => void;
  }): void;

  prepareEventBeforePublishing?(event: TEvent): Promise<TEvent>;

  publishEvent?(event: TEvent): Promise<void>;

  beforeAddingEvent?(event: TEvent): Promise<TEvent | null>;

  afterAddingEvent?(event: TEvent): TEvent;

  afterRehydration?(events: SourcingEvent[]): void;
}
