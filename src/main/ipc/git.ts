import { z } from 'zod';
import { router, publicProcedure } from './trpc.js';
import {
  workspaceStatusAtPath,
  workspaceDiffAtPath,
  showFileAtHeadAtPath,
  fileDiffAtPath,
  currentBranch,
  createBranch,
  commitAll,
} from '../services/git.js';
import { getSetting, setSetting, SETTING_KEYS } from '../services/settings.js';
import { getWorkspace } from '../services/workspaces.js';
import { getWorktree } from '../services/worktrees.js';

const workspaceIn = z.object({ workspaceId: z.string().min(1), worktreeId: z.string().optional() });

async function resolveGitPath(workspaceId: string, worktreeId?: string): Promise<string> {
  const ws = await getWorkspace(workspaceId);
  if (!worktreeId) return ws.path;
  const wt = getWorktree(worktreeId);
  if (!wt || wt.workspaceId !== workspaceId || wt.status !== 'active') return ws.path;
  return wt.path;
}

export const gitRouter = router({
  status: publicProcedure
    .input(workspaceIn)
    .query(async ({ input }) => workspaceStatusAtPath(await resolveGitPath(input.workspaceId, input.worktreeId))),
  diff: publicProcedure
    .input(workspaceIn.extend({ staged: z.boolean().optional() }))
    .query(async ({ input }) =>
      workspaceDiffAtPath(await resolveGitPath(input.workspaceId, input.worktreeId), !!input.staged),
    ),
  showFileAtHead: publicProcedure
    .input(workspaceIn.extend({ path: z.string().min(1) }))
    .query(async ({ input }) =>
      showFileAtHeadAtPath(await resolveGitPath(input.workspaceId, input.worktreeId), input.path),
    ),
  fileDiff: publicProcedure
    .input(workspaceIn.extend({ path: z.string().min(1), staged: z.boolean().optional() }))
    .query(async ({ input }) =>
      fileDiffAtPath(await resolveGitPath(input.workspaceId, input.worktreeId), input.path, !!input.staged),
    ),
  currentBranch: publicProcedure
    .input(workspaceIn)
    .query(({ input }) => currentBranch(input.workspaceId)),
  createBranch: publicProcedure
    .input(workspaceIn.extend({ name: z.string().min(1).max(120) }))
    .mutation(({ input }) => createBranch(input.workspaceId, input.name)),
  commitAll: publicProcedure
    .input(workspaceIn.extend({ message: z.string().min(1).max(500) }))
    .mutation(({ input }) => commitAll(input.workspaceId, input.message)),
  autoBranch: publicProcedure.query(async () => {
    return (await getSetting(SETTING_KEYS.GIT_AUTO_BRANCH)) === '1';
  }),
  setAutoBranch: publicProcedure
    .input(z.object({ value: z.boolean() }))
    .mutation(async ({ input }) => {
      await setSetting(SETTING_KEYS.GIT_AUTO_BRANCH, input.value ? '1' : '0');
      return { ok: true as const };
    }),
});
