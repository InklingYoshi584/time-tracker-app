import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getEntries: () => ipcRenderer.invoke('get-entries'),
    addEntry: (data: any) => ipcRenderer.invoke('add-entry', data),
    getEntryById: (id: string) => ipcRenderer.invoke('get-entry-by-id', id),
    getEntriesByDate: (date: string) => ipcRenderer.invoke('get-entries-by-date', date),
    deleteEntry: (data: any) => ipcRenderer.invoke('delete-entry', data),
    updateEntry: (data: any) => ipcRenderer.invoke('update-entry', data),
});