# @rouby/event-sourcing

This is an event sourcing library designed to provide a simple and efficient way to handle event sourcing in your applications.

## Installation

```bash
npm install @rouby/event-sourcing
```

## Usage

The idea is to define models that represent your domain and then apply events to them. The events are then stored in an event store and can be replayed to rebuild the model.

### Events

To declare events you simply create functions that return an object with the event data.

```typescript
export function createEntity(id: string) {
  return {
    type: 'createEntity' as const,
    version: 1,
    payload: {
      id,
      name: 'New Entity',
    },
  };
}

// to add typescript support, we can declare the event type
declare module '@rouby/event-sourcing' {
  interface RegisterEvents {
    createEntity: ReturnType<typeof createEntity>;
  }
}
```

### Models

To declare models you can extend the `Model` class and implement the `applyEvent` method. You can also use the `@applyEvent` decorator to define event handlers.

```typescript
import { Model, applyEvent } from '@rouby/event-sourcing';

export class Entity extends Model {
  kind = 'Entity' as const;

  // This decorator will automatically apply the event to the model
  @applyEvent('createEntity', 'name', matchesId)
  name = '';

  // The constructor should specify the keys needed to uniquely identify an instance of this model
  constructor(public id: string) {
    super();
  }

  applyEvent(event: SourcingEvent) {
    // This is an alternative to using the @applyEvent decorator
    if (event.type === 'createEntity' && event.payload.id === this.id) {
      this.name = event.payload.name;
    }
  }
}

function matchesId(this: Entity, e: { payload: { id: string } }) {
  return e.payload.id === this.id;
}
```

### Bringing it together

```typescript
import { EventSourcing } from '@rouby/event-sourcing';
import { createEntity } from '../events';
import * as models from '../models';

const source = new EventSourcing({ models });

await source.publishEvent({ event: createEntity('1') });

console.log('instance', source.getInstance(models.Entity, '1').name); //? New Entity
```

### Examples

For basic examples on how to use this library see the [examples](./examples) directory.

You can define your own event sourcing models by extending the `Model` class and implementing the `applyEvent` method or utilizing the `@applyEvent` decorator.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```

```
