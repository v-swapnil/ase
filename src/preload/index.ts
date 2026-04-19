import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { exposeElectronTRPC } from 'electron-trpc/main';

process.once('loaded', () => {
  exposeElectronTRPC();
});

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
  } catch (err) {
    console.error(err);
  }
}
