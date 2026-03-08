import { useEffect, useState } from 'react';
import { useTodos } from './hooks/useTodos';
import Header from './components/Header';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  try {
    return localStorage.getItem('todo-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function App() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const activeCount = todos.filter((t) => !t.completed).length;

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);

    try {
      localStorage.setItem('todo-theme', theme);
    } catch {}
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header
        todoCount={activeCount}
        theme={theme}
        onToggleTheme={() =>
          setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
        }
      />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AddTodo onAdd={addTodo} />
        <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
      </main>
    </div>
  );
}

export default App;
