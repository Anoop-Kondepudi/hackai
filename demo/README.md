# TodoApp Demo

Demo to-do list app for the HackAI pipeline showcase. This app has intentional bugs and missing features that will be discussed in demo meetings -- the agentic pipeline will automatically detect and fix them.

## Prerequisites

- Node >= 20

## Setup

```bash
cd demo
npm install
npm run install:all
```

## Run

```bash
npm run dev
```

This starts both servers concurrently:

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

## Issues

The `issues/` folder contains documented intentional issues in the app. These serve as targets for the HackAI agentic pipeline to discover and resolve during demo meetings.
