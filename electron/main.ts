import { app, BrowserWindow } from "electron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

console.log('Operating System: ', process.platform);
console.log('Electron Version: ', process.versions.electron);

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

app.on('window-all-closed', () => {
    app.quit();
    win = null;
});

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        // resizable: false,
        // thickFrame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
        // backgroundColor: '#000000',
        // webPreferences: {
        //     nodeIntegration: true
        // }
    });

    win.setTitleBarOverlay({
        color: '#161b1e'
    });
    
    if (process.env.FARM_DEV_SERVER_URL) {
        win.loadURL(process.env.FARM_DEV_SERVER_URL);
        // win.webContents.openDevTools();
    } else {
        win.loadFile(join(process.env.DIST as string, 'index.html'));
    }
});