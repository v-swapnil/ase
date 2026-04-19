import { EventEmitter } from 'node:events';

export type TaskEvent =
  | { type: 'task.started'; taskId: string; ts: number }
  | { type: 'task.finished'; taskId: string; ts: number; status: 'succeeded' | 'failed' | 'cancelled'; result?: unknown; error?: string }
  | { type: 'task.iteration'; taskId: string; ts: number; iteration: number }
  | { type: 'plan'; taskId: string; ts: number; plan: unknown }
  | { type: 'step.started'; taskId: string; ts: number; stepId: string; agent: string; tool?: string; input?: unknown }
  | { type: 'step.finished'; taskId: string; ts: number; stepId: string; ok: boolean; output?: unknown; error?: string }
  | { type: 'log'; taskId: string; ts: number; stream: 'stdout' | 'stderr'; text: string; stepId?: string }
  | { type: 'llm.delta'; taskId: string; ts: number; agent: string; content: string }
  | { type: 'critic'; taskId: string; ts: number; verdict: { done: boolean; reason: string; nextHint?: string } }
  | { type: 'approval.requested'; taskId: string; ts: number; approvalId: string; tool: string; args: unknown }
  | { type: 'approval.decided'; taskId: string; ts: number; approvalId: string; decision: 'approve' | 'approve_session' | 'deny' };

class TaskBus {
  private bus = new EventEmitter();
  constructor() {
    this.bus.setMaxListeners(0);
  }
  emit(taskId: string, event: TaskEvent): void {
    this.bus.emit(taskId, event);
    this.bus.emit('*', event);
  }
  on(taskId: string, listener: (e: TaskEvent) => void): () => void {
    this.bus.on(taskId, listener);
    return () => this.bus.off(taskId, listener);
  }
  onAny(listener: (e: TaskEvent) => void): () => void {
    this.bus.on('*', listener);
    return () => this.bus.off('*', listener);
  }
}

export const taskBus = new TaskBus();
