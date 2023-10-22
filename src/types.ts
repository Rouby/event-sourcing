export interface RegisterEvents {
  // event: ReturnType<typeof eventFn>;
}

export interface RegisterModels {
  // Model: typeof Model;
}

export type RegisteredEvent = RegisterEvents[keyof RegisterEvents] extends never
  ? { type: string; payload: any }
  : RegisterEvents[keyof RegisterEvents];

export type RegisteredModels =
  RegisterModels[keyof RegisterModels] extends never
    ? {}
    : { [P in keyof RegisterModels]: RegisterModels[P] };

export interface AdditionalEventProps {}

export type SourcingEvent = RegisteredEvent & {
  id: string;
  causationId: string;
  correlationId: string;
  createdAt: Date;
  verified?: boolean;
} & AdditionalEventProps;

export type ModelKind = keyof RegisterModels;
