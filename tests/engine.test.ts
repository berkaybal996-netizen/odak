import { describe, expect, it } from 'vitest';
import {
  checkpoint,
  clockText,
  csv,
  dailyTotals,
  dayKey,
  duration,
  freshData,
  recover,
  sessionOnDay,
  transition,
  validData,
} from '../src/shared/engine';

describe('Çalışma süresinin doğruluğu', () => {
  it('molayı saymaz, devam edince aynı oturumda biriktirir', () => {
    let data = transition(freshData(), { type: 'toggle', subject: 'React' }, 1000);
    data = transition(data, { type: 'toggle' }, 61000);
    expect(duration(data.active, 999999)).toBe(60000);
    data = transition(data, { type: 'toggle' }, 181000);
    expect(duration(data.active, 211000)).toBe(90000);
    data = transition(data, { type: 'finish' }, 241000);
    expect(data.active).toBeNull();
    expect(data.sessions).toHaveLength(1);
    expect(duration(data.sessions[0], 999999)).toBe(120000);
    expect(data.sessions[0].subject).toBe('React');
    expect(validData(data)).toBe(true);
  });
  it('gece yarısını geçen süreyi doğru günlere böler', () => {
    const start = new Date(2026, 9, 17, 23, 50).getTime();
    const end = new Date(2026, 9, 18, 0, 20).getTime();
    let data = transition(freshData(), { type: 'toggle' }, start);
    expect(dailyTotals(data, end)).toEqual({ '2026-10-17': 600000, '2026-10-18': 1200000 });
    expect(sessionOnDay(data.active, '2026-10-18', end)).toBe(1200000);
    data = transition(data, { type: 'finish' }, end);
    expect(dailyTotals(data, end)).toEqual({ '2026-10-17': 600000, '2026-10-18': 1200000 });
  });
  it('iki günde yapılan tek oturumdaki gece molasını toplama katmaz', () => {
    let data = transition(freshData(), { type: 'toggle' }, new Date(2026, 9, 17, 23, 40).getTime());
    data = transition(data, { type: 'toggle' }, new Date(2026, 9, 17, 23, 50).getTime());
    data = transition(data, { type: 'toggle' }, new Date(2026, 9, 18, 0, 30).getTime());
    const end = new Date(2026, 9, 18, 0, 40).getTime();
    data = transition(data, { type: 'finish' }, end);
    expect(dailyTotals(data, end)).toEqual({ '2026-10-17': 600000, '2026-10-18': 600000 });
  });
  it('çökmeden sonra kapalı geçirilen zamanı eklemez', () => {
    let data = transition(freshData(), { type: 'toggle' }, 1000);
    data = checkpoint(data, 61000);
    const recovered = recover(JSON.parse(JSON.stringify(data)));
    expect(recovered.active?.runningSince).toBeNull();
    expect(duration(recovered.active, 999999999)).toBe(60000);
    expect(validData(recovered)).toBe(true);
    expect(recover(recovered)).toEqual(recovered);
  });
  it('aktif oturumu günlük listede iki kez saymaz', () => {
    const start = Date.now();
    const data = transition(freshData(), { type: 'toggle' }, start);
    expect(sessionOnDay(data.active, dayKey(start), start + 30000)).toBe(30000);
  });
  it('sıfır süreli ve tekrar bitirilen oturumları çoğaltmaz', () => {
    let data = transition(freshData(), { type: 'toggle' }, 1000);
    data = transition(data, { type: 'finish' }, 1000);
    data = transition(data, { type: 'finish' }, 2000);
    expect(data.sessions).toEqual([]);
  });
  it('ayar sınırlarını ve dosya şemasını doğrular', () => {
    expect(validData(freshData())).toBe(true);
    expect(validData({})).toBe(false);
    expect(validData({ ...freshData(), active: undefined })).toBe(false);
    expect(() => transition(freshData(), { type: 'goal', minutes: 0 }, 1000)).toThrow();
    expect(() => transition(freshData(), { type: 'goal', minutes: NaN }, 1000)).toThrow();
    expect(
      transition(freshData(), { type: 'goal', minutes: 45 }, 1000).settings.dailyGoalMinutes,
    ).toBe(45);
  });
  it('bozuk veya çakışan zaman aralıklarını reddeder', () => {
    const data = transition(freshData(), { type: 'toggle' }, 1000);
    data.active!.spans = [
      { start: 1000, end: 3000 },
      { start: 2000, end: 4000 },
    ];
    expect(validData(data)).toBe(false);
  });
  it('CSV toplamları ve saat gösterimi süreyi doğru yansıtır', () => {
    const start = new Date(2026, 9, 18, 10).getTime();
    let data = transition(freshData(), { type: 'toggle' }, start);
    data = transition(data, { type: 'finish' }, start + 3661000);
    expect(clockText(3661000)).toBe('01:01:01');
    expect(csv(data, start + 9999999)).toContain('2026-10-18;01:01:01;61.02;3661');
  });
});
