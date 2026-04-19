import { getWorkspace } from '../services/workspaces.js';
import { getSetting, SETTING_KEYS } from '../services/settings.js';
import { taskBus } from '../services/events.js';
import {
  getTask,
  updateTask,
  type Task,
} from '../services/store.js';
import { getDb } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger.js';
import { clearTaskApprovals } from '../services/approvals.js';
import { buildGraph, type RunCtx, type AgentState } from './graph.js';
import type { TaskResult } from '@shared/agent';

const log = logger.child({ mod: 'runner' });

interface RunHandle {
  taskId: string;
  ctrl: AbortController;
  promise: Promise<TaskResult>;
}

const inflight = new Map<string, RunHandle>();

export function isRunning(taskId: string): boolean {
  return inflight.has(taskId);
}

export function cancelTask(taskId: string): boolean {
  const h = inflight.get(taskId);
  if (!h) return false;
  h.ctrl.abort();
  return true;
}

export async function runTask(taskId: string): Promise<TaskResult> {
  const existing = inflight.get(taskId);
  if (existing) return existing.promise;

  const ctrl = new AbortController();
  const promise = doRun(taskId, ctrl).finally(() => {
    inflight.delete(taskId);
  });
  inflight.set(taskId, { taskId, ctrl, promise });
  return promise;
}

async function doRun(taskId: string, ctrl: AbortController): Promise<TaskResult> {
  const task = getTask(taskId);
  const session = await loadSessionWorkspace(task);
  const model = (await getSetting(SETTING_KEYS.ACTIVE_MODEL)) ?? '';
  if (!model) {
    return finish(task, {
      status: 'failed',
      iterations: 0,
      plan: null,
      testReport: null,
      verdict: null,
      reason: 'no active model configured (Settings → Models)',
    });
  }

  updateTask(taskId, { status: 'running', startedAt: Date.now() });
  taskBus.emit(taskId, { type: 'task.started', taskId, ts: Date.now() });

  const ctx: RunCtx = {
    taskId,
    workspaceId: session.workspaceId,
    workspacePath: session.workspacePath,
    model,
    signal: ctrl.signal,
    stepIdx: { n: 0 },
  };

  try {
    const graph = buildGraph();
    const initial: Partial<AgentState> = {
      prompt: task.prompt,
      maxIterations: task.maxIterations,
    };
    // Cap recursion: planner + (executor+tester+critic) * maxIterations + slack
    const recursionLimit = 4 + task.maxIterations * 4;
    const final = (await graph.invoke(initial, {
      configurable: { runCtx: ctx },
      recursionLimit,
      signal: ctrl.signal,
    })) as AgentState;

    const succeeded = !!final.verdict?.done && !!final.testReport?.ok;
    const result: TaskResult = {
      status: succeeded ? 'succeeded' : 'failed',
      iterations: final.iteration,
      plan: final.plan,
      testReport: final.testReport,
      verdict: final.verdict,
      reason: succeeded
        ? final.verdict?.reason
        : final.verdict?.reason ?? 'iteration cap reached',
    };
    return finish(task, result);
  } catch (err) {
    const aborted = ctrl.signal.aborted;
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ taskId, err: msg }, 'task failed');
    return finish(task, {
      status: aborted ? 'cancelled' : 'failed',
      iterations: 0,
      plan: null,
      testReport: null,
      verdict: null,
      reason: msg,
    });
  }
}

function finish(task: Task, result: TaskResult): TaskResult {
  updateTask(task.id, {
    status: result.status,
    resultJson: JSON.stringify(result).slice(0, 200_000),
    iterations: result.iterations,
    finishedAt: Date.now(),
  });
  clearTaskApprovals(task.id);
  taskBus.emit(task.id, {
    type: 'task.finished',
    taskId: task.id,
    ts: Date.now(),
    status: result.status,
    result,
    error: result.status !== 'succeeded' ? result.reason : undefined,
  });
  return result;
}

async function loadSessionWorkspace(task: Task): Promise<{
  workspaceId: string;
  workspacePath: string;
}> {
  const sess = getDb().select().from(sessions).where(eq(sessions.id, task.sessionId)).get();
  if (!sess) throw new Error(`session not found for task ${task.id}`);
  const ws = await getWorkspace(sess.workspaceId);
  return { workspaceId: ws.id, workspacePath: ws.path };
}
