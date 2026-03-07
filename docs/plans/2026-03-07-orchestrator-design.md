# Orchestrator Design

## Overview

Python-based orchestrator that runs a continuous loop during meetings: reads transcripts, extracts tasks via OpenAI API, manages GitHub issues, and auto-stabilizes tasks.

## Architecture

```
backend/
├── orchestrator.py      ← main loop
├── extractor.py         ← OpenAI API wrapper
├── task_parser.py       ← parse/diff tasks.md
├── github_ops.py        ← gh CLI wrappers
└── requirements.txt
```

## Data Flow

1. Read all JSON chunks from data/transcripts/ → sorted by timestamp
2. Read current data/tasks/tasks.md
3. Assemble prompt: system instructions + full transcript + current tasks
4. Call gpt-4.1-nano (OpenAI API, temperature=0)
5. Parse response → write updated tasks.md
6. Diff old vs new: create/edit/close GitHub issues
7. Auto-stabilize tasks unchanged for 3+ cycles
8. Sleep 5 seconds, repeat

## Model Choice

gpt-4.1-nano via OpenAI API. ~3.5s per call, 5/5 accuracy on clean and messy transcripts. Benchmarked against gpt-4o, gpt-4.1-mini — nano was fastest and most consistent.

## Key Decisions

- Stateless calls: full transcript + full tasks.md every time
- GitHub issues created immediately as drafts
- Auto-stabilize after 3 unchanged cycles → remove draft label
- Token safety: hard stop at 80k tokens
- Poll interval: 5 seconds
