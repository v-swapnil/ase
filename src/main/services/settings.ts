import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { settings } from '../db/schema.js';

export async function getSetting(key: string): Promise<string | undefined> {
  const row = getDb().select().from(settings).where(eq(settings.key, key)).get();
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ key, value }).run();
  }
}

export async function deleteSetting(key: string): Promise<void> {
  getDb().delete(settings).where(eq(settings.key, key)).run();
}

export const SETTING_KEYS = {
  ACTIVE_WORKSPACE: 'activeWorkspaceId',
  ACTIVE_MODEL: 'activeModel',
  GIT_AUTO_BRANCH: 'gitAutoBranch',
} as const;
