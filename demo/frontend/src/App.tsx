import { useTodos } from './hooks/useTodos';
import Header from './components/Header';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';

function App() {
  const { todos, addTodo, toggleTodo, editTodo, deleteTodo } = useTodos();
  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header todoCount={activeCount} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AddTodo onAdd={addTodo} />
        <TodoList
          todos={todos}
          onToggle={toggleTodo}
          onEdit={editTodo}
          onDelete={deleteTodo}
        />
      </main>
    </div>
  );
}

export default App;
