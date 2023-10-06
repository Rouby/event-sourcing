import { RegisteredEvent, SourcingEvent } from './index.js';

export type EffectFn = (
  event: SourcingEvent,
  publishEvent: <TActual extends RegisteredEvent>(event: TActual) => TActual,
) => Promise<void | (() => void)>;

export const effects = [] as EffectFn[];

export function registerEffect(effect: EffectFn) {
  effects.push(effect);
}
