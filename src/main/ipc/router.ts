import { app } from 'electron';
import { z } from 'zod';
import { router, publicProcedure } from './trpc.js';
import { OLLAMA_URL } from '@shared/constants';
import type { AppHealth } from '@shared/types';
import { dbPath } from '../util/paths.js';
import { workspaceRouter, fileRouter } from './workspace.js';
import { llmRouter } from './llm.js';
import { toolRouter } from './tool.js';
import { sessionRouter, taskRouter } from './session.js';
import { approvalRouter } from './approval.js';
import { skillRouter } from './skill.js';
import { gitRouter } from './git.js';

async function checkOllama(): Promise<AppHealth['ollama']> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { ok: false, url: OLLAMA_URL };
    const data = (await res.json()) as { models?: { name: string }[] };
    return {
      ok: true,
      url: OLLAMA_URL,
      models: data.models?.map((m) => m.name) ?? [],
    };
  } catch {
    return { ok: false, url: OLLAMA_URL };
  }
}

export const appRouter = router({
  ping: publicProcedure.input(z.string().optional()).query(({ input }) => ({
    pong: input ?? 'pong',
    at: Date.now(),
  })),
  health: publicProcedure.query(async (): Promise<AppHealth> => {
    return {
      app: { name: 'ASE', version: app.getVersion() },
      db: { ok: true, path: dbPath() },
      ollama: await checkOllama(),
    };
  }),
  workspace: workspaceRouter,
  llm: llmRouter,
  file: fileRouter,
  tool: toolRouter,
  session: sessionRouter,
  task: taskRouter,
  approval: approvalRouter,
  skill: skillRouter,
  git: gitRouter,
});

export type AppRouter = typeof appRouter;
