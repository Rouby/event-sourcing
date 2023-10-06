export function createEntity() {
  return {
    type: 'createEntity' as const,
    version: 1,
    payload: {
      name: 'New Entity',
      random: 'r',
    },
  };
}

declare module '../../src' {
  interface RegisterEvents {
    createEntity: ReturnType<typeof createEntity>;
  }
}

export function updateEntity() {
  return {
    type: 'updateEntity' as const,
    version: 1,
    payload: {
      name: 'New Entity',
    },
  };
}

declare module '../../src' {
  interface RegisterEvents {
    updateEntity: ReturnType<typeof updateEntity>;
  }
}
