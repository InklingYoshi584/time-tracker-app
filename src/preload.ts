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
    addTodo: (data: any) => ipcRenderer.invoke('add-todo', data),
    getTodos: () => ipcRenderer.invoke('get-todos'),
    deleteTodo: (id: any) => ipcRenderer.invoke('delete-todo', id),
    toggleTodo: (data: any) => ipcRenderer.invoke('toggle-todo', data),
    getTodosByDate: (date: any) => ipcRenderer.invoke('get-todos-by-date', date),
    updateTodo: (data: any) => ipcRenderer.invoke('update-todo', data),
    getTodoById: (id: any) => ipcRenderer.invoke('get-todo-by-id', id)
});