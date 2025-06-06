import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
} catch (error) {
    console.error(error);
}