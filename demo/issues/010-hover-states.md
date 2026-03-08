# Hover States

**Label:** improvement
**Severity:** Low
**Component:** frontend

## Current Behavior
The Add button and delete button have no hover or active visual feedback. They feel static and unresponsive, making it unclear that they are interactive elements.

## Expected Behavior
- **Add button:** `hover:bg-blue-600 active:bg-blue-700 transition-colors` for a darkening effect on hover and press
- **Delete button:** `hover:text-red-500 hover:bg-red-50 transition-colors` for a red highlight on hover
- **Checkbox:** `hover:border-blue-400` when unchecked for subtle interactivity hint

All transitions should be smooth using `transition-colors` for a polished feel.

## Implementation Notes
Add Tailwind hover and active utility classes to the interactive elements. These are purely additive CSS changes with no logic modifications needed.

## Files to Modify
- `demo/frontend/src/components/AddTodo.tsx` -- Add `hover:bg-blue-600 active:bg-blue-700 transition-colors` classes to the Add button
- `demo/frontend/src/components/TodoItem.tsx` -- Add `hover:text-red-500 hover:bg-red-50 transition-colors` to delete button, `hover:border-blue-400` to checkbox
