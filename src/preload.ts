import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getEntries: () => ipcRenderer.invoke('get-entries'),
    addEntry: (data: any) => ipcRenderer.invoke('add-entry', data)
});