import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import KeyboardRounded from '@mui/icons-material/KeyboardRounded';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import type { AppInfo } from '../shared/types';

interface SettingsDialogProps {
  minutes: number;
  info: AppInfo | null;
  onClose: () => void;
  onSave: (minutes: number) => Promise<boolean>;
  onExport: () => void;
}

export function SettingsDialog({ minutes, info, onClose, onSave, onExport }: SettingsDialogProps) {
  const [input, setInput] = useState(String(minutes));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const value = Number(input);
    if (!Number.isInteger(value) || value < 5 || value > 1440) {
      setError('5 ile 1440 arasında bir dakika değeri gir.');
      return;
    }
    setSaving(true);
    if (await onSave(value)) onClose();
    setSaving(false);
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="settings-title">
      <DialogTitle id="settings-title" className="flex items-center justify-between">
        BAL’ın ayarları
        <IconButton aria-label="Ayarları kapat" onClick={onClose}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <p className="text-muted mb-6 text-sm">Bugün derslere ne kadar zaman ayıralım?</p>
        <TextField
          fullWidth
          label="Günlük hedef (dakika)"
          type="number"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error || '120 dakika = 2 saat'}
          slotProps={{ htmlInput: { min: 5, max: 1440, step: 5 } }}
        />
        <div className="flex flex-wrap gap-2 mt-3 mb-7">
          {[30, 60, 120, 180].map((value) => (
            <Button
              key={value}
              size="small"
              variant={input === String(value) ? 'contained' : 'outlined'}
              onClick={() => {
                setInput(String(value));
                setError('');
              }}
            >
              {value} dk
            </Button>
          ))}
        </div>
        <div className="settings-note">
          <KeyboardRounded />
          <div>
            <strong>Bir tuşla mola</strong>
            <p>Bu pencerede Boşluk ile başlat veya duraklat.</p>
            {info?.desktop && (
              <p>
                {info.shortcut
                  ? 'Başka uygulamalardayken Ctrl + Alt + Boşluk kullanabilirsin.'
                  : 'Genel kısayol başka bir uygulamada kullanılıyor. Pencere içindeki Boşluk tuşu çalışır.'}
              </p>
            )}
          </div>
        </div>
        <div className="settings-note mt-5">
          <FolderOutlined />
          <div>
            <strong>Çalışma kayıtları</strong>
            <p>
              Pencereyi kapatmak, ekranı kilitlemek veya bilgisayarı uyutmak sayacı duraklatır.
              Pencereyi küçülttüğünde çalışmaya devam eder.
            </p>
            <p className="data-path">{info?.dataPath}</p>
          </div>
        </div>
        <Button className="mt-5" startIcon={<DownloadRounded />} onClick={onExport}>
          Günlük raporu indir · CSV
        </Button>
      </DialogContent>
      <DialogActions sx={{ padding: '12px 24px 24px' }}>
        <Button color="inherit" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="contained" disabled={saving} onClick={() => void save()}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}
