import { Button, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import CloseFullscreenRounded from '@mui/icons-material/CloseFullscreenRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { clockText } from '../shared/engine';

interface ControlsProps {
  running: boolean;
  hasSession: boolean;
  onToggle: () => void;
  onFinish: () => void;
}

export function TimerControls({ running, hasSession, onToggle, onFinish }: ControlsProps) {
  return (
    <div className="timer-controls">
      <Button
        variant="contained"
        className="start-button"
        startIcon={running ? <PauseRounded /> : <PlayArrowRounded />}
        onClick={onToggle}
      >
        {running ? 'Duraklat' : hasSession ? 'Devam et' : 'Başlat'}
      </Button>
      <Button
        className="finish-button"
        color="inherit"
        startIcon={<StopRounded />}
        disabled={!hasSession}
        onClick={onFinish}
      >
        Bitir
      </Button>
    </div>
  );
}

interface TimerProps extends ControlsProps {
  elapsed: number;
  subject: string;
  onSubjectChange: (value: string) => void;
  onCompact: () => void;
}

export function Timer({ elapsed, subject, onSubjectChange, onCompact, ...controls }: TimerProps) {
  const { running, hasSession } = controls;

  return (
    <section className={`timer-card ${running ? 'is-running' : ''}`} aria-label="Çalışma sayacı">
      <div className="flex items-center justify-between">
        <span className="timer-status">
          <span className={`status-dot ${running ? 'live' : ''}`} />
          {running ? 'Çalışma sürüyor' : hasSession ? 'Mola zamanı' : 'Sayaç hazır'}
        </span>
        <Tooltip title="Küçük pencere · her zaman üstte">
          <IconButton aria-label="Küçük pencereye geç" onClick={onCompact} size="small">
            <CloseFullscreenRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <TextField
        className="subject-field"
        variant="standard"
        placeholder="Bugün ne çalışıyorsun?"
        value={subject}
        disabled={hasSession}
        onChange={(event) => onSubjectChange(event.target.value)}
        slotProps={{
          htmlInput: { maxLength: 120, 'aria-label': 'Çalışma konusu' },
          input: {
            disableUnderline: true,
            endAdornment: !hasSession && (
              <InputAdornment position="end">
                <EditOutlined sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <div className="timer-digits" role="timer" aria-label="Çalışma süresi">
        {clockText(elapsed)}
      </div>
      <p className="timer-caption">
        {running
          ? 'Dikkatin dağılırsa duraklat. Kaldığın yer burada.'
          : hasSession
            ? 'Hazır olduğunda devam edebilirsin.'
            : 'Sadece çalıştığın süreyi sayalım.'}
      </p>
      <TimerControls {...controls} />
      <div className="timer-shortcut">
        <kbd>Boşluk</kbd>
        <span>başlat / duraklat</span>
      </div>
    </section>
  );
}
