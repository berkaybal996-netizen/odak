import fs from 'node:fs';
import path from 'node:path';
import { freshData, recover, validData } from '../src/shared/engine';
import type { StudyData } from '../src/shared/types';

export function loadData(filename: string): { data: StudyData; notice: string } {
  let notice = '';
  for (const candidate of [filename, `${filename}.bak`]) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (!validData(parsed)) throw new Error('Geçersiz veri');
      const wasRunning = (parsed as StudyData).active?.runningSince != null;
      return {
        data: recover(parsed),
        notice:
          notice ||
          (wasRunning ? 'Önceki oturum son otomatik kayıttan kurtarıldı ve duraklatıldı.' : ''),
      };
    } catch {
      // Orijinal dosyayı koru; yedek veya temiz veriyle çalışmaya devam et.
      fs.copyFileSync(candidate, `${candidate}.corrupt-${Date.now()}`);
      notice = 'Kayıt dosyası okunamadı. Bozuk dosya korundu; varsa son sağlam yedek yüklendi.';
    }
  }
  return { data: freshData(), notice };
}

export function saveData(filename: string, data: StudyData) {
  if (!validData(data)) throw new Error('Çalışma kaydı doğrulanamadı.');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.tmp`;
  const fd = fs.openSync(temporary, 'w');
  try {
    fs.writeFileSync(fd, JSON.stringify(data, null, 2), 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  // Yalnızca sağlam bir mevcut dosya yedek olarak kullanılabilir.
  if (fs.existsSync(filename)) {
    try {
      if (validData(JSON.parse(fs.readFileSync(filename, 'utf8'))))
        fs.copyFileSync(filename, `${filename}.bak`);
    } catch {
      /* Okunamayan dosya yükleme aşamasında zaten korunur. */
    }
  }
  fs.renameSync(temporary, filename);
}
