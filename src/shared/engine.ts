import type { Action, Session, Span, StudyData } from './types';

export const freshData = (): StudyData => ({
  version: 1,
  settings: { dailyGoalMinutes: 120, lastSubject: '' },
  sessions: [],
  active: null,
});

export function sessionSpans(session: Session | StudyData['active'], now: number): Span[] {
  if (!session) return [];
  const spans = [...session.spans];
  if ('runningSince' in session && session.runningSince !== null)
    spans.push({ start: session.runningSince, end: Math.max(session.runningSince, now) });
  return spans;
}

export function duration(session: Session | StudyData['active'], now: number): number {
  return sessionSpans(session, now).reduce(
    (sum, span) => sum + Math.max(0, span.end - span.start),
    0,
  );
}

function pause(data: StudyData, now: number) {
  if (data.active?.runningSince !== null && data.active) {
    const start = data.active.runningSince;
    const end = Math.max(start, now);
    if (end > start) data.active.spans.push({ start, end });
    data.active.runningSince = null;
    data.active.checkpointAt = end;
  }
}

export function transition(current: StudyData, action: Action, now: number): StudyData {
  const data = structuredClone(current);
  if (action.type === 'goal') {
    if (!Number.isInteger(action.minutes) || action.minutes < 5 || action.minutes > 1440)
      throw new Error('Hedef 5 ile 1440 dakika arasında olmalı.');
    data.settings.dailyGoalMinutes = action.minutes;
  } else if (action.type === 'toggle') {
    if (data.active?.runningSince != null) pause(data, now);
    else if (data.active) {
      data.active.runningSince = Math.max(now, data.active.checkpointAt);
      data.active.checkpointAt = data.active.runningSince;
    } else {
      const subject =
        (action.subject ?? data.settings.lastSubject).trim().slice(0, 120) || 'Genel çalışma';
      data.settings.lastSubject = subject;
      data.active = {
        id: crypto.randomUUID(),
        subject,
        createdAt: now,
        endedAt: null,
        spans: [],
        runningSince: now,
        checkpointAt: now,
      };
    }
  } else if (action.type === 'finish') {
    pause(data, now);
    if (data.active) {
      const { runningSince: _running, checkpointAt: _checkpoint, ...session } = data.active;
      if (duration(session, now) > 0)
        data.sessions.unshift({
          ...session,
          endedAt: Math.max(now, session.createdAt, _checkpoint),
        });
      data.active = null;
    }
  } else throw new Error('Geçersiz işlem.');
  return data;
}

export function recover(data: StudyData): StudyData {
  const result = structuredClone(data);
  if (result.active) pause(result, result.active.checkpointAt);
  return result;
}

export function checkpoint(current: StudyData, now: number): StudyData {
  const data = structuredClone(current);
  if (data.active?.runningSince != null)
    data.active.checkpointAt = Math.max(data.active.runningSince, data.active.checkpointAt, now);
  return data;
}

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dailyTotals(data: StudyData, now: number): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const session of [...data.sessions, ...(data.active ? [data.active] : [])]) {
    for (const span of sessionSpans(session, now)) {
      let cursor = span.start;
      while (cursor < span.end) {
        const date = new Date(cursor);
        const midnight = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1,
        ).getTime();
        const end = Math.min(span.end, midnight);
        const key = dayKey(cursor);
        totals[key] = (totals[key] ?? 0) + end - cursor;
        cursor = end;
      }
    }
  }
  return totals;
}

export function sessionOnDay(
  session: Session | StudyData['active'],
  day: string,
  now: number,
): number {
  return (
    dailyTotals(
      {
        ...freshData(),
        sessions: session
          ? [
              {
                id: session.id,
                subject: session.subject,
                createdAt: session.createdAt,
                endedAt: session.endedAt,
                spans: sessionSpans(session, now),
              },
            ]
          : [],
      },
      now,
    )[day] ?? 0
  );
}

export function recentDays(now: number, count: number): { key: string; date: Date }[] {
  const today = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - count + i + 1);
    return { key: dayKey(date.getTime()), date };
  });
}

export function clockText(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function humanDuration(ms: number): string {
  if (ms > 0 && ms < 60000) return `${Math.floor(ms / 1000)} sn`;
  const minutes = Math.floor(ms / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} sa ${minutes % 60} dk` : `${minutes} dk`;
}

// Diskten gelen veriyi doğrulamadan kullanmayız; bozuk kayıtlar sessizce silinmez.
export function validData(value: unknown): value is StudyData {
  if (!value || typeof value !== 'object') return false;
  const data = value as StudyData;
  if (
    data.version !== 1 ||
    !data.settings ||
    !Number.isInteger(data.settings.dailyGoalMinutes) ||
    data.settings.dailyGoalMinutes < 5 ||
    data.settings.dailyGoalMinutes > 1440 ||
    typeof data.settings.lastSubject !== 'string' ||
    !Array.isArray(data.sessions)
  )
    return false;
  const stamp = (n: unknown): n is number =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 8640000000000000;
  const sessionValid = (session: Session): boolean => {
    if (
      !session ||
      typeof session.id !== 'string' ||
      typeof session.subject !== 'string' ||
      !stamp(session.createdAt) ||
      !Array.isArray(session.spans)
    )
      return false;
    let end = session.createdAt;
    for (const span of session.spans) {
      if (
        !span ||
        !stamp(span.start) ||
        !stamp(span.end) ||
        span.start < end ||
        span.end < span.start
      )
        return false;
      end = span.end;
    }
    return session.endedAt === null || (stamp(session.endedAt) && session.endedAt >= end);
  };
  if (!data.sessions.every((s) => sessionValid(s) && s.endedAt !== null)) return false;
  if (data.active !== null) {
    if (
      !sessionValid(data.active) ||
      data.active.endedAt !== null ||
      !stamp(data.active.checkpointAt)
    )
      return false;
    const lastEnd = data.active.spans.at(-1)?.end ?? data.active.createdAt;
    if (data.active.checkpointAt < lastEnd) return false;
    if (
      data.active.runningSince !== null &&
      (!stamp(data.active.runningSince) ||
        data.active.runningSince < lastEnd ||
        data.active.checkpointAt < data.active.runningSince)
    )
      return false;
  }
  return true;
}

export function csv(data: StudyData, now: number): string {
  const rows = Object.entries(dailyTotals(data, now)).sort(([a], [b]) => b.localeCompare(a));
  return (
    '\uFEFFTarih;Calisma suresi;Dakika;Saniye\r\n' +
    rows
      .map(
        ([day, ms]) =>
          `${day};${clockText(ms)};${(ms / 60000).toFixed(2)};${Math.floor(ms / 1000)}`,
      )
      .join('\r\n')
  );
}
