import { Model } from './Model.js';
import { getInstance } from './getInstance.js';
import { subscribeToEvents } from './subscriptions.js';

export function subscribeInstance<TIds extends string[], TModel extends Model>(
  next: (d: TModel) => void,
  model: new (...ids: TIds) => TModel,
  ...ids: TIds
) {
  const promisedInstance = getInstance(model, ...ids).then((instance) => {
    next(instance);
    return instance;
  });

  return subscribeToEvents(async (event) => {
    const instance = await promisedInstance;

    const prev = JSON.stringify(instance);
    // @ts-expect-error
    const handled = instance.applyEvent(event);

    if (handled || prev !== JSON.stringify(instance)) {
      next(instance);
    }
  });
}
