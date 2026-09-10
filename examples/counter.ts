import { createActionStateMachine } from "../src/index.js";

export type CounterState = {
  readonly count: number;
};

export type CounterAction =
  | { readonly type: "increment" }
  | { readonly type: "decrement" }
  | { readonly type: "reset" };

export const initialCounterState: CounterState = {
  count: 0
};

export const reduceCounterState = (
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
      return initialCounterState;
  }
};

export const counterMachine = createActionStateMachine<
  CounterState,
  CounterAction
>({
  initialState: initialCounterState,
  reducer: reduceCounterState
});

export const increment = (): void => {
  counterMachine.dispatch({ type: "increment" });
};

export const decrement = (): void => {
  counterMachine.dispatch({ type: "decrement" });
};

export const reset = (): void => {
  counterMachine.dispatch({ type: "reset" });
};
