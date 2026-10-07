/**
 * A pure state transition.
 *
 * Given the current state S, produce the next state S.
 */
export type Reducer<S> = (state: S) => S;
