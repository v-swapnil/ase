import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { memories } from '../db/schema.js';

export const MEMORY_TYPES = [
  'semantic',
  'episodic',
  'procedural',
  'preference',
  'fact',
  'summary',
  'observation',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export interface MemoryRecord {
  id: number;
  type: MemoryType;
  content: string;
  sessionId: string;
  taskId: string | null;
  createdAt: number;
}

export function listSessionMemories(sessionId: string): MemoryRecord[] {
  return getDb()
    .select()
    .from(memories)
    .where(eq(memories.sessionId, sessionId))
    .orderBy(desc(memories.createdAt), desc(memories.id))
    .all() as MemoryRecord[];
}

export function addSessionMemory(input: {
  sessionId: string;
  taskId?: string | null;
  type: MemoryType;
  content: string;
}): MemoryRecord {
  const row: MemoryRecord = {
    id: 0,
    sessionId: input.sessionId,
    taskId: input.taskId ?? null,
    type: input.type,
    content: input.content.trim(),
    createdAt: Date.now(),
  };
  const result = getDb()
    .insert(memories)
    .values({
      type: row.type,
      content: row.content,
      sessionId: row.sessionId,
      taskId: row.taskId,
      createdAt: row.createdAt,
    })
    .run();
  row.id = Number(result.lastInsertRowid);
  return row;
}

export function deleteSessionMemories(sessionId: string): void {
  getDb().delete(memories).where(eq(memories.sessionId, sessionId)).run();
}

export function listTaskMemories(taskId: string): MemoryRecord[] {
  return getDb()
    .select()
    .from(memories)
    .where(and(eq(memories.taskId, taskId)))
    .orderBy(desc(memories.createdAt), desc(memories.id))
    .all() as MemoryRecord[];
}

