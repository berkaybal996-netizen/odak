import { useState } from 'react';
import { IconButton } from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { dayKey, humanDuration, recentDays } from '../shared/engine';
import { dateLabel } from '../shared/format';

export function WeekChart({ totals, now }: { totals: Record<string, number>; now: number }) {
  const [offset, setOffset] = useState(0);
  const end = new Date(now);
  end.setDate(end.getDate() + offset * 7);
  const days = recentDays(end.getTime(), 7);
  const maximum = Math.max(3600000, ...days.map((day) => totals[day.key] ?? 0));
  const total = days.reduce((sum, day) => sum + (totals[day.key] ?? 0), 0);

  return (
    <section className="paper week-card" aria-label="Haftalık çalışma grafiği">
      <div className="section-heading">
        <h2>Haftaya bir bakış</h2>
        <div className="week-navigation">
          <IconButton aria-label="Önceki hafta" size="small" onClick={() => setOffset(offset - 1)}>
            <ChevronLeftRounded fontSize="small" />
          </IconButton>
          <span>
            {dateLabel(days[0].date, { day: 'numeric', month: 'short' })} –{' '}
            {dateLabel(days[6].date, { day: 'numeric', month: 'short' })}
          </span>
          <IconButton
            aria-label="Sonraki hafta"
            size="small"
            disabled={offset >= 0}
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRightRounded fontSize="small" />
          </IconButton>
        </div>
      </div>
      <p className="chart-total">
        {humanDuration(total)} <span>bu yedi günde</span>
      </p>
      <div className="chart">
        {days.map((day) => {
          const ms = totals[day.key] ?? 0;
          const today = day.key === dayKey(now);
          return (
            <div
              className={`chart-day ${today ? 'today' : ''}`}
              key={day.key}
              aria-label={`${dateLabel(day.date)}: ${humanDuration(ms)}`}
            >
              <span className="bar-value">{humanDuration(ms)}</span>
              <div className="bar-slot">
                <div
                  className={`chart-bar ${ms ? 'filled' : ''}`}
                  style={{ height: `${Math.max(4, (ms / maximum) * 100)}%` }}
                />
              </div>
              <span className="bar-label">
                {today ? 'Bugün' : dateLabel(day.date, { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
