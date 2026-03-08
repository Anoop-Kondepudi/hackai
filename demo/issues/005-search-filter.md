# Search and Filter Todos

**Label:** feature
**Severity:** Medium
**Component:** frontend

## Current Behavior
All todos are displayed in a flat list with no filtering or search capability.

## Expected Behavior
A search input filters todos by title in real time as the user types. Filter tabs (All / Active / Completed) allow switching between views. Both search and filter work together.

## Implementation Notes
- Add search state and filter state to App.tsx
- Filter the todo list client-side before passing to TodoList
- Create a new FilterBar component or extend TodoList with search input and filter tabs
- No backend changes needed since all filtering is client-side

## Files to Modify
- `demo/frontend/src/App.tsx` -- add search state, filter state, pass filtered todos to TodoList
- `demo/frontend/src/components/FilterBar.tsx` -- new component with search input and All/Active/Completed filter tabs (or integrate into TodoList.tsx)
