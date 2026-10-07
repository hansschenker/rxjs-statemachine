import assert from 'node:assert/strict';
import test from 'node:test';

import {
  Observable,
  Subject,
} from 'rxjs';

import {
  shareState,
} from '../src/index.js';

test(
  'shareState shares one execution and replays the latest state',
  () => {
    const input$ =
      new Subject<number>();

    let subscriptions = 0;

    const source$ =
      new Observable<number>(
        subscriber => {
          subscriptions += 1;

          const subscription =
            input$.subscribe(subscriber);

          return () =>
            subscription.unsubscribe();
        },
      );

    const state$ =
      source$.pipe(
        shareState(),
      );

    const first: number[] = [];
    const second: number[] = [];

    const firstSubscription =
      state$.subscribe(value => {
        first.push(value);
      });

    input$.next(1);
    input$.next(2);

    const secondSubscription =
      state$.subscribe(value => {
        second.push(value);
      });

    input$.next(3);

    assert.equal(
      subscriptions,
      1,
    );

    assert.deepEqual(
      first,
      [1, 2, 3],
    );

    assert.deepEqual(
      second,
      [2, 3],
    );

    input$.complete();

    firstSubscription.unsubscribe();
    secondSubscription.unsubscribe();
  },
);
