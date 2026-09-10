import { Observable, Subject } from "rxjs";
import { scan, shareReplay, startWith } from "rxjs/operators";

export type Reducer<State, Action> = (
  state: State,
  action: Action
) => State;

export type Dispatcher<Action> = (action: Action) => void;

export type ActionStateMachine<State, Action> = {
  /**
   * Public action stream.
   *
   * This is the read side of the private Subject<Action> input port.
   */
  readonly actions$: Observable<Action>;

  /**
   * Remembered state stream.
   *
   * It emits the initial state immediately, then every reduced state after each action.
   * Late subscribers receive the latest remembered state because of shareReplay(1).
   */
  readonly state$: Observable<State>;

  /**
   * Push one action into the machine.
   */
  readonly dispatch: Dispatcher<Action>;

  /**
   * Complete the action input port.
   *
   * Completion means the producer side declares that no more actions will arrive.
   */
  readonly complete: () => void;

  /**
   * Error the action input port.
   *
   * Error means the producer side declares abnormal termination of the action stream.
   */
  readonly error: (reason: unknown) => void;
};

export type CreateActionStateMachineConfig<State, Action> = {
  /**
   * The first state of the machine.
   */
  readonly initialState: State;

  /**
   * Pure state transition function.
   *
   * previous State + incoming Action -> next State
   */
  readonly reducer: Reducer<State, Action>;
};

/**
 * Create a generic RxJS Action State Machine.
 *
 * Pattern:
 *
 * Subject<Action> as Action Input Port
 * Observable<Action> as Action Stream
 * scan(reducer, initialState) as State Reducer
 * shareReplay(1) as Remembered State
 */
export const createActionStateMachine = <State, Action>(
  config: CreateActionStateMachineConfig<State, Action>
): ActionStateMachine<State, Action> => {
  const actionSubject = new Subject<Action>();

  const actions$ = actionSubject.asObservable();

  const state$ = actions$.pipe(
    scan(config.reducer, config.initialState),
    startWith(config.initialState),
    shareReplay({
      bufferSize: 1,
      refCount: true
    })
  );

  const dispatch = (action: Action): void => {
    actionSubject.next(action);
  };

  const complete = (): void => {
    actionSubject.complete();
  };

  const error = (reason: unknown): void => {
    actionSubject.error(reason);
  };

  return {
    actions$,
    state$,
    dispatch,
    complete,
    error
  };
};
