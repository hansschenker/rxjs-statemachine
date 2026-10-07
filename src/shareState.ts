import {
  ReplaySubject,
  share,
  type MonoTypeOperatorFunction,
} from 'rxjs';

/**
 * Share one state-stream execution and remember its latest value.
 *
 * Sharing policy:
 * - reset after error
 * - retain the final state after completion
 * - keep the shared execution alive when subscriber count reaches zero
 *
 * The upstream reducer streams therefore define the machine lifetime.
 * Complete/cancel those streams when the machine should stop.
 */
export const shareState =
  <T>(): MonoTypeOperatorFunction<T> =>
    share<T>({
      connector: () => new ReplaySubject<T>(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    });
