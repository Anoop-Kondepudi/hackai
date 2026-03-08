import { useState, useEffect } from 'react';
import { Todo } from '../types/todo';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTodos() {
    try {
      setLoading(true);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(title: string) {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to add todo');
      await fetchTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function toggleTodo(id: string) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to toggle todo');
      await fetchTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function editTodo(id: string, title: string) {
    const trimmedTitle = title.trim();
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });
      if (!res.ok) throw new Error('Failed to edit todo');
      await fetchTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function deleteTodo(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  return { todos, loading, error, addTodo, toggleTodo, editTodo, deleteTodo };
}
