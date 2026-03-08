# Priority Levels for Todos

**Label:** feature
**Severity:** Medium
**Component:** both

## Current Behavior
All todos have equal weight with no priority indicator. They are displayed in creation order only.

## Expected Behavior
A priority selector (low / medium / high) is available when creating a todo. Each todo displays a color-coded priority badge: green for low, yellow for medium, red for high. Optionally, todos can be sorted by priority.

## Implementation Notes
- Add a `priority` field to the shared Todo type with values "low", "medium", or "high"
- Add a priority dropdown/selector to the AddTodo form
- Display a color-coded badge on each TodoItem
- Accept and persist priority in the backend POST and PATCH routes

## Files to Modify
- `demo/frontend/src/types/todo.ts` -- add priority: "low" | "medium" | "high" to Todo type
- `demo/backend/types/todo.ts` -- add priority: "low" | "medium" | "high" to Todo type
- `demo/frontend/src/components/AddTodo.tsx` -- add priority selector dropdown
- `demo/frontend/src/components/TodoItem.tsx` -- display color-coded priority badge
- `demo/backend/routes/todos.ts` -- accept priority in POST and PATCH handlers
