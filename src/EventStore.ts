import { Model } from './Model.js';
import { SourcingEvent } from './register.js';

let eventFn: (since?: Date) => Promise<SourcingEvent[]>;
let storeFn: (event: SourcingEvent) => Promise<SourcingEvent>;

export async function getEvents(model: Model) {
  return eventFn(model.lastEvent);
}

export async function storeEvent<TEvent extends SourcingEvent>(event: TEvent) {
  return storeFn(event);
}

export let logger = {
  info: (...args: any[]) => {},
  log: (...args: any[]) => {},
  error: (...args: any[]) => {},
  debug: (...args: any[]) => {},
  warn: (...args: any[]) => {},
};

export function setupStore(config: {
  getEvents: (since?: Date) => Promise<SourcingEvent[]>;
  storeEvent: (event: SourcingEvent) => Promise<SourcingEvent>;
  logger?: typeof logger;
}) {
  eventFn = config.getEvents;
  storeFn = config.storeEvent;
  if (config.logger) logger = config.logger;
}
