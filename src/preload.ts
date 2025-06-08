import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getEntryById: (id: string) => ipcRenderer.invoke('get-entry-by-id', id),
    getEntriesByDate: (date: string) => ipcRenderer.invoke('get-entries-by-date', date),
    addEntry: (data: any) => ipcRenderer.invoke('add-entry', data),
    deleteEntry: (data: any) => ipcRenderer.invoke('delete-entry', data),
    updateEntry: (data: any) => ipcRenderer.invoke('update-entry', data),

    getExperienceEntries: (data: any) => ipcRenderer.invoke('get-experience-entries', data),
    addExperienceEntry: (data: any) => ipcRenderer.invoke('add-experience-entry', data),
    deleteExperienceEntry: (data: any) => ipcRenderer.invoke('delete-experience-entry', data),
    getExperienceEntryById: (data: any) => ipcRenderer.invoke('get-experience-entry-by-id', data),
    updateExperienceEntry: (data: any) => ipcRenderer.invoke('update-experience-entry', data),
    updateExperienceRateEntry: (data: any) => ipcRenderer.invoke('update-experience-rate-entry', data),
});