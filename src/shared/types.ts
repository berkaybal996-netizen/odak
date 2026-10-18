export interface Span {
  start: number;
  end: number;
}
export interface Session {
  id: string;
  subject: string;
  createdAt: number;
  endedAt: number | null;
  spans: Span[];
}
export interface ActiveSession extends Session {
  runningSince: number | null;
  checkpointAt: number;
}
export interface StudyData {
  version: 1;
  settings: { dailyGoalMinutes: number; lastSubject: string };
  sessions: Session[];
  active: ActiveSession | null;
}
export type Action =
  | { type: 'toggle'; subject?: string }
  | { type: 'finish' }
  | { type: 'goal'; minutes: number };
export interface AppInfo {
  desktop: boolean;
  compact: boolean;
  shortcut: boolean;
  dataPath: string;
  notice: string;
}
export interface StudyBridge {
  read(): Promise<StudyData>;
  action(action: Action): Promise<StudyData>;
  info(): Promise<AppInfo>;
  subscribe(callback: (data: StudyData) => void): () => void;
  onWindow(callback: (compact: boolean) => void): () => void;
  onError(callback: (message: string) => void): () => void;
  window(action: 'minimize' | 'close' | 'compact'): Promise<void>;
  exportCsv(): Promise<boolean>;
}
declare global {
  interface Window {
    odak?: StudyBridge;
  }
}
