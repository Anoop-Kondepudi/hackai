import { Router } from 'express';
import type { Request, Response } from 'express';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo.js';
import { readTodos, updateTodos } from '../lib/todoStore.js';

const router = Router();

const todoStoreErrorResponse = { error: 'Failed to access todo store' };

function handleTodoStoreError(res: Response, error: unknown) {
  console.error('Todo route failed to access store', error);
  res.status(500).json(todoStoreErrorResponse);
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (error) {
    handleTodoStoreError(res, error);
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { title } = req.body as CreateTodoInput;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const todo: Todo = { id: crypto.randomUUID(), title: title.trim(), completed: false, createdAt: new Date().toISOString() };

  try {
    const createdTodo = await updateTodos((todos) => ({
      result: todo,
      todos: [...todos, todo],
    }));

    res.status(201).json(createdTodo);
  } catch (error) {
    handleTodoStoreError(res, error);
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const updates = req.body as UpdateTodoInput;

  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || !updates.title.trim()) {
      res.status(400).json({ error: 'Title must be a non-empty string' });
      return;
    }
  }

  try {
    const updatedTodo = await updateTodos((todos) => {
      const index = todos.findIndex((todo) => todo.id === req.params.id);

      if (index === -1) {
        return {
          result: null,
          todos,
          write: false,
        };
      }

      const todo = { ...todos[index] };

      if (updates.title !== undefined) {
        todo.title = updates.title.trim();
      }

      if (updates.completed !== undefined) {
        todo.completed = Boolean(updates.completed);
      }

      const nextTodos = [...todos];
      nextTodos[index] = todo;

      return {
        result: todo,
        todos: nextTodos,
      };
    });

    if (!updatedTodo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.json(updatedTodo);
  } catch (error) {
    handleTodoStoreError(res, error);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await updateTodos((todos) => {
      const nextTodos = todos.filter((todo) => todo.id !== req.params.id);

      if (nextTodos.length === todos.length) {
        return {
          result: false,
          todos,
          write: false,
        };
      }

      return {
        result: true,
        todos: nextTodos,
      };
    });

    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    handleTodoStoreError(res, error);
  }
});

export default router;
