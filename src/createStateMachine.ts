import {
  merge,
  scan,
  startWith,
  type Observable,
} from 'rxjs';

import { shareState } from './shareState.js';
import type { Reducer } from './types.js';

/**
 * Apply one reducer value to the remembered state.
 *
 * S(n+1) = reducer(n)(S(n))
 */
const applyReducer = <S>(
  state: S,
  reducer: Reducer<S>,
): S =>
  reducer(state);

/**
 * Generic RxJS state machine.
 *
 * Domain-specific code supplies Observable<Reducer<S>> streams.
 * The state machine itself is invariant:
 *
 * merge -> scan -> shareState
 */
export const createStateMachine = <S>(
  initialState: S,
  ...reducerStreams: Observable<Reducer<S>>[]
): Observable<S> =>
  merge(...reducerStreams).pipe(
    scan(applyReducer<S>, initialState),
    startWith(initialState),
    shareState<S>(),
  );
