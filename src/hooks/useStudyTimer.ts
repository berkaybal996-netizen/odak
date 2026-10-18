import { useCallback, useEffect, useRef, useState } from 'react';
import { bridge } from '../bridge';
import type { Action, AppInfo, StudyData } from '../shared/types';

type Notice = { text: string; error?: boolean };

export function useStudyTimer() {
  const [data, setData] = useState<StudyData | null>(null);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [now, setNow] = useState(Date.now());
  const [subject, setSubject] = useState('');
  const [compact, setCompact] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadError, setLoadError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = bridge.subscribe((next) => setData(next));
    const unsubscribeWindow = bridge.onWindow(setCompact);
    const unsubscribeError = bridge.onError((text) => setNotice({ text, error: true }));

    Promise.all([bridge.read(), bridge.info()])
      .then(([initial, appInfo]) => {
        if (!mounted) return;
        setData(initial);
        setInfo(appInfo);
        setCompact(appInfo.compact);
        setSubject(initial.settings.lastSubject);
        if (appInfo.notice) setNotice({ text: appInfo.notice, error: true });
      })
      .catch((error) => {
        if (mounted) setLoadError(String(error));
      });

    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => {
      mounted = false;
      unsubscribe();
      unsubscribeWindow();
      unsubscribeError();
      window.clearInterval(interval);
    };
  }, []);

  const runAction = useCallback(async (action: Action) => {
    if (busy.current) return false;
    busy.current = true;
    try {
      setData(await bridge.action(action));
      setNow(Date.now());
      if (action.type === 'finish') setNotice({ text: 'Oturum kaydedildi.' });
      return true;
    } catch (error) {
      setNotice({ text: `İşlem kaydedilemedi: ${String(error)}`, error: true });
      return false;
    } finally {
      busy.current = false;
    }
  }, []);

  const toggle = useCallback(() => {
    void runAction({ type: 'toggle', subject });
  }, [runAction, subject]);

  const finish = () => {
    void runAction({ type: 'finish' });
  };
  const changeWindow = (action: 'minimize' | 'close' | 'compact') => {
    void bridge.window(action).catch((error) => setNotice({ text: String(error), error: true }));
  };

  const exportCsv = async () => {
    try {
      if (await bridge.exportCsv()) setNotice({ text: 'Günlük rapor kaydedildi.' });
    } catch (error) {
      setNotice({ text: `Rapor kaydedilemedi: ${String(error)}`, error: true });
    }
  };

  return {
    data,
    info,
    now,
    subject,
    setSubject,
    compact,
    notice,
    setNotice,
    loadError,
    runAction,
    toggle,
    finish,
    changeWindow,
    exportCsv,
  };
}
