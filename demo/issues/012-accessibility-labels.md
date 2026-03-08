# Accessibility Labels

**Label:** improvement
**Severity:** Low
**Component:** frontend

## Current Behavior
Interactive elements (buttons, checkbox, input) lack `aria-label` attributes. Screen readers cannot describe what each button does, making the app inaccessible to users who rely on assistive technology.

## Expected Behavior
- **Delete button:** `aria-label="Delete todo: {title}"`
- **Checkbox:** `aria-label="Mark {title} as complete"` or `"Mark {title} as incomplete"` depending on state, with `role="checkbox"` and `aria-checked`
- **Text input:** A visually-hidden `<label>` element or `aria-label="New todo title"`
- **Add button:** `aria-label="Add new todo"`

## Implementation Notes
Add `aria-label` attributes to all interactive elements using the todo title for context where applicable. For the checkbox, dynamically set the label based on the current completed state. For the input, either add a `<label>` with `sr-only` class or use `aria-label` directly.

## Files to Modify
- `demo/frontend/src/components/TodoItem.tsx` -- Add `aria-label` to delete button and checkbox, add `role="checkbox"` and `aria-checked` to checkbox
- `demo/frontend/src/components/AddTodo.tsx` -- Add `aria-label` to input and Add button, or add visually-hidden label element
