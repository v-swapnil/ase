import { shell } from 'electron';
import { z } from 'zod';
import { publicProcedure, router } from './trpc.js';
import { logsDir } from '../util/paths.js';
import { getSetting, setSetting, SETTING_KEYS } from '../services/settings.js';

const themeSchema = z.enum(['dark', 'light']);

export const settingsRouter = router({
  theme: publicProcedure.query(async () => {
    const saved = await getSetting(SETTING_KEYS.UI_THEME);
    return themeSchema.catch('dark').parse(saved ?? 'dark');
  }),

  setTheme: publicProcedure
    .input(z.object({ value: themeSchema }))
    .mutation(async ({ input }) => {
      await setSetting(SETTING_KEYS.UI_THEME, input.value);
      return { ok: true as const };
    }),

  queueConcurrency: publicProcedure.query(async () => {
    const saved = await getSetting(SETTING_KEYS.QUEUE_CONCURRENCY);
    const n = saved ? parseInt(saved, 10) : 1;
    return isNaN(n) || n < 1 ? 1 : Math.min(n, 8);
  }),

  setQueueConcurrency: publicProcedure
    .input(z.object({ value: z.number().int().min(1).max(8) }))
    .mutation(async ({ input }) => {
      await setSetting(SETTING_KEYS.QUEUE_CONCURRENCY, String(input.value));
      return { ok: true as const };
    }),

  openLogsFolder: publicProcedure.mutation(async () => {
    const dir = logsDir();
    await shell.openPath(dir);
    return { ok: true as const, path: dir };
  }),
});
