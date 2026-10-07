import {
  filter,
  fromEvent,
  map,
  share,
} from 'rxjs';

import {
  createMachine,
  type Reducer,
} from '../../src/index.js';

type Todo = Readonly<{
  id: number;
  title: string;
  completed: boolean;
}>;

type TodoState = Readonly<{
  todos: readonly Todo[];
  nextId: number;
}>;

type AddTodoAction = Readonly<{
  type: 'add';
  title: string;
}>;

type ToggleTodoAction = Readonly<{
  type: 'toggle';
  id: number;
}>;

type RemoveTodoAction = Readonly<{
  type: 'remove';
  id: number;
}>;

const initialState: TodoState = {
  todos: [],
  nextId: 1,
};

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

const toggleTodo = (
  action: ToggleTodoAction,
): Reducer<TodoState> =>
  state => ({
    ...state,
    todos: state.todos.map(todo =>
      todo.id === action.id
        ? {
            ...todo,
            completed: !todo.completed,
          }
        : todo
    ),
  });

const removeTodo = (
  action: RemoveTodoAction,
): Reducer<TodoState> =>
  state => ({
    ...state,
    todos: state.todos.filter(
      todo => todo.id !== action.id,
    ),
  });

const todoInput =
  document.querySelector<HTMLInputElement>(
    '#todo-input',
  )!;

const addButton =
  document.querySelector<HTMLButtonElement>(
    '#add-todo',
  )!;

const todoList =
  document.querySelector<HTMLUListElement>(
    '#todo-list',
  )!;

const isDefined = <T>(
  value: T | null,
): value is T =>
  value !== null;

const createAddAction = (
  _event: MouseEvent,
): AddTodoAction | null => {
  const title =
    todoInput.value.trim();

  return title.length > 0
    ? {
        type: 'add',
        title,
      }
    : null;
};

const getActionButton = (
  event: MouseEvent,
): HTMLButtonElement | null => {
  if (!(event.target instanceof Element)) {
    return null;
  }

  return event.target.closest<HTMLButtonElement>(
    'button[data-action][data-id]',
  );
};

const createToggleAction = (
  event: MouseEvent,
): ToggleTodoAction | null => {
  const button =
    getActionButton(event);

  if (
    button === null ||
    button.dataset.action !== 'toggle'
  ) {
    return null;
  }

  return {
    type: 'toggle',
    id: Number(button.dataset.id),
  };
};

const createRemoveAction = (
  event: MouseEvent,
): RemoveTodoAction | null => {
  const button =
    getActionButton(event);

  if (
    button === null ||
    button.dataset.action !== 'remove'
  ) {
    return null;
  }

  return {
    type: 'remove',
    id: Number(button.dataset.id),
  };
};

const addAction$ =
  fromEvent<MouseEvent>(
    addButton,
    'click',
  ).pipe(
    map(createAddAction),
    filter(isDefined),
  );

const todoListClick$ =
  fromEvent<MouseEvent>(
    todoList,
    'click',
  ).pipe(
    share(),
  );

const toggleAction$ =
  todoListClick$.pipe(
    map(createToggleAction),
    filter(isDefined),
  );

const removeAction$ =
  todoListClick$.pipe(
    map(createRemoveAction),
    filter(isDefined),
  );

const addReducer$ =
  addAction$.pipe(
    map(addTodo),
  );

const toggleReducer$ =
  toggleAction$.pipe(
    map(toggleTodo),
  );

const removeReducer$ =
  removeAction$.pipe(
    map(removeTodo),
  );

const state$ =
  createMachine(
    initialState,
    addReducer$,
    toggleReducer$,
    removeReducer$,
  );

const createTodoElement = (
  todo: Todo,
): HTMLLIElement => {
  const item =
    document.createElement('li');

  const title =
    document.createElement('span');

  title.textContent =
    todo.completed
      ? `✓ ${todo.title}`
      : todo.title;

  const toggleButton =
    document.createElement('button');

  toggleButton.textContent =
    todo.completed
      ? 'Undo'
      : 'Done';

  toggleButton.dataset.action =
    'toggle';

  toggleButton.dataset.id =
    String(todo.id);

  const removeButton =
    document.createElement('button');

  removeButton.textContent =
    'Remove';

  removeButton.dataset.action =
    'remove';

  removeButton.dataset.id =
    String(todo.id);

  item.append(
    title,
    toggleButton,
    removeButton,
  );

  return item;
};

const renderTodoState = (
  state: TodoState,
): void => {
  const todoElements =
    state.todos.map(
      createTodoElement,
    );

  todoList.replaceChildren(
    ...todoElements,
  );

  todoInput.value = '';
};

state$.subscribe(
  renderTodoState,
);
