import { Todo } from '../types/todo';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (id: string, title: string) => void | Promise<void>;
  onDelete: (id: string) => void;
}

export default function TodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
}: TodoListProps) {
  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
