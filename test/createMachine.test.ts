import assert from 'node:assert/strict';
import test from 'node:test';

import {
  Subject,
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

const add = (
  amount: number,
): Reducer<CounterState> =>
  state => ({
    ...state,
    count: state.count + amount,
  });

const reset =
  (): Reducer<CounterState> =>
  () =>
    initialState;

test(
  'createMachine emits initial state and applies reducers from merged streams',
  () => {
    const arithmeticReducer$ =
      new Subject<Reducer<CounterState>>();

    const resetReducer$ =
      new Subject<Reducer<CounterState>>();

    const actual: number[] = [];

    const subscription =
      createMachine(
        initialState,
        arithmeticReducer$,
        resetReducer$,
      ).subscribe(state => {
        actual.push(state.count);
      });

    arithmeticReducer$.next(add(1));
    arithmeticReducer$.next(add(2));
    resetReducer$.next(reset());

    assert.deepEqual(
      actual,
      [0, 1, 3, 0],
    );

    arithmeticReducer$.complete();
    resetReducer$.complete();
    subscription.unsubscribe();
  },
);
