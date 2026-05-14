# Local Workflow Agent

Local Workflow Agent is a local-first Electron desktop app for running software engineering tasks through an agentic workflow. A user connects or creates a workspace, starts a session, describes a task in natural language, and Local Workflow Agent plans, edits, runs commands, tests, asks for approvals, tracks history, and reports the result.

The app is built as a TypeScript Electron application with a React renderer, a Node main process, SQLite persistence, typed tRPC IPC, local Ollama support, optional GitHub Copilot CLI integration, and a tool registry for file, shell, git, memory, and user-interaction actions.

## What It Does

- Runs coding tasks from natural-language prompts.
- Maintains sessions, messages, tasks, steps, approvals, memories, and task event history.
- Supports an Ollama-backed local agent loop with planner, executor, tester, and critic stages.
- Supports an optional Copilot-backed execution path through `@github/copilot-sdk` and a running Copilot CLI server.
- Streams LLM output, tool logs, task events, approvals, and final status to the UI.
- Manages local workspaces, attached folders, and optional git worktrees per session.
- Provides pages for sessions, kanban, changes, editor, worktrees, skills, agents, schedules, tools, and settings.
- Includes a Monaco editor, git diff/change views, skill management, model management, and tool playground utilities.
- Persists app state in a local SQLite database under Electron `userData`.

## Current Status

This repository is an active desktop-app implementation of the Local Workflow Agent concept. The implementation includes the Electron shell, renderer pages, IPC routers, SQLite schema/bootstrap, task queue, LangGraph orchestrator, Ollama provider, Copilot integration layer, git/worktree services, tool registry, skills, and reporting utilities.

Some roadmap documents in `docs/` describe planned or historical phases. The codebase should be treated as the source of truth when a document and implementation disagree.

## Tech Stack

| Layer                             | Technology                                        |
| --------------------------------- | ------------------------------------------------- |
| Desktop shell                     | Electron                                          |
| Build system                      | electron-vite and Vite                            |
| Language                          | TypeScript, ESM                                   |
| Renderer                          | React 18, React Router, Tailwind CSS              |
| Renderer state/data               | Zustand, TanStack Query, tRPC client              |
| Editor                            | Monaco Editor                                     |
| Main-renderer IPC                 | electron-trpc and tRPC                            |
| Database                          | better-sqlite3 and Drizzle ORM schema definitions |
| Agent orchestration               | LangGraph.js                                      |
| Local LLM provider                | Ollama                                            |
| Optional hosted/remote agent path | GitHub Copilot CLI via `@github/copilot-sdk`      |
| Git                               | simple-git                                        |
| Logging                           | pino                                              |
| Packaging                         | electron-builder                                  |
| Formatting/linting                | Prettier and ESLint                               |

## Architecture

```text
Electron app
|
|-- Renderer: React UI
|   |-- Sessions and task detail
|   |-- Kanban board
|   |-- Changes and diff review
|   |-- Monaco editor and file tree
|   |-- Skills, agents, schedules, tools, settings
|
|-- Preload
|   |-- Safe bridge for electron-trpc
|
`-- Main process: Node services
    |-- tRPC router
    |-- SQLite database bootstrap and access
    |-- Workspace and file services
    |-- Task queue and runner
    |-- LangGraph agent loop
    |-- Ollama provider
    |-- Copilot runner
    |-- Tool registry
    |-- Git and worktree services
    |-- Approval, memory, report, settings, and event services
```

### Task Execution Flow

```text
User prompt
  -> session/task row is created
  -> task is queued
  -> runner resolves workspace or session worktree
  -> active provider is read from settings
  -> Ollama path: planner -> executor/tools -> tester -> critic -> repeat if needed
  -> Copilot path: Copilot SDK session runs task and bridges events back to Local Workflow Agent
  -> task result, steps, events, and reports are persisted
  -> UI updates through tRPC queries/subscriptions
