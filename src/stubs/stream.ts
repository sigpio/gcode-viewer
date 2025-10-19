type Listener = (...args: unknown[]) => void;

class EventEmitter {
  private readonly listeners = new Map<string, Listener[]>();

  on(event: string, handler: Listener): this {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
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

export class Transform extends EventEmitter {
  constructor(_options?: unknown) {
    super();
    void _options;
  }

  push(_chunk: unknown): void {
    // No-op stub
    void _chunk;
  }
}

export class Readable extends EventEmitter {
  private readonly chunks: unknown[] = [];

  push(chunk: unknown): void {
    this.chunks.push(chunk);
    if (chunk === null) {
      this.emit('end');
    }
  }

  pipe<T>(destination: T): T {
    return destination;
  }
}

const stream = {
  Readable
};

export default stream;
