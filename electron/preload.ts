import { contextBridge, ipcRenderer } from 'electron';
import type { Action, StudyData } from '../src/shared/types';

contextBridge.exposeInMainWorld('odak', {
  read: () => ipcRenderer.invoke('study:read'),
  action: (action: Action) => ipcRenderer.invoke('study:action', action),
  info: () => ipcRenderer.invoke('study:info'),
  exportCsv: () => ipcRenderer.invoke('study:export'),
  window: (action: string) => ipcRenderer.invoke('study:window', action),
  subscribe: (callback: (data: StudyData) => void) => {
    const listener = (_event: unknown, data: StudyData) => callback(data);
    ipcRenderer.on('study:changed', listener);
    return () => ipcRenderer.removeListener('study:changed', listener);
  },
  onWindow: (callback: (compact: boolean) => void) => {
    const listener = (_event: unknown, compact: boolean) => callback(compact);
    ipcRenderer.on('study:compact', listener);
    return () => ipcRenderer.removeListener('study:compact', listener);
  },
  onError: (callback: (message: string) => void) => {
    const listener = (_event: unknown, message: string) => callback(message);
    ipcRenderer.on('study:error', listener);
    return () => ipcRenderer.removeListener('study:error', listener);
  },
});