```

### Ollama Mode

Ollama mode is the local-first path. It uses `src/main/orchestrator/graph.ts` to build a LangGraph state graph and `src/main/services/llm/ollama.ts` to call Ollama's chat API. The default model constant is:

```text
qwen2.5-coder:7b
```

The active model is configurable from Settings and persisted in SQLite.

### Copilot Mode

Copilot mode is optional. The app can connect to a running Copilot CLI server through `@github/copilot-sdk`. The provider setting switches task execution between the local Ollama graph and the Copilot runner.

Defaults:

```text
Provider: ollama
Copilot CLI URL: localhost:49393
Copilot model: claude-sonnet-4.5
```

Copilot authentication is expected to come from `GH_TOKEN`, `GITHUB_TOKEN`, or the Copilot CLI's own stored authentication, depending on how the CLI server is started.

## Repository Layout

```text
.
|-- docs/                         Product notes and implementation plans
|-- skills/                       Bundled editable skill definitions
|-- src/
|   |-- main/                     Electron main process and backend services
|   |   |-- db/                   SQLite bootstrap and Drizzle schema
|   |   |-- ipc/                  tRPC routers exposed to renderer
|   |   |-- orchestrator/         Queue, runner, LangGraph, prompts, agents
|   |   |-- services/             Workspace, git, tools, LLM, settings, reports
|   |   `-- util/                 Path, JSON, patch, safe-path helpers
|   |-- preload/                  Electron preload bridge
|   |-- renderer/                 React application
|   |   |-- src/components/       Shared UI components
|   |   |-- src/pages/            Top-level app pages
|   |   |-- src/store/            Zustand stores
|   |   `-- src/styles/           Global Tailwind/CSS variables
|   `-- shared/                   Types, constants, agent contracts
|-- electron-builder.yml          Packaging config
|-- electron.vite.config.ts       Main/preload/renderer build config
|-- package.json                  Scripts and dependencies
|-- pnpm-lock.yaml                Locked dependency graph
|-- tailwind.config.ts            Renderer design tokens
|-- tsconfig*.json                TypeScript configs
`-- README.md                     Project overview and onboarding
```

## Prerequisites

- Node.js 20 or newer.
- pnpm.
- Git.
- Ollama, if using the default local provider.
- A pulled Ollama model, for example `qwen2.5-coder:7b`.
- Optional: a running Copilot CLI server if using Copilot provider mode.

Install pnpm if needed:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

Install and prepare Ollama if using local mode:

```bash
ollama pull qwen2.5-coder:7b
ollama serve
```

Ollama is expected at:

```text
http://127.0.0.1:11434
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the app in development mode:

```bash
pnpm dev
```

Open Settings in the app and confirm:

- Ollama is reachable, or switch the provider to Copilot if configured.
- An active model is selected.
- Queue concurrency, theme, text size, git auto-branching, and worktree settings are set as desired.

## Scripts

