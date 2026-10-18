import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadData, saveData } from '../electron/storage';
import { checkpoint, freshData, transition } from '../src/shared/engine';

const folders: string[] = [];
function testFile() {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'odak-test-'));
  folders.push(folder);
  return path.join(folder, 'odak.json');
}
afterEach(() => {
  for (const folder of folders.splice(0)) {
    const resolved = path.resolve(folder);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith('odak-test-')
    )
      throw new Error('Test temizleme yolu geçersiz.');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe('Disk kayıtları', () => {
  it('kapatıp açınca kayıtları ve hedefi korur', () => {
    const file = testFile();
    let data = transition(freshData(), { type: 'toggle', subject: 'TypeScript' }, 1000);
    data = transition(data, { type: 'finish' }, 31000);
    data = transition(data, { type: 'goal', minutes: 90 }, 31000);
    saveData(file, data);
    expect(loadData(file).data).toEqual(data);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
  });
  it('son kontrol noktasını yeniden açıldığında duraklatır', () => {
    const file = testFile();
    saveData(file, checkpoint(transition(freshData(), { type: 'toggle' }, 1000), 41000));
    const loaded = loadData(file);
    expect(loaded.data.active?.spans).toEqual([{ start: 1000, end: 41000 }]);
    expect(loaded.data.active?.runningSince).toBeNull();
    expect(loaded.notice).toContain('kurtarıldı');
  });
  it('ana dosya bozulursa yedeği açar ve bozuk dosyayı korur', () => {
    const file = testFile();
    const first = transition(freshData(), { type: 'goal', minutes: 45 }, 1000);
    saveData(file, first);
    saveData(file, transition(first, { type: 'goal', minutes: 90 }, 2000));
    fs.writeFileSync(file, '{invalid');
    const loaded = loadData(file);
    expect(loaded.data.settings.dailyGoalMinutes).toBe(45);
    expect(loaded.notice).toContain('korundu');
    expect(fs.readdirSync(path.dirname(file)).some((name) => name.includes('.corrupt-'))).toBe(
      true,
    );
  });
  it('geçersiz veriyi sağlam kaydın üzerine yazmaz', () => {
    const file = testFile();
    saveData(file, freshData());
    expect(() => saveData(file, { ...freshData(), version: 2 } as never)).toThrow();
    expect(loadData(file).data.version).toBe(1);
  });
});
