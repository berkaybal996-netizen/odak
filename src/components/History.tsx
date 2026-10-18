import { useState } from 'react';
import { Button, TextField } from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import { dayKey, humanDuration, sessionOnDay } from '../shared/engine';
import { dateLabel } from '../shared/format';
import type { StudyData } from '../shared/types';
import { SessionList } from './SessionList';

interface HistoryProps {
  data: StudyData;
  totals: Record<string, number>;
  now: number;
  onExport: () => void;
}

export function History({ data, totals, now, onExport }: HistoryProps) {
  const [selected, setSelected] = useState(dayKey(now));
  const days = Object.entries(totals).sort(([a], [b]) => b.localeCompare(a));
  const all = [...(data.active ? [data.active] : []), ...data.sessions];
  const total = days.reduce((sum, [, ms]) => sum + ms, 0);

  return (
    <>
      <div className="summary-strip history-summary">
        <div>
          <span>Toplam çalışma</span>
          <strong>{humanDuration(total)}</strong>
        </div>
        <div>
          <span>Çalıştığın gün</span>
          <strong>
            {days.length} <small>gün</small>
          </strong>
        </div>
        <div>
          <span>Günlük ortalama</span>
          <strong>{humanDuration(days.length ? total / days.length : 0)}</strong>
        </div>
      </div>
      <section className="paper history-card">
        <div className="section-heading">
          <h2>Gün gün çalışmaların</h2>
          <Button
            size="small"
            startIcon={<DownloadRounded />}
            onClick={onExport}
            disabled={!days.length}
          >
            Raporu indir
          </Button>
        </div>
        {!days.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <CalendarTodayOutlined />
            </span>
            <strong>İlk kayıt için yer hazır.</strong>
            <p>Çalışma sürelerin her gün için ayrı tutulur.</p>
          </div>
        ) : (
          <div className="daily-list">
            {days.map(([day, ms]) => (
              <button
                key={day}
                className={`daily-row ${selected === day ? 'selected' : ''}`}
                onClick={() => setSelected(day)}
                aria-pressed={selected === day}
              >
                <span className="daily-date-icon">
                  <CalendarTodayOutlined fontSize="small" />
                </span>
                <span className="daily-date">
                  <strong>
                    {day === dayKey(now)
                      ? 'Bugün'
                      : dateLabel(new Date(`${day}T12:00:00`), {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                  </strong>
                  <small>{dateLabel(new Date(`${day}T12:00:00`), { weekday: 'long' })}</small>
                </span>
                <span className="daily-track">
                  <span
                    style={{
                      width: `${Math.min(100, (ms / (data.settings.dailyGoalMinutes * 60000)) * 100)}%`,
                    }}
                  />
                </span>
                <strong className="daily-duration">{humanDuration(ms)}</strong>
                <ChevronRightRounded fontSize="small" />
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="paper history-card">
        <div className="section-heading">
          <h2>{dateLabel(new Date(`${selected}T12:00:00`))} oturumları</h2>
          <TextField
            type="date"
            size="small"
            value={selected}
            onChange={(event) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) setSelected(event.target.value);
            }}
            slotProps={{ htmlInput: { 'aria-label': 'Oturum tarihi' } }}
          />
        </div>
        <SessionList
          sessions={all.filter((session) => sessionOnDay(session, selected, now) > 0)}
          now={now}
          day={selected}
        />
      </section>
    </>
  );
}
