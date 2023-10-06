import { effects } from './EffectStore.js';
import { RegisteredEvent, SourcingEvent } from './index.js';
import { publishEvent } from './publishEvent.js';

export async function handleEffects(event: SourcingEvent) {
  for (const effect of effects) {
    const collector: RegisteredEvent[] = [];
    effect(event, (event) => {
      collector.push(event);
      return event;
    }).then(async (fn) => {
      for (const collectedEvent of collector) {
        await publishEvent({ event: collectedEvent, trigger: event });
      }
      fn?.();
    });
  }
}
