# Delete Confirmation

**Label:** improvement
**Severity:** Low
**Component:** frontend

## Current Behavior
Single click on the trash icon instantly deletes the todo with no warning. Accidental clicks cause immediate, irreversible data loss.

## Expected Behavior
A confirmation step should appear before deletion. Either an inline "Are you sure?" prompt with Delete/Cancel buttons replacing the trash icon, or a simple confirmation dialog. The user must explicitly confirm before the todo is removed.

## Implementation Notes
Add a confirmation state to the TodoItem component. When the delete button is clicked, instead of immediately calling onDelete, toggle a local `confirming` boolean. When `confirming` is true, render "Are you sure?" text with Delete and Cancel buttons. Delete calls onDelete; Cancel resets the state.

## Files to Modify
- `demo/frontend/src/components/TodoItem.tsx` -- Add `confirming` state, render confirmation UI when active, wire Delete to onDelete and Cancel to reset state
