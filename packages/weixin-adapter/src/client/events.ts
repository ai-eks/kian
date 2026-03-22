export type EventHandler<TEvent> = (event: TEvent) => void;

export class TypedEventEmitter<TEvents extends object> {
  private readonly handlers = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  on<TKey extends keyof TEvents>(eventName: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const handlers = this.handlers.get(eventName) ?? new Set<EventHandler<unknown>>();
    handlers.add(handler as EventHandler<unknown>);
    this.handlers.set(eventName, handlers);
    return () => this.off(eventName, handler);
  }

  off<TKey extends keyof TEvents>(eventName: TKey, handler: EventHandler<TEvents[TKey]>): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.delete(handler as EventHandler<unknown>);
    if (handlers.size === 0) {
      this.handlers.delete(eventName);
    }
  }

  protected emit<TKey extends keyof TEvents>(eventName: TKey, event: TEvents[TKey]): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      (handler as EventHandler<TEvents[TKey]>)(event);
    }
  }
}
