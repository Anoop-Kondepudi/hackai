import { Router } from 'express';
import type { Request, Response } from 'express';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo.js';

const router = Router();

let todos: Todo[] = [
  { id: crypto.randomUUID(), title: 'Build the demo presentation slides', completed: false, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Review pull requests from yesterday', completed: true, createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Set up CI/CD pipeline for staging', completed: false, createdAt: new Date().toISOString() },
];

router.get('/', (_req: Request, res: Response) => {
  res.json(todos);
});

router.post('/', (req: Request, res: Response) => {
  const { title } = req.body as CreateTodoInput;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const todo: Todo = { id: crypto.randomUUID(), title: title.trim(), completed: false, createdAt: new Date().toISOString() };
  todos.push(todo);
  res.status(201).json(todo);
});

router.patch('/:id', (req: Request, res: Response) => {
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) { res.status(404).json({ error: 'Todo not found' }); return; }
  const updates = req.body as UpdateTodoInput;
  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || !updates.title.trim()) { res.status(400).json({ error: 'Title must be a non-empty string' }); return; }
    todo.title = updates.title.trim();
  }
  if (updates.completed !== undefined) { todo.completed = Boolean(updates.completed); }
  res.json(todo);
});

router.delete('/:id', (req: Request, res: Response) => {
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) { res.status(404).json({ error: 'Todo not found' }); return; }
  todos.splice(index, 1);
  res.status(204).send();
});

export default router;
