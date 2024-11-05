import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Store from 'electron-store';
import { readFile } from "fs/promises";

if (require('electron-squirrel-startup')) {
    app.quit();
}

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
process.env.DIST = join(__dirname, '../dist');
process.env.FARM_PUBLIC = app.isPackaged
    ? process.env.DIST
    : join(__dirname, '../public');

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let win: BrowserWindow | null;

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 400,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#1d2528',
            symbolColor: '#545f62',
            height: 49
        },
        backgroundColor: '#1d2528',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: join(__dirname, 'preload.mjs')
        },
    });
    
    if (process.env.FARM_DEV_SERVER_URL) {
        win.loadURL(process.env.FARM_DEV_SERVER_URL);
        win.webContents.openDevTools();
    } else {
        win.loadFile(join(process.env.DIST as string, 'index.html'));
    }
});

app.on('window-all-closed', () => {
    app.quit();
    win = null;
});

const store = new Store();

ipcMain.handle('get-store', async (event, val) => {
    return store.get(val);
});

ipcMain.handle('set-store', async (event, key, value) => {
    store.set(key, value);
});

ipcMain.handle('set-theme', (event, newOverlay) => {
    win?.setTitleBarOverlay(newOverlay);
    win?.setBackgroundColor(newOverlay.color);
});

ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Market Files', extensions: ['csv'] }]
    });

    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('file:read', async (event, path) => {
    return await readFile(path, 'utf-8').catch(() => null);
});

ipcMain.handle('app:quit', () => {
    app.exit(0);
});