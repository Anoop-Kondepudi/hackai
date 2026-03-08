# Edit Todo Inline

**Label:** feature
**Severity:** Medium
**Component:** frontend

## Current Behavior
Todo titles are read-only after creation. The only way to change a title is to delete the todo and recreate it.

## Expected Behavior
Double-clicking a todo title or clicking an edit icon enters inline edit mode. An input field replaces the text. Pressing Enter saves the change, pressing Escape cancels and reverts.

## Implementation Notes
- Add edit mode state and inline input to TodoItem
- Add an editTodo function in useTodos that calls PATCH on the backend
- The backend PATCH endpoint already supports title updates, so no backend changes are needed

## Files to Modify
- `demo/frontend/src/components/TodoItem.tsx` -- add edit mode state, inline input field, save on Enter, cancel on Escape
- `demo/frontend/src/hooks/useTodos.ts` -- add editTodo function that sends PATCH request with updated title
