# Keyboard Shortcuts

**Label:** improvement
**Severity:** Low
**Component:** frontend

## Current Behavior
Users must click the Add button with the mouse to submit a new todo. Pressing Enter in the input field does nothing. There is no keyboard-driven workflow.

## Expected Behavior
- Pressing **Enter** in the input field submits the new todo (same as clicking Add)
- Optionally, pressing **Escape** clears the input field

## Implementation Notes
Add an `onKeyDown` handler to the text input in AddTodo. On `Enter`, call the existing `handleSubmit` function. On `Escape`, clear the input value and blur the field. No new state or props needed -- just wire keyboard events to existing handlers.

## Files to Modify
- `demo/frontend/src/components/AddTodo.tsx` -- Add `onKeyDown` handler to the input element that calls `handleSubmit` on Enter and optionally clears input on Escape
