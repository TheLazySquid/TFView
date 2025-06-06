import { app } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import Dirs from './dirs';
import LaunchOptions from './launchOptions';
import { createWindow } from './window';
import Config from './config';

app.whenReady().then(() => {
    electronApp.setAppUserModelId('io.tfview.installer');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    });

    Dirs.init();
    LaunchOptions.init();
    Config.init();

    createWindow();
})

app.on('window-all-closed', () => {
    app.quit();
});