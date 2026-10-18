import { checkpoint, csv, freshData, recover, transition, validData } from './shared/engine';
import type { StudyBridge, StudyData } from './shared/types';

// Tarayıcı önizlemesi kendi ayrı deposunu kullanır. Masaüstünde bütün kayıtları
// Electron ana süreci yönetir; React doğrudan dosya sistemine erişmez.
function previewBridge(): StudyBridge {
  const key = 'odak.preview.v1';
  const listeners = new Set<(data: StudyData) => void>();
  const windowListeners = new Set<(compact: boolean) => void>();
  const errorListeners = new Set<(message: string) => void>();
  let compact = false;
  let notice = '';
  let data = freshData();
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!validData(parsed)) throw new Error();
      data = recover(parsed);
    } catch {
      notice = 'Tarayıcı kaydı okunamadı; eski kayıt koruma kopyasına alındı.';
      localStorage.setItem(`${key}.recovery-${Date.now()}`, stored);
    }
  }
  const persist = (next: StudyData) => {
    localStorage.setItem(key, JSON.stringify(next));
    data = next;
    listeners.forEach((callback) => callback(data));
  };
  persist(data);
  setInterval(() => {
    if (data.active?.runningSince != null) {
      try {
        persist(checkpoint(data, Date.now()));
      } catch {
        errorListeners.forEach((cb) => cb('Tarayıcı depolama alanına kayıt yapılamadı.'));
      }
    }
  }, 5000);
  window.addEventListener('beforeunload', () => {
    if (data.active?.runningSince != null)
      persist(transition(data, { type: 'toggle' }, Date.now()));
  });
  return {
    read: async () => data,
    action: async (action) => {
      persist(transition(data, action, Date.now()));
      return data;
    },
    info: async () => ({
      desktop: false,
      compact,
      shortcut: false,
      dataPath: 'Tarayıcı önizlemesine ait yerel kayıtlar',
      notice,
    }),
    subscribe: (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    onWindow: (callback) => {
      windowListeners.add(callback);
      return () => {
        windowListeners.delete(callback);
      };
    },
    onError: (callback) => {
      errorListeners.add(callback);
      return () => {
        errorListeners.delete(callback);
      };
    },
    window: async (action) => {
      if (action === 'compact') {
        compact = !compact;
        windowListeners.forEach((cb) => cb(compact));
      }
    },
    exportCsv: async () => {
      const url = URL.createObjectURL(
        new Blob([csv(data, Date.now())], { type: 'text/csv;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'odak-gunluk.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    },
  };
}
export const bridge = window.odak ?? previewBridge();
