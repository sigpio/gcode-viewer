type TimerHandler = (...args: unknown[]) => void;

const globalTimer =
  typeof globalThis !== 'undefined' && typeof globalThis.setTimeout === 'function'
    ? globalThis
    : {
        setTimeout: (_handler: TimerHandler, _delay?: number) => {
          void _handler;
          void _delay;
          throw new Error('Timers non disponibili in questo contesto.');
        }
      };

export const setImmediate = (handler: TimerHandler, ...args: unknown[]): number =>
  globalTimer.setTimeout(() => handler(...args), 0) as unknown as number;

export default {
  setImmediate
};
