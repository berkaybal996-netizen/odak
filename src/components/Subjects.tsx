import { ButtonBase, IconButton, Tooltip } from '@mui/material';
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CheckRounded from '@mui/icons-material/CheckRounded';
import { humanDuration } from '../shared/engine';

const subjects = [
  {
    name: 'React',
    detail: 'Bileşenler, state, bir de pratik.',
    className: 'react',
    snippet: 'useState( )',
  },
  {
    name: 'Node.js',
    detail: 'İşin bir de sunucu tarafı var.',
    className: 'node',
    snippet: 'GET /api',
  },
];

function SubjectArt({ kind, snippet }: { kind: string; snippet: string }) {
  return (
    <div className={`subject-art ${kind}`} aria-hidden="true">
      <span className="code-bubble">{'</>'}</span>
      <span className="subject-orb">
        {kind === 'react' ? (
          <svg viewBox="-55 -55 110 110" fill="none" stroke="currentColor" strokeWidth="3.4">
            <ellipse rx="48" ry="18" />
            <ellipse rx="48" ry="18" transform="rotate(60)" />
            <ellipse rx="48" ry="18" transform="rotate(120)" />
            <circle r="7" fill="currentColor" stroke="none" />
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 9 85 29v42L50 91 15 71V29Z" strokeLinejoin="round" />
            <text
              x="50"
              y="61"
              textAnchor="middle"
              fill="currentColor"
              stroke="none"
              fontSize="32"
              fontWeight="600"
            >
              js
            </text>
          </svg>
        )}
      </span>
      <span className="snippet-bubble">{snippet}</span>
    </div>
  );
}

interface SubjectsProps {
  selected: string;
  locked: boolean;
  today: number;
  goal: number;
  onSelect: (subject: string) => void;
  onEditGoal: () => void;
}

export function Subjects({ selected, locked, today, goal, onSelect, onEditGoal }: SubjectsProps) {
  const progress = Math.min(100, Math.floor((today / goal) * 100));

  return (
    <aside className="study-topics" aria-label="Konular ve günlük hedef">
      <div className="topic-grid">
        {subjects.map((subject) => (
          <ButtonBase
            key={subject.name}
            className={`topic-card ${subject.className} ${selected === subject.name ? 'selected' : ''}`}
            onClick={() => onSelect(subject.name)}
            disabled={locked}
            aria-label={`${subject.name} konusunu seç`}
            aria-pressed={selected === subject.name}
          >
            <span className="topic-action">
              {selected === subject.name ? (
                <CheckRounded fontSize="small" />
              ) : (
                <ArrowOutwardRounded fontSize="small" />
              )}
            </span>
            <SubjectArt kind={subject.className} snippet={subject.snippet} />
            <strong>{subject.name}</strong>
            <span className="topic-detail">{subject.detail}</span>
          </ButtonBase>
        ))}
      </div>
      <div className="goal-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3>Günlük hedef</h3>
            <p>
              {humanDuration(today)} <span>/ {humanDuration(goal)}</span>
            </p>
          </div>
          <Tooltip title="Günlük hedefi değiştir">
            <IconButton aria-label="Günlük hedefi değiştir" onClick={onEditGoal} size="small">
              <EditOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </div>
        <div
          className="goal-track"
          role="progressbar"
          aria-label="Günlük hedef"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="goal-caption">
          {progress >= 100 ? 'Bugünün hedefi tamam.' : `%${progress} tamamlandı`}
        </span>
      </div>
    </aside>
  );
}
