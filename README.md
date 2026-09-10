# rxjs-statemachine

A small generic **RxJS Action State Machine** pattern.

```text
Subject as Action Input Port
Observable as Action Stream
scan as State Reducer
shareReplay(1) as Remembered State
```

The goal is to make a reusable RxJS-native state machine where:

- actions enter through a controlled private `Subject<Action>`
- actions flow publicly as an `Observable<Action>`
- `scan` folds actions into state
- `shareReplay(1)` remembers the latest state for late subscribers

## The pattern

```text
Action Creator Function
        │
        ▼
Private Subject<Action>
        │
        ▼
Public actions$: Observable<Action>
        │
        ▼
scan(reducer, initialState)
        │
        ▼
state$: Observable<State>
        │
        ▼
shareReplay(1)
        │
        ▼
Remembered State Stream
```

## Installation

```bash
npm install rxjs-statemachine rxjs
```

For local development:

```bash
npm install
npm test
npm run build
```

## Core idea

```text
ActionStateMachine<State, Action> =
  Subject<Action>
    -> Observable<Action>
    -> scan((State, Action) -> State, initial State)
    -> shareReplay(1)
    -> Observable<State>
```

The machine does not know the domain.

It does not care whether the domain is:

- counter state
- todo state
- router state
- form state
- HTTP loading state
- animation state
- workflow state

Only the action type and reducer change.

The RxJS machine stays the same.

## Usage

```ts
import { createActionStateMachine } from "rxjs-statemachine";

type CounterState = {
  readonly count: number;
};

type CounterAction =
  | { readonly type: "increment" }
  | { readonly type: "decrement" }
  | { readonly type: "reset" };

const initialState: CounterState = {
  count: 0
};

const reduceCounterState = (
  state: CounterState,
  action: CounterAction
): CounterState => {
  switch (action.type) {
    case "increment":
      return {
        count: state.count + 1
      };

    case "decrement":
      return {
        count: state.count - 1
      };

    case "reset":
      return initialState;
  }
};

const counterMachine = createActionStateMachine<
  CounterState,
  CounterAction
>({
  initialState,
  reducer: reduceCounterState
});

const subscription = counterMachine.state$.subscribe((state) => {
  console.log(state);
});

counterMachine.dispatch({ type: "increment" });
counterMachine.dispatch({ type: "increment" });
counterMachine.dispatch({ type: "decrement" });
counterMachine.dispatch({ type: "reset" });

subscription.unsubscribe();
```

Output over time:

```text
{ count: 0 }
{ count: 1 }
{ count: 2 }
{ count: 1 }
{ count: 0 }
```

## API

### `createActionStateMachine(config)`

Creates a generic action/state machine.

```ts
type CreateActionStateMachineConfig<State, Action> = {
  readonly initialState: State;
  readonly reducer: (state: State, action: Action) => State;
};
```

Returns:

```ts
type ActionStateMachine<State, Action> = {
  readonly actions$: Observable<Action>;
  readonly state$: Observable<State>;
  readonly dispatch: (action: Action) => void;
  readonly complete: () => void;
  readonly error: (reason: unknown) => void;
};
```

## Design notes

### Subject is the input port

The `Subject<Action>` is private inside the machine.

It is the write side:

```text
dispatch(action) -> actionSubject.next(action)
```

External code receives only the public Observable streams.

### Observable is the action stream

The action stream is exposed as:

```ts
const actions$ = actionSubject.asObservable();
```

This prevents external code from calling `next`, `error`, or `complete` directly.

### scan is the state reducer

`scan` is the ongoing fold:

```text
previous State + Action -> next State
```

It converts:

```text
actions over time
```

into:

```text
state over time
```

### shareReplay(1) is remembered state

`shareReplay({ bufferSize: 1, refCount: true })` turns the state stream into remembered state.

Late subscribers receive the latest known state immediately.

### startWith(initialState)

The state stream emits the initial state immediately.

Without `startWith(initialState)`, `state$` would only emit after the first action.

## Durable formulation

```text
An RxJS Action State Machine models user intent as actions flowing into a controlled Subject input port, exposes those actions as an Observable<Action>, folds them into State with scan, and remembers the latest State with shareReplay(1).
```

## License

MIT
