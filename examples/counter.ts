import {
  Subject,
  map,
} from 'rxjs';

import {
  createMachine,
  type Reducer,
} from '../src/index.js';

type CounterState = Readonly<{
  count: number;
}>;

const initialState: CounterState = {
  count: 0,
};

const increment =
  (): Reducer<CounterState> =>
  state => ({
    ...state,
    count: state.count + 1,
  });

const decrement =
  (): Reducer<CounterState> =>
  state => ({
    ...state,
    count: state.count - 1,
  });

const reset =
  (): Reducer<CounterState> =>
  () =>
    initialState;

const incrementAction$ =
  new Subject<void>();

const decrementAction$ =
  new Subject<void>();

const resetAction$ =
  new Subject<void>();

const incrementReducer$ =
  incrementAction$.pipe(
    map(increment),
  );

const decrementReducer$ =
  decrementAction$.pipe(
    map(decrement),
  );

const resetReducer$ =
  resetAction$.pipe(
    map(reset),
  );

const state$ =
  createMachine(
    initialState,
    incrementReducer$,
    decrementReducer$,
    resetReducer$,
  );

const subscription =
  state$.subscribe(state => {
    console.log(`count = ${state.count}`);
  });

incrementAction$.next();
incrementAction$.next();
decrementAction$.next();
resetAction$.next();

incrementAction$.complete();
decrementAction$.complete();
resetAction$.complete();

subscription.unsubscribe();
