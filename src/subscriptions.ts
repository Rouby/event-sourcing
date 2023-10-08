import { SourcingEvent } from './register.js';

const subscriptions = [] as ((event: SourcingEvent) => void)[];

export function subscribeToEvents(handler: (event: SourcingEvent) => void) {
  subscriptions.push(handler);
  return () => {
    const index = subscriptions.indexOf(handler);
    if (index !== -1) subscriptions.splice(index, 1);
  };
}

export function triggerSubscriptions(event: SourcingEvent) {
  for (const handler of subscriptions) {
    handler(event);
  }
}
