# Due Dates for Todos

**Label:** feature
**Severity:** Medium
**Component:** both

## Current Behavior
Todos only have a title and completed status. There is no way to track or display due dates.

## Expected Behavior
An optional due date can be set when creating or editing a todo. The date displays on the todo card. If the due date has passed and the todo is not completed, the date text renders in red to indicate it is overdue.

## Implementation Notes
- Add a `dueDate` field (string | null) to the shared Todo type
- Add a date input to the AddTodo form
- Display the due date on TodoItem with conditional red styling when overdue
- Accept and persist dueDate in the backend POST and PATCH routes

## Files to Modify
- `demo/frontend/src/types/todo.ts` -- add dueDate: string | null to Todo type
- `demo/backend/types/todo.ts` -- add dueDate: string | null to Todo type
- `demo/frontend/src/components/AddTodo.tsx` -- add date input field
- `demo/frontend/src/components/TodoItem.tsx` -- display due date, red text if overdue
- `demo/backend/routes/todos.ts` -- accept dueDate in POST and PATCH handlers
- `demo/frontend/src/hooks/useTodos.ts` -- pass dueDate when creating/editing todos
