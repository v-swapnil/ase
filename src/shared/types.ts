// Domain types shared across processes. Expanded in later phases.

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type AgentRole = 'planner' | 'executor' | 'tester' | 'critic';
export type StepStatus = 'pending' | 'running' | 'ok' | 'error' | 'skipped';

export interface AppHealth {
  app: { name: string; version: string };
  db: { ok: boolean; path: string };
  ollama: { ok: boolean; url: string; models?: string[] };
}
