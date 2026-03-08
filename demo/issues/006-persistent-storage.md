# Persistent Storage for Todos

**Label:** bug
**Severity:** High
**Component:** backend

## Current Behavior
The Express backend stores todos in a JavaScript array in memory. Restarting the server loses all data. After a server restart and browser refresh, only the hard-coded seed data remains.

## Expected Behavior
Todos are persisted to a JSON file on disk. The backend reads from and writes to this file on every operation. The file is auto-created on the first write if it does not exist.

## Steps to Reproduce
1. Start the backend server and add some todos via the UI
2. Stop and restart the backend server
3. Refresh the browser
4. All custom todos are gone -- only seed data remains

## Implementation Notes
- Replace the in-memory array with file-based read/write using a todos.json file
- Read the file at the start of each request handler, write after each mutation
- Auto-create the data directory and file on first write
- Keep the seed data as the initial content if the file does not exist

## Files to Modify
- `demo/backend/routes/todos.ts` -- replace in-memory array with file read/write to demo/backend/data/todos.json
- `demo/backend/data/` -- new directory for persistent storage (gitignored)
