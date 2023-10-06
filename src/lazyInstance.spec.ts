import cuid from 'cuid';
import { describe, expect, it, vi } from 'vitest';
import { EventStore, Model, SourcingEvent } from './index.js';
import { lazyInstance, registerModel } from './lazyInstance.js';

// Define a test model
@registerModel
class Test extends Model {
  readonly kind = 'Test';
  instanceId = cuid();

  constructor(public id: string) {
    super();
  }
}

declare module './index.js' {
  interface RegisterModels {
    Test: typeof Test;
  }
}

const mockGameEvents = vi.fn(async () => [] as SourcingEvent[]);

EventStore.setupStore({
  getEvents: mockGameEvents,
  storeEvent: vi.fn(),
});

describe('lazyInstance', () => {
  it('should return a lazy instance of the specified model', async () => {
    const instance = lazyInstance('Test', 'id1');
    expect(instance).toHaveProperty('id', 'id1');
    expect(instance.$resolve).toBeInstanceOf(Promise);
    const resolvedInstance = await instance.$resolve;
    expect(resolvedInstance).toBeInstanceOf(Test);
    expect(resolvedInstance).toHaveProperty('id', 'id1');
  });

  it('should return the same lazy instance for multiple calls with the same arguments', async () => {
    const instance1 = lazyInstance('Test', 'id3');
    const instance2 = lazyInstance('Test', 'id3');
    expect(instance1.instanceId).toBe(instance2.instanceId);
    const resolvedInstance1 = await instance1.$resolve;
    const resolvedInstance2 = await instance2.$resolve;
    expect(resolvedInstance1).toBe(resolvedInstance2);
  });

  it('should return different lazy instances for different arguments', async () => {
    const instance1 = lazyInstance('Test', 'id4');
    const instance2 = lazyInstance('Test', 'id5');
    expect(instance1.instanceId).not.toBe(instance2.instanceId);
    const resolvedInstance1 = await instance1.$resolve;
    const resolvedInstance2 = await instance2.$resolve;
    expect(resolvedInstance1).not.toBe(resolvedInstance2);
    expect(resolvedInstance1).toBeInstanceOf(Test);
    expect(resolvedInstance1).toHaveProperty('id', 'id4');
    expect(resolvedInstance2).toBeInstanceOf(Test);
    expect(resolvedInstance2).toHaveProperty('id', 'id5');
  });

  it('should return a lazy instance with properties that can be accessed synchronously', async () => {
    const instance = lazyInstance('Test', 'id6');
    expect(instance).toHaveProperty('id', 'id6');
    expect(instance).toHaveProperty('lastEvent');
    expect(instance.lastEvent).toBeInstanceOf(Promise);
    const resolvedInstance = await instance.$resolve;
    expect(resolvedInstance).toHaveProperty('lastEvent');
    expect(resolvedInstance.lastEvent).toBeUndefined();
  });

  it('should return a lazy instance with properties that can be accessed asynchronously', async () => {
    const instance = lazyInstance('Test', 'id7');
    expect(instance).toHaveProperty('id', 'id7');
    expect(instance).toHaveProperty('lastEvent');
    expect(instance.lastEvent).toBeInstanceOf(Promise);
    const resolvedInstance = await instance.$resolve;
    expect(resolvedInstance).toHaveProperty('lastEvent');
    expect(await instance.lastEvent).toBeUndefined();
  });
});
