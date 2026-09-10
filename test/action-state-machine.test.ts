import { describe, expect, it } from "vitest";
import { createActionStateMachine } from "../src/index.js";

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

describe("createActionStateMachine", () => {
  it("emits the initial state immediately", () => {
    const machine = createActionStateMachine<CounterState, CounterAction>({
      initialState,
      reducer: reduceCounterState
    });

    const states: CounterState[] = [];

    const subscription = machine.state$.subscribe((state) => {
      states.push(state);
    });

    expect(states).toEqual([{ count: 0 }]);

    subscription.unsubscribe();
  });

  it("reduces dispatched actions into state over time", () => {
    const machine = createActionStateMachine<CounterState, CounterAction>({
      initialState,
      reducer: reduceCounterState
    });

    const states: CounterState[] = [];

    const subscription = machine.state$.subscribe((state) => {
      states.push(state);
    });

    machine.dispatch({ type: "increment" });
    machine.dispatch({ type: "increment" });
    machine.dispatch({ type: "decrement" });
    machine.dispatch({ type: "reset" });

    expect(states).toEqual([
      { count: 0 },
      { count: 1 },
      { count: 2 },
      { count: 1 },
      { count: 0 }
    ]);

    subscription.unsubscribe();
  });

  it("exposes actions as a public action stream", () => {
    const machine = createActionStateMachine<CounterState, CounterAction>({
      initialState,
      reducer: reduceCounterState
    });

    const actions: CounterAction[] = [];

    const subscription = machine.actions$.subscribe((action) => {
      actions.push(action);
    });

    machine.dispatch({ type: "increment" });
    machine.dispatch({ type: "decrement" });

    expect(actions).toEqual([
      { type: "increment" },
      { type: "decrement" }
    ]);

    subscription.unsubscribe();
  });

  it("replays the latest remembered state to late subscribers", () => {
    const machine = createActionStateMachine<CounterState, CounterAction>({
      initialState,
      reducer: reduceCounterState
    });

    const firstSubscription = machine.state$.subscribe();

    machine.dispatch({ type: "increment" });
    machine.dispatch({ type: "increment" });

    const lateStates: CounterState[] = [];

    const lateSubscription = machine.state$.subscribe((state) => {
      lateStates.push(state);
    });

    expect(lateStates).toEqual([{ count: 2 }]);

    lateSubscription.unsubscribe();
    firstSubscription.unsubscribe();
  });

  it("completes the state stream when the action input port completes", () => {
    const machine = createActionStateMachine<CounterState, CounterAction>({
      initialState,
      reducer: reduceCounterState
    });

    let completed = false;

    const subscription = machine.state$.subscribe({
      complete: () => {
        completed = true;
      }
    });

    machine.complete();

    expect(completed).toBe(true);

    subscription.unsubscribe();
  });
});
