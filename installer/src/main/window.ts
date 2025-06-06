import { shell, BrowserWindow } from 'electron';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { is } from '@electron-toolkit/utils';

let mainWindow: BrowserWindow;

export function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 450,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

export function send(channel: string, ...args: any[]) {
    mainWindow.webContents.send(channel, ...args);
}