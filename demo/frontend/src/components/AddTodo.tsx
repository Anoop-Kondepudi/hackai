import { useState } from 'react';

interface AddTodoProps {
  onAdd: (title: string) => void;
}

export default function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg"
        >
          Add
        </button>
      </div>
    </form>
  );
}
