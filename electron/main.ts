import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  powerMonitor,
  Tray,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { checkpoint, csv, transition } from '../src/shared/engine';
import type { Action, StudyData } from '../src/shared/types';
import { loadData, saveData } from './storage';

app.setName('Odak');
const ownsLock = app.requestSingleInstanceLock();
if (!ownsLock) app.quit();
let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let data: StudyData;
let filename = '';
let notice = '';
let shortcut = false;
let compact = false;
let quitting = false;
let regularBounds: Electron.Rectangle | undefined;
let saveWarningShown = false;

function broadcast() {
  win?.webContents.send('study:changed', data);
  const running = data.active?.runningSince != null;
  tray?.setToolTip(`Odak · ${running ? 'Çalışıyorsun' : 'Hazır'}`);
  tray?.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Odak’ı aç', click: showWindow },
      {
        label: running ? 'Duraklat' : 'Başlat / devam et',
        click: () => safeAction({ type: 'toggle' }),
      },
      {
        label: 'Oturumu bitir',
        enabled: !!data.active,
        click: () => safeAction({ type: 'finish' }),
      },
      { type: 'separator' },
      { label: 'Çıkış', click: () => app.quit() },
    ]),
  );
}

function act(action: Action) {
  const next = transition(data, action, Date.now());
  saveData(filename, next);
  data = next;
  broadcast();
  return data;
}

function safeAction(action: Action) {
  try {
    act(action);
  } catch (error) {
    dialog.showErrorBox(
      'Kayıt yapılamadı',
      `Çalışma kaydı diske yazılamadı. Lütfen boş disk alanını kontrol et.\n${String(error)}`,
    );
  }
}

function pauseIfRunning() {
  if (data?.active?.runningSince != null) act({ type: 'toggle' });
}

function showWindow() {
  if (win?.isMinimized()) win.restore();
  win?.show();
  win?.focus();
}

function changeCompact() {
  if (!win) return;
  compact = !compact;
  if (compact) {
    regularBounds = win.getBounds();
    win.setMinimumSize(360, 250);
    win.setSize(400, 285);
    win.setAlwaysOnTop(true);
  } else {
    win.setAlwaysOnTop(false);
    win.setMinimumSize(850, 680);
    if (regularBounds) win.setBounds(regularBounds);
  }
  win.webContents.send('study:compact', compact);
}

if (ownsLock)
  app
    .whenReady()
    .then(async () => {
      filename = path.join(app.getPath('userData'), 'odak.json');
      const loaded = loadData(filename);
      data = loaded.data;
      notice = loaded.notice;
      saveData(filename, data);
      const root = app.getAppPath();
      const iconPath = path.join(root, 'resources', 'icon.png');
      win = new BrowserWindow({
        width: 1220,
        height: 860,
        minWidth: 850,
        minHeight: 680,
        frame: false,
        show: false,
        backgroundColor: '#f5f5f4',
        title: 'Odak · BAL',
        icon: iconPath,
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      win.setMenuBarVisibility(false);
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', (event) => event.preventDefault());
      win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) =>
        callback(false),
      );

      // Yalnızca bu uygulamanın ana penceresi ayrıcalıklı işlemleri çağırabilir.
      const trusted = (event: Electron.IpcMainInvokeEvent) => {
        if (
          !win ||
          event.sender !== win.webContents ||
          event.senderFrame !== win.webContents.mainFrame
        )
          throw new Error('Yetkisiz istek.');
      };
      ipcMain.handle('study:read', (event) => {
        trusted(event);
        console.log('ODAK_UI_CONNECTED: storage bridge ready');
        return data;
      });
      ipcMain.handle('study:action', (event, action: Action) => {
        trusted(event);
        if (!action || !['toggle', 'finish', 'goal'].includes(action.type))
          throw new Error('Geçersiz işlem.');
        if (
          action.type === 'toggle' &&
          action.subject !== undefined &&
          typeof action.subject !== 'string'
        )
          throw new Error('Geçersiz konu.');
        return act(action);
      });
      ipcMain.handle('study:info', (event) => {
        trusted(event);
        return { desktop: true, compact, shortcut, dataPath: filename, notice };
      });
      ipcMain.handle('study:window', (event, action: string) => {
        trusted(event);
        if (action === 'minimize') win?.minimize();
        else if (action === 'close') win?.close();
        else if (action === 'compact') changeCompact();
      });
      ipcMain.handle('study:export', async (event) => {
        trusted(event);
        const result = await dialog.showSaveDialog(win!, {
          title: 'Günlük çalışma raporunu kaydet',
          defaultPath: `odak-gunluk-${new Date().toISOString().slice(0, 10)}.csv`,
          filters: [{ name: 'Excel / CSV', extensions: ['csv'] }],
        });
        if (result.canceled || !result.filePath) return false;
        fs.writeFileSync(result.filePath, csv(data, Date.now()), 'utf8');
        return true;
      });

      tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 }));
      tray.on('double-click', showWindow);
      shortcut = globalShortcut.register('CommandOrControl+Alt+Space', () =>
        safeAction({ type: 'toggle' }),
      );
      broadcast();
      powerMonitor.on('suspend', () => {
        try {
          pauseIfRunning();
        } catch (error) {
          dialog.showErrorBox('Otomatik kayıt sorunu', String(error));
        }
      });
      powerMonitor.on('lock-screen', () => {
        try {
          pauseIfRunning();
        } catch (error) {
          dialog.showErrorBox('Otomatik kayıt sorunu', String(error));
        }
      });
      win.on('close', (event) => {
        if (quitting) return;
        event.preventDefault();
        try {
          pauseIfRunning();
          win?.hide();
        } catch (error) {
          dialog.showErrorBox('Kayıt yapılamadı', String(error));
        }
      });
      win.on('ready-to-show', () => win?.show());
      win.webContents.on('did-finish-load', () =>
        console.log('ODAK_READY: renderer loaded; storage=' + filename),
      );
      win.webContents.on('did-fail-load', (_event, code, description) =>
        console.error('ODAK_LOAD_ERROR', code, description),
      );
      win.webContents.on('console-message', (details) => {
        if (details.level === 'error') console.error('ODAK_RENDERER_ERROR', details.message);
      });
      await win.loadFile(path.join(root, 'dist', 'index.html'));
      setInterval(() => {
        if (data.active?.runningSince == null) return;
        try {
          const next = checkpoint(data, Date.now());
          saveData(filename, next);
          data = next;
          saveWarningShown = false;
        } catch (error) {
          console.error('ODAK_SAVE_ERROR', error);
          notice = 'Otomatik kayıt yapılamadı. Disk alanını kontrol et.';
          if (!saveWarningShown) {
            win?.webContents.send('study:error', notice);
            showWindow();
            saveWarningShown = true;
          }
        }
      }, 5000).unref();
    })
    .catch((error) => {
      dialog.showErrorBox('Odak açılamadı', String(error));
      app.exit(1);
    });

app.on('second-instance', showWindow);
app.on('activate', showWindow);
app.on('window-all-closed', () => {
  /* Sistem tepsisinden tekrar açılabilir. */
});
app.on('before-quit', (event) => {
  if (quitting || !data) return;
  try {
    pauseIfRunning();
    quitting = true;
  } catch (error) {
    event.preventDefault();
    dialog.showErrorBox('Kayıt yapılamadı', String(error));
  }
});
app.on('will-quit', () => globalShortcut.unregisterAll());
