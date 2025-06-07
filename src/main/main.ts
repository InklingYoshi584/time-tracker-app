import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { Database } from "../database/database";

let mainWindow: BrowserWindow | null = null;
let recordWindow: BrowserWindow | null = null;

// Create main window showing time entries
const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.ts"), // Use for secure IPC
        },
    });
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
};

// Create a record popup window
const createRecordWindow = () => {
    recordWindow = new BrowserWindow({
        width: 400,
        height: 200,
        parent: mainWindow!,
        modal: true,
    });
    recordWindow.loadFile(path.join(__dirname, "../renderer/record.html"));
};

// Electron app lifecycle
app.on("ready", () => {
    createMainWindow();
});

ipcMain.on("record-event", (_event, data) => {
    Database.addEntry(data); // Store in SQLite
    mainWindow?.webContents.send("refresh"); // Refresh entries
});

ipcMain.on("close-record-window", () => {
    recordWindow?.close();
});