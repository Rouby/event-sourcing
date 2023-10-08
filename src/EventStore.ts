import { Model } from './Model.js';
import { SourcingEvent } from './register.js';

type Signed = { issuer: string; signature: string };

let eventFn: (since?: Date) => Promise<(SourcingEvent & Partial<Signed>)[]>;
let storeFn: (
  event: SourcingEvent & Partial<Signed>,
) => Promise<SourcingEvent & Partial<Signed>>;
let signFn: (event: SourcingEvent) => SourcingEvent & Signed;
let verifyFn: (event: SourcingEvent & Signed) => boolean;

export async function getEvents(model: Model) {
  const events = await eventFn(model.lastEvent);
  return events.filter((event) =>
    event.signature ? verifyFn(event as any) : true,
  );
}

export async function storeEvent<TEvent extends SourcingEvent>(
  event: TEvent,
  sign?: boolean,
) {
  return storeFn(sign ? signFn(event) : event);
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

export function setupSigning(config: {
  signEvent: (event: SourcingEvent) => SourcingEvent & Signed;
  verifyEvent: (event: SourcingEvent & Signed) => boolean;
}) {
  signFn = config.signEvent;
  verifyFn = config.verifyEvent;
}
