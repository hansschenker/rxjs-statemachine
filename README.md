# rxjs-machine

A tiny generic RxJS 7 state machine built around one invariant dataflow:

```text
Action -> Reducer<S> -> createMachine<S> -> State<S>
```

Internally:

```text
merge -> scan -> shareState
```

The domain can change. The RxJS machine stays the same.

## Core idea

A reducer is a pure state transition:

```ts
export type Reducer<S> = (state: S) => S;
```

Domain actions are mapped to reducer values. Those reducer streams are fed into one generic machine:

```ts
const state$ = createMachine(
  initialState,
  addTodoReducer$,
  toggleTodoReducer$,
  removeTodoReducer$,
);
```

The machine does not know what a Todo, Counter, game, form, router, or animation is. It only knows how to apply the next `Reducer<S>` to the current `S`.

```text
S(n+1) = reducer(n)(S(n))
```

## Architecture

```text
                        DOMAIN

action A$ -> reducer$ ----+
action B$ -> reducer$ ----+----+
action C$ -> reducer$ ----+    |
                                v
                     +--------------------+
                     |   createMachine    |
                     |                    |
                     | merge              |
                     |   |                |
                     |   v                |
                     | scan               |
                     |   |                |
                     |   v                |
                     | shareState         |
                     +---------+----------+
                               |
                               v
                             state$
                               |
                               v
                         subscribers/view
```

The boundary is intentional:

```text
Action -> Reducer<S>     = domain
merge -> scan -> share   = generic RxJS mechanism
```

## Public API

### `Reducer<S>`

```ts
type Reducer<S> = (state: S) => S;
```

A reducer describes one state transition. Reducers are ordinary pure functions and can themselves flow through Observables as values.

### `shareState<T>()`

```ts
shareState<T>(): MonoTypeOperatorFunction<T>
```

Shares one upstream execution and remembers the latest emitted state with a `ReplaySubject(1)`.

### `createMachine<S>()`

```ts
createMachine<S>(
  initialState: S,
  ...reducerStreams: Observable<Reducer<S>>[]
): Observable<S>
```

The implementation is deliberately small:

```ts
merge(...reducerStreams).pipe(
  scan(applyReducer, initialState),
  startWith(initialState),
  shareState(),
);
```

## Todo example

Actions describe what happened:

```ts
type AddTodoAction = Readonly<{
  type: 'add';
  title: string;
}>;

type ToggleTodoAction = Readonly<{
  type: 'toggle';
  id: number;
}>;
```

Actions become reducers:

```ts
const addTodo = (
  action: AddTodoAction,
): Reducer<TodoState> =>
  state => ({
    ...state,
    todos: [
      ...state.todos,
      {
        id: state.nextId,
        title: action.title,
        completed: false,
      },
    ],
    nextId: state.nextId + 1,
  });

const addTodoReducer$ =
  addTodoAction$.pipe(
    map(addTodo),
  );
```

The reducers plug into the generic machine:

```ts
const state$ =
  createMachine(
    initialTodoState,
    addTodoReducer$,
    toggleTodoReducer$,
    removeTodoReducer$,
  );
```

The view subscribes to state:

```ts
state$.subscribe(renderTodoState);
```

Nothing inside `createMachine` changes when the domain changes.

## Counter example

```ts
const state$ =
  createMachine(
    initialCounterState,
    incrementReducer$,
    decrementReducer$,
    resetReducer$,
  );
```

The Counter and Todo domains use the same machine.

## Why this shape?

The design keeps four concerns separate:

| Concern | Responsibility |
| --- | --- |
| Action | Something happened |
| Reducer | Describe how state changes |
| `createMachine` | Apply state changes over time |
| Subscriber/View | Consume and render state |

RxJS moves values over time. In this architecture, reducer functions are also values:

```text
Reducer<S>
Reducer<S>
Reducer<S>
...
```

`scan` is the state-transition engine:

```text
(currentState, reducer) -> nextState
```

`shareState` is the distribution policy:

```text
one state-machine execution -> many subscribers
```

## Design constraints

This project intentionally does **not** add:

- classes
- a store object
- a `dispatch` method
- middleware
- an action registry
- hidden mutation
- hidden Subjects

The goal is to remain a small RxJS/functional abstraction rather than reproduce Redux.

## RxJS version

The project targets **RxJS 7.8.2**.

## Development

```bash
npm install
npm test
npm run build
```

## Attribution

**The main contributor to this project is GPT-Astra 6.**
