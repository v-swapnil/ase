import { create } from 'zustand';

interface UIState {
  activeFilePath: string | null;
  setActiveFile: (p: string | null) => void;
  dirty: Record<string, string | undefined>;     // pathKey -> in-memory content
  setDirty: (pathKey: string, content: string | undefined) => void;
  clearDirty: (pathKey: string) => void;
}

export const useUI = create<UIState>((set) => ({
  activeFilePath: null,
  setActiveFile: (p) => set({ activeFilePath: p }),
  dirty: {},
  setDirty: (pathKey, content) =>
    set((s) => ({ dirty: { ...s.dirty, [pathKey]: content } })),
  clearDirty: (pathKey) =>
    set((s) => {
      const next = { ...s.dirty };
      delete next[pathKey];
      return { dirty: next };
    }),
}));

export const dirtyKey = (workspaceId: string, path: string) => `${workspaceId}::${path}`;
