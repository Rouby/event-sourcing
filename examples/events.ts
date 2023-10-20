export function createEntity(id: string) {
  return {
    type: 'createEntity' as const,
    version: 1,
    payload: {
      id,
      name: 'New Entity',
      random: 'r',
    },
  };
}

export function updateEntity(name: string) {
  return {
    type: 'updateEntity' as const,
    version: 1,
    payload: {
      name,
    },
  };
}

export function addOtherEntity(id: string, parent: string, name: string) {
  return {
    type: 'addOtherEntity' as const,
    version: 1,
    payload: {
      id,
      parent,
      name,
    },
  };
}

export function updateOtherEntity(id: string, name: string) {
  return {
    type: 'updateOtherEntity' as const,
    version: 1,
    payload: {
      id,
      name,
    },
  };
}

declare module '../src' {
  interface RegisterEvents {
    createEntity: ReturnType<typeof createEntity>;
    updateEntity: ReturnType<typeof updateEntity>;
    addOtherEntity: ReturnType<typeof addOtherEntity>;
    updateOtherEntity: ReturnType<typeof updateOtherEntity>;
  }
}