| Command            | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm dev`         | Start Electron/Vite development mode.                              |
| `pnpm build`       | Build main, preload, and renderer bundles.                         |
| `pnpm start`       | Preview the built Electron app.                                    |
| `pnpm typecheck`   | Run TypeScript checks for node and web configs.                    |
| `pnpm lint`        | Run ESLint over TypeScript and TSX files.                          |
| `pnpm format`      | Format the repository with Prettier.                               |
| `pnpm package`     | Build and package macOS zip artifacts for arm64 and x64.           |
| `pnpm package:mac` | Same macOS package command.                                        |
| `pnpm postinstall` | Rebuild native Electron dependencies, especially `better-sqlite3`. |

## Building And Packaging

Build production output:

```bash
pnpm build
```

Create macOS packages:

```bash
pnpm package:mac
```

Packaged artifacts are configured by `electron-builder.yml` and emitted to `release/`. The current internal app id is `com.ase.app` and the configured product name is `ASE`; update those release identifiers when completing the product rebrand.

## App Data Locations

Local Workflow Agent stores runtime data under Electron's `userData` directory for the app.

| Data                  | Location under `userData` |
| --------------------- | ------------------------- |
| SQLite database       | `ase.db`                  |
| Managed workspaces    | `workspaces/`             |
| Logs                  | `logs/`                   |
| Exported task reports | `logs/reports/`           |
| Editable skills       | `skills/`                 |
| Session worktrees     | `worktrees/`              |

The actual `userData` path depends on the operating system and Electron runtime. In the app, Settings includes an action to open the logs folder.

## Database

The database is initialized in `src/main/db/index.ts` using inline idempotent bootstrap SQL. Schema definitions live in `src/main/db/schema.ts`.

Main persisted tables include:

- `workspaces`
- `sessions`
- `messages`
- `tasks`
- `steps`
- `approvals`
- `skills`
- `agents`
- `schedules`
- `task_events`
- `settings`
- `memories`
- `worktrees`

The bootstrap currently performs additive compatibility migrations for fields such as session kanban lanes and task provider.

## IPC API Surface

The app exposes typed tRPC routers from `src/main/ipc/router.ts`.

| Router      | Responsibility                                                                        |
| ----------- | ------------------------------------------------------------------------------------- |
| `workspace` | Create, attach, list, delete, and select workspaces.                                  |
| `file`      | Read, write, rename, delete, and tree workspace files.                                |
| `llm`       | Provider health, model selection, model pull/delete, chat, streams, Copilot settings. |
| `tool`      | List and invoke registered tools, including streamed shell/tool output.               |
| `session`   | Sessions, messages, memories, kanban cards, lane overrides.                           |
| `task`      | Create, start, cancel, retry, inspect, stream, replay, and export tasks.              |
| `approval`  | Pending approvals, decisions, auto-approval, user-input responses.                    |
| `skill`     | List, create, toggle, refresh, reveal, and delete skills.                             |
| `git`       | Status, diffs, file-at-HEAD, branch creation, commits, auto-branch setting.           |
| `settings`  | Theme, text size, queue concurrency, logs, kanban, worktree settings.                 |
| `worktree`  | List, inspect, remove, delete, and open session worktrees.                            |

## Tools Available To Agents

Tools are registered in `src/main/services/tools/registry.ts`. Each tool has a Zod schema, a description, and an approval flag.

| Tool                    | Purpose                                     | Approval       |
| ----------------------- | ------------------------------------------- | -------------- |
| `read_file`             | Read a UTF-8 workspace file.                | No             |
| `write_file`            | Create or overwrite a UTF-8 workspace file. | Yes            |
| `apply_patch`           | Apply a unified diff.                       | Yes            |
| `list_dir`              | Return a directory tree.                    | No             |
| `grep`                  | Search workspace files.                     | No             |
| `run_shell`             | Run an allowlisted command in the sandbox.  | Yes            |
| `run_tests`             | Detect and run a test command.              | Yes            |
| `git_status`            | Return git status.                          | No             |
| `git_diff`              | Return unified git diff.                    | No             |
| `git_branch`            | Create and check out a local branch.        | Yes            |
| `git_commit`            | Stage all changes and commit.               | Yes            |
| `ask_user`              | Request user input during a task.           | Yes/user-gated |
| `read_session_memories` | Read persisted session memories.            | No             |
| `add_session_memory`    | Add session memory.                         | No             |

## Sandbox Model

Shell commands run through `src/main/services/sandbox.ts`.

Important behavior:

- Commands are executed with `spawn`, not shell expansion.
- The command name must be in an allowlist.
- Environment variables are scrubbed to a small safe set.
- Output capture is capped per stream.
- Commands have a timeout, with a hard maximum of 10 minutes.
- The process tree is killed on timeout or task cancellation.

The default allowlist includes common development commands such as `node`, `npm`, `pnpm`, `yarn`, `npx`, `tsc`, `vitest`, `jest`, `git`, `python`, `pytest`, `rg`, and basic file utilities.

## Skills

Bundled skills live in `skills/` and are mirrored into `userData/skills` on first run so they can be edited from the app.

Current bundled skills:

- `bug-fix`: diagnose and fix bugs from failures, stack traces, or incorrect behavior.
- `node-testing`: create and run Vitest-style tests for Node/TypeScript projects.
- `refactor-ts`: perform behavior-preserving TypeScript refactors.

Skills are Markdown files with frontmatter and a `SKILL.md` body. The skill service parses frontmatter with `gray-matter`, preserves enabled/disabled state in SQLite, and keeps disk and database rows in sync.

## Workspaces And Worktrees

Local Workflow Agent supports two workspace modes:

- Managed workspaces created under `userData/workspaces`.
- Existing folders attached from disk.

If worktrees are enabled and the workspace is a git repository, new sessions can get an isolated git worktree under:

```text
userData/worktrees/<workspaceId>/<sessionId>/
```

Session worktrees use branches named like:

```text
ase/session/<sessionId>
```

When a worktree is active, task execution uses the worktree path instead of the original workspace path. This lets tasks make changes without touching the main working tree directly.

## Git Behavior

Git support includes status, diffs, per-file diff helpers, file-at-HEAD lookup, branch creation, and commit-all.

A setting controls automatic per-task branching. When enabled and the session does not already have a worktree, successful tasks can be committed automatically with a generated commit message. Worktree-backed sessions skip per-task branch creation because the session already has its own branch.

## Renderer Pages

| Route        | Page        | Purpose                                                   |
| ------------ | ----------- | --------------------------------------------------------- |
| `/sessions`  | Sessions    | Chat/task workflow and task detail.                       |
| `/board`     | KanbanBoard | Session status board across lanes.                        |
| `/changes`   | Changes     | Git change review and diffs.                              |
| `/worktrees` | Worktrees   | Worktree management.                                      |
| `/editor`    | Editor      | File tree and Monaco editor.                              |
| `/skills`    | Skills      | Skill catalog and editing/management.                     |
| `/agents`    | Agents      | Agent-related UI.                                         |
| `/schedules` | Schedules   | Scheduled/background task UI.                             |
| `/tools`     | Tools       | Tool playground/debugging.                                |
| `/settings`  | Settings    | Models, provider, UI, logs, queue, git/worktree settings. |

Keyboard shortcuts include route switching with `Cmd/Ctrl+1` through `Cmd/Ctrl+8`, Settings with `Cmd/Ctrl+,`, and theme toggling with `Cmd/Ctrl+Shift+L`.

## Reports And Logs

Task reports can be exported through the task IPC API. Reports are written as both JSON and Markdown under:

```text
userData/logs/reports/
```

Each report includes task metadata, prompt, session/workspace context, steps, parsed inputs/outputs where possible, and final result data.

## Development Notes

- Prefer `pnpm` because the repository includes `pnpm-lock.yaml`.
- Keep main-process code in `src/main`, renderer code in `src/renderer`, and shared process-safe contracts in `src/shared`.
- Use existing path aliases: `@shared`, `@main`, and `@renderer`.
- Keep tool inputs validated with Zod schemas.
- Keep agent-visible contracts synchronized between `src/shared/agent.ts` and `src/main/services/tools/types.ts`.
- Treat `docs/` as helpful context, but verify against implementation before changing behavior.
- Avoid committing generated runtime data from Electron `userData`, `out/`, or `release/`.

## Troubleshooting

### Native module issues after install

`better-sqlite3` is a native dependency. If Electron fails to load it, run:

```bash
pnpm postinstall
```

Then restart development mode:

```bash
pnpm dev
```

### Ollama health is failing

Confirm Ollama is running and reachable:

```bash
ollama serve
```

Confirm the default model exists:

```bash
ollama list
```

If needed, pull it:

```bash
ollama pull qwen2.5-coder:7b
```

### No active model configured

Open Settings, select the provider, and choose an active model. The runner fails fast if no active model is configured.

### Shell tool command denied

The sandbox only runs allowlisted command names and does not execute through a shell. Add support deliberately in `src/main/services/sandbox.ts` if a new command is needed.

### Worktree was not created

Worktrees require a git repository with a resolvable `HEAD`. Non-git folders or repositories without commits fall back to the original workspace path.

## Useful Documents

- `docs/PRD.md`: product requirements and high-level goals.
- `docs/IMPLEMENTATION.md`: original detailed implementation plan.
- `docs/COPILOT_INTEGRATION.md`: Copilot provider architecture.
- `docs/WORKTREE_PLAN.md`: worktree isolation design.
- `docs/KANBAN.md`: kanban design notes.
- `docs/IMPL_CHANGES_PAGE.md`: changes page implementation notes.

## License

No license file is currently present in this repository. Add one before distributing or accepting external contributions.
