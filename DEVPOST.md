# 🤖 DevJarvis
**From Conversation to Code in Minutes.**
An autonomous AI assistant that attends your meetings, extracts development tasks, and writes the code for you.

DevJarvis combines real-time transcription, natural language understanding, and autonomous AI coding agents to turn spoken architecture discussions and sprint plannings directly into GitHub Pull Requests. You just review, approve, and merge.

## 🌎 The Problem
Developers spend nearly a third of their week in meetings—sprint planning, standups, and architecture syncs. After the meeting ends, the real work begins: translating discussions into Jira tickets, deciphering notes, setting up branches, and writing boilerplate code. This context switching kills productivity and leads to lost action items.

DevJarvis provides a space where developers can focus on what they do best—solving hard problems and reviewing logic—while the AI handles the translation of conversation into functional code. 

## 🧠 Inspiration
Every developer has wished for an AI assistant like Iron Man's "Jarvis"—something that just listens to the plan and executes the tedious parts. We asked ourselves:
*“What if a meeting didn't just result in action items, but in actual, reviewable code?”*

We built DevJarvis to bridge the gap between product discussions and engineering execution—turning talk directly into actionable pull requests.

## 💡 What It Does
### 🎙️ Audio Transcription & Task Extraction
DevJarvis listens in on your meetings and generates highly accurate transcripts. From these transcripts, it uses an LLM to automatically parse out concrete, actionable developer tasks and context.

### 🤖 Autonomous Coding Agent
Once a task is generated, DevJarvis hands it off to an AI coding agent (like Claude Code). The agent clones your repository, reads the existing codebase for context, and implements the required feature or bug fix.

### 🌿 Git & GitHub Automation
The agent automatically creates a new Git branch, commits the generated code with descriptive messages, and opens a Pull Request on GitHub. 

### 📊 Dashboard Monitoring
A sleek Next.js dashboard lets the engineering team monitor the pipeline in real-time, viewing live transcripts, extracted tasks, and the status of generated PRs.

## 🌟 Key Benefits
* **Zero Context Loss:** Capture requirements exactly as they were spoken and turn them into code immediately.
* **Massive Time Savings:** Skip the ticket-writing and boilerplate setup phases entirely.
* **Frictionless Workflow:** Developers stay in their flow state—they simply review the generated PR when they are ready.
* **Transparent Pipeline:** Visual dashboard tracking every step from audio to PR.

## 🚀 Use Cases
* **Sprint Planning & Backlog Refinement:** Automatically assign and implement accepted sprint tasks.
* **Bug Triage Meetings:** Discuss a bug, let DevJarvis find the root cause in the codebase, and open a fix PR.
* **Architecture Syncs:** Scaffold new microservices or boilerplate based on verbal architectural decisions.

## 🛠️ How We Built It
* **Frontend Dashboard:** Built with Next.js, Tailwind CSS, and React for a real-time reactive activity feed and pipeline tracking.
* **Backend Orchestration:** A Python-based orchestrator (`orchestrator.py`) handles the pipeline states, linking transcripts to tasks and agents.
* **Transcription Engine:** A local Node.js audio transcriber converts meeting audio into structured JSON transcripts.
* **AI & NLP:** Used large language models to parse transcripts into standardized `task.json` schemas.
* **Coding Agents:** Integrated with autonomous coding agents (like Claude Code) to perform complex codebase modifications.

## 🔄 Data Flow
Meeting Audio → `local-audio-transcriber.js` → JSON Transcript → Python Orchestrator extracts Tasks → AI Agent writes Code & Branches → GitHub Pull Request created → Next.js Dashboard displays updates.

## 🚧 Challenges We Overcame
* **Prompt Engineering for Tasks:** Ensuring the LLM extracted technically sound tasks rather than vague meeting notes.
* **Context Provisioning:** Giving the AI coding agent enough repository context to make accurate code changes without breaking existing logic.
* **Orchestrating Asynchronous Pipelines:** Managing the state machine across audio processing, heavy LLM inference, and Git operations seamlessly.

## 🏆 Accomplishments
* **End-to-End Automation:** Successfully built a pipeline that requires *zero* human intervention between the end of a meeting and a PR being opened.
* **Robust Agent Handoff:** Created a reliable schema (`task.json`) that perfectly bridges the gap between natural language transcripts and AI agent prompts.
* **Beautiful Real-Time UI:** Delivered a clean, intuitive dashboard that keeps the developer in control and informed.

## 📚 What We Learned
* AI coding agents operate best when given highly specific, isolated tasks rather than broad architectural goals. 
* High-quality transcription is the foundation of the entire pipeline—garbage in, garbage out.
* Developers love AI that does the boilerplate, provided they retain the final say (the PR review).

## 🚀 Next Steps
* **Jira/Linear Integration:** Automatically sync extracted tasks to project management tools before coding.
* **Slack Bot Interface:** Allow developers to tag the bot in a Slack huddle or channel to trigger a PR generation without a formal meeting.
* **Multi-Agent Collaboration:** Deploy multiple agents simultaneously to tackle different issues extracted from the same meeting.

## ❤️ Why DevJarvis
Because a developer's time is best spent reviewing, architecting, and innovating—not manually translating meeting notes into boilerplate. With DevJarvis, your repository grows while you talk.
