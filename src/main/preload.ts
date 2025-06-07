import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    ipcRenderer: {
        send: (channel: string, data: any) => ipcRenderer.send(channel, data),
        invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
        on: (channel: string, listener: (...args: any[]) => void) =>
            ipcRenderer.on(channel, listener),
        once: (channel: string, listener: (...args: any[]) => void) =>
            ipcRenderer.once(channel, listener),
    },
});