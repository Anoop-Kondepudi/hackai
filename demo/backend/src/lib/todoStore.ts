import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Todo } from '../types/todo.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
const dataDirectory = join(currentDirectory, '..', '..', 'data');
const todoStorePath = join(dataDirectory, 'todos.json');

const seedTodos: Todo[] = [
  {
    id: crypto.randomUUID(),
    title: 'Build the demo presentation slides',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Review pull requests from yesterday',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Set up CI/CD pipeline for staging',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

type TodoMutationResult<T> = {
  result: T;
  todos: Todo[];
  write?: boolean;
};

let mutationQueue = Promise.resolve();

function cloneTodos(todos: Todo[]): Todo[] {
  return todos.map((todo) => ({ ...todo }));
}

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.completed === 'boolean' &&
    typeof todo.createdAt === 'string'
  );
}

function assertTodoArray(value: unknown): asserts value is Todo[] {
  if (!Array.isArray(value) || !value.every(isTodo)) {
    throw new Error(`Todo store at ${todoStorePath} must contain an array of todo objects`);
  }
}

function parseTodos(rawTodos: string): Todo[] {
  try {
    const parsed = JSON.parse(rawTodos) as unknown;
    assertTodoArray(parsed);

    return cloneTodos(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Todo store at ${todoStorePath} contains invalid JSON`, { cause: error });
    }

    throw error;
  }
}

function isErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}

async function writeTodosFile(todos: Todo[]): Promise<void> {
  assertTodoArray(todos);
  await mkdir(dataDirectory, { recursive: true });

  const tempFilePath = `${todoStorePath}.tmp`;
  const serializedTodos = `${JSON.stringify(todos, null, 2)}\n`;

  await writeFile(tempFilePath, serializedTodos, 'utf8');
  await rename(tempFilePath, todoStorePath);
}

async function initializeTodoStore(): Promise<Todo[]> {
  const todos = cloneTodos(seedTodos);
  await writeTodosFile(todos);
  return todos;
}

async function loadTodos(): Promise<Todo[]> {
  await mkdir(dataDirectory, { recursive: true });

  let rawTodos: string;

  try {
    rawTodos = await readFile(todoStorePath, 'utf8');
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      return initializeTodoStore();
    }

    throw new Error(`Failed to read todo store at ${todoStorePath}`, { cause: error });
  }

  if (!rawTodos.trim()) {
    return initializeTodoStore();
  }

  return parseTodos(rawTodos);
}

export async function ensureTodoStore(): Promise<void> {
  await loadTodos();
}

export async function readTodos(): Promise<Todo[]> {
  return loadTodos();
}

export async function updateTodos<T>(
  mutate: (todos: Todo[]) => TodoMutationResult<T> | Promise<TodoMutationResult<T>>,
): Promise<T> {
  const mutation = mutationQueue.then(async () => {
    const currentTodos = await loadTodos();
    const { result, todos, write = true } = await mutate(currentTodos);

    if (write) {
      await writeTodosFile(todos);
    }

    return result;
  });

  mutationQueue = mutation.then(
    () => undefined,
    () => undefined,
  );

  return mutation;
}
