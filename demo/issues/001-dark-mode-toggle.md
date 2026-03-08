# Dark Mode Toggle

**Label:** feature
**Severity:** Medium
**Component:** frontend

## Current Behavior
Light theme only. No toggle exists in the UI. No dark CSS variables or classes are defined.

## Expected Behavior
A toggle button in the Header component with a sun/moon icon. When enabled, dark mode applies slate-900/950 backgrounds, slate-100 text, and slate-800 card borders across the entire app. Preference persists via localStorage.

## Implementation Notes
- Add a toggle button to the Header component with sun/moon icon
- Define dark CSS variables and a `@custom-variant` in index.css
- Toggle the `dark` class on the root element in App.tsx and persist the choice to localStorage
- Add `dark:` Tailwind utility classes to all component files for dark-aware styling

## Files to Modify
- `demo/frontend/src/components/Header.tsx` -- add dark mode toggle button with sun/moon icon
- `demo/frontend/src/index.css` -- add dark CSS variables and @custom-variant
- `demo/frontend/src/App.tsx` -- add dark class toggle logic and localStorage persistence
- `demo/frontend/src/components/TodoItem.tsx` -- add dark: Tailwind classes
- `demo/frontend/src/components/TodoList.tsx` -- add dark: Tailwind classes
- `demo/frontend/src/components/AddTodo.tsx` -- add dark: Tailwind classes
