import { useEffect, useState } from 'react';
import { Alert, Button, IconButton, Snackbar, Tooltip } from '@mui/material';
import HomeRounded from '@mui/icons-material/HomeRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import CloseRounded from '@mui/icons-material/CloseRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import { useStudyTimer } from './hooks/useStudyTimer';
import { Timer, TimerControls } from './components/Timer';
import { Subjects } from './components/Subjects';
import { WeekChart } from './components/WeekChart';
import { SessionList } from './components/SessionList';
import { History } from './components/History';
import { SettingsDialog } from './components/SettingsDialog';
import {
  clockText,
  dailyTotals,
  dayKey,
  duration,
  humanDuration,
  recentDays,
  sessionOnDay,
} from './shared/engine';
import { dateLabel } from './shared/format';

export default function App() {
  const study = useStudyTimer();
  const { data, info, now, subject, compact, toggle, finish, changeWindow } = study;
  const [tab, setTab] = useState<'focus' | 'history'>('focus');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ready = data !== null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab, compact]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.code !== 'Space' ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        settingsOpen ||
        !ready
      )
        return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, button, a, [role="button"], [contenteditable="true"]'))
        return;
      event.preventDefault();
      toggle();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, settingsOpen, ready]);

  if (study.loadError)
    return (
      <div className="p-8">
        <Alert severity="error">Kayıtlar açılamadı: {study.loadError}</Alert>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <span className="profile-mark">BAL</span>
        <p>Çalışma masan açılıyor…</p>
      </div>
    );

  const running = data.active?.runningSince != null;
  const elapsed = duration(data.active, now);
  const totals = dailyTotals(data, now);
  const todayKey = dayKey(now);
  const today = totals[todayKey] ?? 0;
  const week = recentDays(now, 7).reduce((sum, day) => sum + (totals[day.key] ?? 0), 0);
  const allSessions = [...(data.active ? [data.active] : []), ...data.sessions];
  const todaysSessions = allSessions.filter((session) => sessionOnDay(session, todayKey, now) > 0);
  const controls = { running, hasSession: !!data.active, onToggle: toggle, onFinish: finish };

  return (
    <div className={`app ${compact ? 'compact-app' : ''}`}>
      <div className="titlebar">
        <span>
          odak <span className="titlebar-divider">/</span> BAL’ın çalışma masası
        </span>
        <div className="window-actions">
          {compact && (
            <IconButton
              aria-label="Tam pencereye dön"
              size="small"
              onClick={() => changeWindow('compact')}
            >
              <OpenInFullRounded sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {info?.desktop && (
            <>
              <IconButton
                aria-label="Pencereyi küçült"
                size="small"
                onClick={() => changeWindow('minimize')}
              >
                <RemoveRounded sx={{ fontSize: 18 }} />
              </IconButton>
              <Tooltip title="Duraklat ve sistem tepsisine küçült">
                <IconButton
                  aria-label="Duraklat ve pencereyi kapat"
                  size="small"
                  className="close-window"
                  onClick={() => changeWindow('close')}
                >
                  <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {compact ? (
        <main className="compact-content">
          <p className="compact-subject">
            <span className={`status-dot ${running ? 'live' : ''}`} />
            {data.active?.subject || subject || 'BAL’ın çalışma masası'}
          </p>
          <div className="compact-time" role="timer" aria-label="Çalışma süresi">
            {clockText(elapsed)}
          </div>
          <TimerControls {...controls} />
          <p className="compact-hint">
            {info?.desktop && info.shortcut ? 'Ctrl + Alt + Boşluk' : 'Boşluk'} ile başlat /
            duraklat
          </p>
        </main>
      ) : (
        <>
          <main className="workspace">
            <header className="page-header">
              <div className="profile-row">
                <span className="profile-mark" aria-label="BAL">
                  BAL
                </span>
                <span className="brand-word">
                  odak<span>.</span>
                </span>
                <Tooltip title="Ayarlar">
                  <IconButton
                    className="round-action"
                    aria-label="Ayarları aç"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <SettingsOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="greeting-row">
                <div>
                  <h1>{tab === 'focus' ? 'Merhaba, BAL' : 'Çalışma defterin, BAL'}</h1>
                  <p>{tab === 'focus' ? 'Bugün ne çalışıyoruz?' : 'Gün gün, kaldığı yerden.'}</p>
                </div>
                <time className="page-date" dateTime={todayKey}>
                  {dateLabel(now, { day: 'numeric', month: 'long' })}
                  <span>{dateLabel(now, { weekday: 'long' })}</span>
                </time>
              </div>
            </header>

            {tab === 'focus' ? (
              <>
                <section className="summary-strip" aria-label="Çalışma özeti">
                  <div>
                    <span>Bugünkü çalışman</span>
                    <strong>{humanDuration(today)}</strong>
                  </div>
                  <div>
                    <span>Son 7 gün</span>
                    <strong>{humanDuration(week)}</strong>
                  </div>
                  <div>
                    <span>Bugünkü oturumlar</span>
                    <strong>
                      {todaysSessions.length} <small>oturum</small>
                    </strong>
                  </div>
                  <span className="summary-icon" aria-hidden="true">
                    <TimerOutlined />
                  </span>
                </section>
                <div className="desk-heading">
                  <h2>Çalışma masan</h2>
                  <span>Bir konu seç ya da kendin yaz.</span>
                </div>
                <div className="study-grid">
                  <Timer
                    {...controls}
                    elapsed={elapsed}
                    subject={data.active?.subject ?? subject}
                    onSubjectChange={study.setSubject}
                    onCompact={() => changeWindow('compact')}
                  />
                  <Subjects
                    selected={data.active?.subject ?? subject}
                    locked={!!data.active}
                    today={today}
                    goal={data.settings.dailyGoalMinutes * 60000}
                    onSelect={study.setSubject}
                    onEditGoal={() => setSettingsOpen(true)}
                  />
                </div>
                <div className="journal-grid">
                  <WeekChart totals={totals} now={now} />
                  <section className="paper today-card">
                    <div className="section-heading">
                      <h2>
                        Bugünün notu <span className="count-badge">{todaysSessions.length}</span>
                      </h2>
                      <Button
                        size="small"
                        endIcon={<ArrowForwardRounded />}
                        onClick={() => setTab('history')}
                      >
                        Tümü
                      </Button>
                    </div>
                    <SessionList sessions={todaysSessions} now={now} day={todayKey} />
                  </section>
                </div>
              </>
            ) : (
              <History data={data} totals={totals} now={now} onExport={study.exportCsv} />
            )}
            <footer className="page-footer">
              <span>
                <span className={`status-dot ${running ? 'live' : ''}`} />
                {running ? 'Süren kaydediliyor' : 'Molalar çalışma sürene eklenmez'}
              </span>
              <span>
                {info?.desktop
                  ? 'BAL’a ait, bu bilgisayarda.'
                  : 'Tarayıcı önizlemesi · ayrı kayıtlar'}
              </span>
            </footer>
          </main>

          <nav className="bottom-nav" aria-label="Ana menü">
            <button
              className={tab === 'focus' ? 'selected' : ''}
              aria-current={tab === 'focus' ? 'page' : undefined}
              onClick={() => setTab('focus')}
            >
              <HomeRounded />
              <span>Masam</span>
            </button>
            <button
              className={tab === 'history' ? 'selected' : ''}
              aria-current={tab === 'history' ? 'page' : undefined}
              onClick={() => setTab('history')}
            >
              <BarChartRounded />
              <span>Geçmiş</span>
            </button>
            <button onClick={() => setSettingsOpen(true)}>
              <SettingsOutlined />
              <span>Ayarlar</span>
            </button>
          </nav>
        </>
      )}

      {settingsOpen && (
        <SettingsDialog
          minutes={data.settings.dailyGoalMinutes}
          info={info}
          onClose={() => setSettingsOpen(false)}
          onSave={(minutes) => study.runAction({ type: 'goal', minutes })}
          onExport={study.exportCsv}
        />
      )}
      <Snackbar
        open={!!study.notice}
        autoHideDuration={study.notice?.error ? 12000 : 4000}
        onClose={() => study.setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: compact ? 16 : 90 }}
      >
        <Alert
          severity={study.notice?.error ? 'error' : 'success'}
          onClose={() => study.setNotice(null)}
          variant="filled"
        >
          {study.notice?.text}
        </Alert>
      </Snackbar>
    </div>
  );
}
