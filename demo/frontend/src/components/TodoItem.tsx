import { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (id: string, title: string) => void | Promise<void>;
  onDelete: (id: string) => void;
}

export default function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(todo.title);
    }
  }, [isEditing, todo.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setDraftTitle(todo.title);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftTitle(todo.title);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle || trimmedTitle === todo.title) {
      cancelEditing();
      return;
    }

    await Promise.resolve(onEdit(todo.id, trimmedTitle));
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
      <button
        onClick={() => onToggle(todo.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          todo.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300'
        }`}
      >
        {todo.completed && (
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        )}
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={async (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              await saveEditing();
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEditing();
            }
          }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-800 bg-transparent border border-slate-300 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
        />
      ) : (
        <span
          onDoubleClick={startEditing}
          className={`text-sm font-medium flex-1 min-w-0 ${
            todo.completed ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        >
          {todo.title}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        className="text-slate-400 p-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
}
