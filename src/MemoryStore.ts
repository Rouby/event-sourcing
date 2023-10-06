import { SourcingEvent } from './index.js';

const events = [] as SourcingEvent[];

export async function getEvents(since?: Date) {
  const ts = since?.getTime();
  return ts ? events.filter((e) => e.createdAt.getTime() >= ts) : events;
}

export async function storeEvent<TEvent extends SourcingEvent>(event: TEvent) {
  events.push(event);
  return event;
}
