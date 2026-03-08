# Long Text Overflow

**Label:** bug
**Severity:** Medium
**Component:** frontend

## Current Behavior
Long todo titles, especially URLs or strings without spaces, overflow the card container horizontally. This breaks the layout and causes a horizontal scrollbar to appear.

## Expected Behavior
Long text wraps naturally within the card. Unbroken strings (like URLs) are handled with `overflow-wrap: break-word` or truncated with ellipsis. The card container never overflows horizontally.

## Steps to Reproduce
1. Create a todo with the title "https://www.example.com/very/long/path/that/goes/on/and/on/and/on/without/any/spaces/whatsoever/making/it/really/long"
2. Observe the text overflows the card boundary and breaks the page layout

## Implementation Notes
Add `min-w-0` to the flex child containing the title to allow it to shrink below its content size. Add `break-words` (Tailwind for `overflow-wrap: break-word`) to the title text element. Add `overflow-hidden` on the parent card container as a safety net.

## Files to Modify
- `demo/frontend/src/components/TodoItem.tsx` -- Add `min-w-0 break-words` classes to the title span, add `overflow-hidden` to the outer card container
