import { Model } from './Model.js';
import { SourcingEvent } from './register.js';

type Signed = { issuer: string; signature: string };

let eventFn: (since?: Date) => Promise<(SourcingEvent & Partial<Signed>)[]>;
let storeFn: (
  event: SourcingEvent & Partial<Signed>,
) => Promise<SourcingEvent & Partial<Signed>>;
let signFn: (event: SourcingEvent) => Promise<SourcingEvent & Signed>;
let verifyFn: (event: SourcingEvent & Signed) => Promise<boolean>;

export async function getEvents(model: Model) {
  if (!eventFn) logger.warn('EventStore not setup');

  const events = eventFn ? await eventFn(model.lastEvent) : [];
  const verifiedEvents = await Promise.all(
    events.map(async (event) =>
      event.signature
        ? (await verifyFn(event as any))
          ? [{ ...event, verified: true }]
          : []
        : [{ ...event, verified: false }],
    ),
  ).then((events) => events.flat());
  return verifiedEvents;
}

export async function storeEvent<TEvent extends SourcingEvent>(
  event: TEvent,
  sign?: boolean,
) {
  if (!storeFn) logger.error('EventStore not setup');

  return storeFn(sign ? await signFn(event) : event);
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
  sign: (event: SourcingEvent) => Promise<SourcingEvent & Signed>;
  verify: (event: SourcingEvent & Signed) => Promise<boolean>;
}) {
  signFn = config.sign;
  verifyFn = config.verify;
}
