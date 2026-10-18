import CheckRounded from '@mui/icons-material/CheckRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { dayKey, duration, humanDuration, sessionOnDay } from '../shared/engine';
import { dateLabel, timeLabel } from '../shared/format';
import type { ActiveSession, Session } from '../shared/types';

interface SessionListProps {
  sessions: (Session | ActiveSession)[];
  now: number;
  day?: string;
}

export function SessionList({ sessions, now, day }: SessionListProps) {
  if (!sessions.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <MenuBookOutlined />
        </span>
        <strong>Defter şimdilik boş.</strong>
        <p>Bitirdiğin çalışmalar buraya gelecek.</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      {sessions.map((session) => {
        const active = 'runningSince' in session;
        const running = active && session.runningSince != null;
        const elapsed = day ? sessionOnDay(session, day, now) : duration(session, now);

        return (
          <div className="session-row" key={session.id}>
            <span className={`session-symbol ${running ? 'live' : ''}`}>
              {running ? <NorthEastRounded /> : active ? <PauseRounded /> : <CheckRounded />}
            </span>
            <div className="session-subject">
              <strong title={session.subject}>{session.subject}</strong>
              <span>
                {timeLabel(session.createdAt)} —{' '}
                {active ? (running ? 'devam ediyor' : 'molada') : timeLabel(session.endedAt!)}
                {day &&
                  dayKey(session.createdAt) !== day &&
                  ` · ${dateLabel(session.createdAt)} başladı`}
              </span>
            </div>
            <strong className="session-duration">{humanDuration(elapsed)}</strong>
          </div>
        );
      })}
    </div>
  );
}
