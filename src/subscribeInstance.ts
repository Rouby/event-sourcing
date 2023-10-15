import { Model } from './Model.js';
import { getInstance } from './getInstance.js';
import { subscribeToEvents } from './subscriptions.js';

const subscribersPerModel = new Map<
  any,
  Map<string, { unsub: () => void; handler: ((d: any) => void)[] }>
>();

export function subscribeInstance<TIds extends string[], TModel extends Model>(
  next: (d: TModel) => void,
  model: new (...ids: TIds) => TModel,
  ...ids: TIds
) {
  if (!subscribersPerModel.has(model)) {
    subscribersPerModel.set(model, new Map());
  }

  const key = ids.join(':');

  if (!subscribersPerModel.get(model)!.has(key)) {
    const promisedInstance = getInstance(model, ...ids).then((instance) => {
      next(instance);
      return instance;
    });

    const unsub = subscribeToEvents(async (event) => {
      const instance = await promisedInstance;

      const prev = JSON.stringify(instance);
      // @ts-expect-error
      const handled = instance.applyEvent(event);

      if (handled || prev !== JSON.stringify(instance)) {
        subscribersPerModel
          .get(model)!
          .get(key)!
          .handler.forEach((next) => next(instance));
      }
    });

    subscribersPerModel.get(model)!.set(key, { unsub, handler: [next] });
  } else {
    subscribersPerModel.get(model)!.get(key)!.handler.push(next);
  }

  return () => {
    const index = subscribersPerModel
      .get(model)!
      .get(key)!
      .handler.indexOf(next);

    if (index !== -1) {
      subscribersPerModel.get(model)!.get(key)!.handler.splice(index, 1);

      if (subscribersPerModel.get(model)!.get(key)!.handler.length === 0) {
        subscribersPerModel.get(model)!.get(key)!.unsub();
        subscribersPerModel.get(model)!.delete(key);
      }
    }
  };
}
