import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { shell } from 'electron';
import { router, publicProcedure } from './trpc.js';
import {
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  addMessage,
  listMessages,
  createTask,
  getTask,
  listTasks,
  listSteps,
} from '../services/store.js';
import { enqueueTask, cancelQueuedOrRunning } from '../orchestrator/queue.js';
import { taskBus, type TaskEvent } from '../services/events.js';
import { exportTaskReport } from '../services/reports.js';

export const sessionRouter = router({
  create: publicProcedure
    .input(z.object({ workspaceId: z.string().min(1), title: z.string().min(1) }))
    .mutation(({ input }) => createSession(input.workspaceId, input.title)),

  list: publicProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(({ input }) => listSessions(input?.workspaceId)),

  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getSession(input.id)),

  rename: publicProcedure
    .input(z.object({ id: z.string().min(1), title: z.string().min(1) }))
    .mutation(({ input }) => {
      renameSession(input.id, input.title);
      return { ok: true as const };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      deleteSession(input.id);
      return { ok: true as const };
    }),

  addMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .mutation(({ input }) => addMessage(input.sessionId, input.role, input.content)),

  messages: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(({ input }) => listMessages(input.sessionId)),
});

export const taskRouter = router({
  create: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        prompt: z.string().min(1),
        maxIterations: z.number().int().min(1).max(20).optional(),
        autostart: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      const task = createTask(input.sessionId, input.prompt, input.maxIterations);
      addMessage(input.sessionId, 'user', input.prompt);
      if (input.autostart !== false) enqueueTask(task.id);
      return task;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getTask(input.id)),

  list: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(({ input }) => listTasks(input.sessionId)),

  steps: publicProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .query(({ input }) => listSteps(input.taskId)),

  start: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      enqueueTask(input.id);
      return { ok: true as const };
    }),

  cancel: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => ({ ok: cancelQueuedOrRunning(input.id) })),

  retry: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      const orig = getTask(input.id);
      const next = createTask(orig.sessionId, orig.prompt, orig.maxIterations);
      enqueueTask(next.id);
      return next;
    }),

  exportReport: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const out = await exportTaskReport(input.id);
      shell.showItemInFolder(out.markdownPath);
      return out;
    }),

  events: publicProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .subscription(({ input }) => {
      return observable<TaskEvent>((emit) => {
        const off = taskBus.on(input.taskId, (e) => emit.next(e));
        return () => off();
      });
    }),
});
