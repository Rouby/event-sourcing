import { Model, ModelKind, getInstance } from './index.js';
import { RegisterModels } from './register.js';

const register: Record<string, new (...ids: string[]) => Model> = {};

export function registerModel(
  constructor: new (...ids: string[]) => Model,
  context?: ClassDecoratorContext,
) {
  register[constructor.name] = constructor;
}

const cache = new Map<string, Model>();

export function lazyInstance<
  TKind extends ModelKind,
  TModel extends abstract new (...args: any) => any = RegisterModels[TKind],
>(kind: TKind, ...ids: ConstructorParameters<TModel>) {
  const Model = register[kind];
  const key = Model.name + ':' + ids.join(':');
  return new Proxy<Promised<InstanceType<TModel>>>(
    cache.get(key) ??
      (cache.set(key, new Model(...(ids as any))).get(key)! as any),
    {
      get: (target, prop: (keyof TModel & string) | '$resolve') => {
        if (prop === '$resolve') {
          return getInstance(Model, ...(ids as any));
        }
        if (prop === 'id' || prop.endsWith?.('Id')) {
          return target[prop];
        }
        return getInstance(Model, ...(ids as any)).then(
          (d) => (d as any)?.[prop],
        );
      },
    },
  );
}

export type Promised<T extends {}> = {
  [P in keyof T]: P extends 'id'
    ? T[P]
    : P extends `${string}Id`
    ? T[P]
    : Promise<T[P]>;
} & { $resolve: Promise<T> };
