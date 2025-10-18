type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private readonly listeners = new Map<string, Listener[]>();

  on(event: string, handler: Listener): this {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  once(event: string, handler: Listener): this {
    const onceWrapper: Listener = (...args) => {
      this.off(event, onceWrapper);
      handler(...args);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, handler: Listener): this {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return this;
    }
    this.listeners.set(
      event,
      handlers.filter((registered) => registered !== handler)
    );
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) {
      return false;
    }
    handlers.forEach((handler) => handler(...args));
    return true;
  }
}

const events = {
  EventEmitter
};

export default events;
