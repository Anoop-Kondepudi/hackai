# Empty State

**Label:** improvement
**Severity:** Low
**Component:** frontend

## Current Behavior
When no todos exist (all deleted or none created yet), the todo list area shows blank white space. There is no indication of what to do next.

## Expected Behavior
A friendly empty state with an icon and message like "No todos yet! Add one above to get started." The message should be centered, use muted colors, and feel welcoming rather than broken.

## Implementation Notes
In the TodoList component, add a conditional render when `todos.length === 0`. Display a centered container with a clipboard or checklist icon (can use an inline SVG) and a muted text message. Use Tailwind classes like `text-gray-400 text-center py-12` for styling.

## Files to Modify
- `demo/frontend/src/components/TodoList.tsx` -- Add conditional render when todos array is empty, display centered empty state message with icon
