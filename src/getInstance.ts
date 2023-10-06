import * as EventStore from './EventStore.js';
import { Model } from './Model.js';

const cache = new Map<string, Promise<Model>>();

export function getInstance<TIds extends string[], TModel extends Model>(
  model: new (...ids: TIds) => TModel,
  ...ids: TIds
) {
  const key = model.name + ':' + ids.join(':');

  if (!cache.has(key)) {
    cache.set(key, Promise.resolve(new model(...ids)));
  }

  const promisedInstance = cache.get(key)!.then(async (instance) => {
    const events = await EventStore.getEvents(instance);

    events.forEach((event) => {
      // @ts-expect-error
      instance.applyEvent(event);
    });

    if (events.length > 0) {
      instance.lastEvent = events.at(-1)?.createdAt;
    }

    return instance;
  });
  cache.set(key, promisedInstance);

  return promisedInstance as Promise<TModel>;
}
