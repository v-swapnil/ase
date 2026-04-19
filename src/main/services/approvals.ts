import { EventEmitter } from 'node:events';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';
import { approvals } from '../db/schema.js';
import { taskBus } from './events.js';
import { getSetting } from './settings.js';
import type { ToolName } from './tools/types.js';

export type ApprovalDecision = 'approve' | 'approve_session' | 'deny';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  tool: ToolName;
  args: unknown;
  createdAt: number;
}

const SETTING_AUTO_APPROVE = 'autoApproveTools'; // "true" | "false"

interface Pending {
  request: ApprovalRequest;
  resolve: (d: ApprovalDecision) => void;
}

const pending = new Map<string, Pending>();
/** Per-task allowlist after user picks "approve for this task". */
const taskAllow = new Map<string, Set<ToolName>>();

const bus = new EventEmitter();
bus.setMaxListeners(0);

export async function isAutoApprove(): Promise<boolean> {
  return (await getSetting(SETTING_AUTO_APPROVE)) === 'true';
}

export async function setAutoApprove(value: boolean): Promise<void> {
  const { setSetting } = await import('./settings.js');
  await setSetting(SETTING_AUTO_APPROVE, value ? 'true' : 'false');
}

/**
 * Block until the user approves (or denies) a tool call.
 * Persists the request so the UI can show pending approvals across reloads.
 */
export async function requestApproval(
  taskId: string,
  tool: ToolName,
  args: unknown,
  signal?: AbortSignal,
): Promise<ApprovalDecision> {
  if (await isAutoApprove()) return 'approve';
  if (taskAllow.get(taskId)?.has(tool)) return 'approve';

  const req: ApprovalRequest = {
    id: nanoid(10),
    taskId,
    tool,
    args,
    createdAt: Date.now(),
  };

  getDb()
    .insert(approvals)
    .values({
      id: req.id,
      taskId,
      stepId: null,
      kind: tool,
      payloadJson: JSON.stringify(args).slice(0, 100_000),
      decision: 'pending',
      createdAt: req.createdAt,
      decidedAt: null,
    })
    .run();

  return new Promise<ApprovalDecision>((resolve, reject) => {
    pending.set(req.id, { request: req, resolve });
    taskBus.emit(taskId, {
      type: 'approval.requested',
      taskId,
      ts: Date.now(),
      approvalId: req.id,
      tool,
      args,
    } as never);
    bus.emit('changed');

    const onAbort = () => {
      pending.delete(req.id);
      reject(new Error('aborted'));
    };
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export function decideApproval(id: string, decision: ApprovalDecision): boolean {
  const p = pending.get(id);
  if (!p) return false;
  pending.delete(id);

  getDb()
    .update(approvals)
    .set({ decision, decidedAt: Date.now() })
    .where(eq(approvals.id, id))
    .run();

  if (decision === 'approve_session') {
    let set = taskAllow.get(p.request.taskId);
    if (!set) {
      set = new Set<ToolName>();
      taskAllow.set(p.request.taskId, set);
    }
    set.add(p.request.tool);
  }

  taskBus.emit(p.request.taskId, {
    type: 'approval.decided',
    taskId: p.request.taskId,
    ts: Date.now(),
    approvalId: id,
    decision,
  } as never);
  bus.emit('changed');

  p.resolve(decision === 'deny' ? 'deny' : 'approve');
  return true;
}

export function listPending(): ApprovalRequest[] {
  return Array.from(pending.values()).map((p) => p.request);
}

export function listPendingForTask(taskId: string): ApprovalRequest[] {
  return Array.from(pending.values())
    .filter((p) => p.request.taskId === taskId)
    .map((p) => p.request);
}

export function onApprovalsChanged(listener: () => void): () => void {
  bus.on('changed', listener);
  return () => bus.off('changed', listener);
}

/** Called when a task ends — clear any in-memory state for it. */
export function clearTaskApprovals(taskId: string): void {
  taskAllow.delete(taskId);
  for (const [id, p] of pending) {
    if (p.request.taskId === taskId) {
      pending.delete(id);
      p.resolve('deny');
    }
  }
}
