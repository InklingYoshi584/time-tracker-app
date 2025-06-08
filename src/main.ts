import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
let mainWindow: BrowserWindow;
// Initialize database
const db = new Database('time-tracker.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entryDate TEXT NOT NULL DEFAULT CURRENT_DATE,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    event TEXT NOT NULL,
    duration INTEGER NOT NULL
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS experience_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experienceEntryDate TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
        experienceEntry STRING NOT NULL,
        experienceEntryRating INTEGER NOT NULL
    )
`);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true
        }
    });
    mainWindow.loadFile('dist/index.html');
}

// IPC Handlers
ipcMain.handle('get-entries', () => {
    try {
        return db.prepare("SELECT * FROM time_entries ORDER BY id ASC").all();
    } catch (err) {
        console.error('Database error:', err);
        return [];
    }
});

ipcMain.handle('add-experience-entry', (_, {experience}) => {
    const date = new Date().toISOString().split('T')[0]; // Current date


    db.prepare(`
    INSERT INTO experience_entries (experienceEntryDate, ExperienceEntry, ExperienceEntryRating)
    VALUES (?, ?, ?)
  `).run(date, experience, 0);
})


//handle time entry addition
ipcMain.handle('add-entry', (_, { startTime, endTime, event }) => {
    const duration = calculateDuration(startTime, endTime);
    if (duration === null) throw new Error('Invalid time range');
    const date = new Date().toISOString().split('T')[0]; // Current date


    db.prepare(`
    INSERT INTO time_entries (entryDate, startTime, endTime, event, duration)
    VALUES (?, ?, ?, ?, ?)
  `).run(date, startTime, endTime, event, duration);
});


//handle getting entry by id
ipcMain.handle('get-entry-by-id', (_, id) => {
    return db.prepare("SELECT * FROM time_entries WHERE id = ?").get(id);
});


//handle entry edits
ipcMain.handle('update-entry', (_, entry) => {
    const duration = calculateDuration(entry.startTime, entry.endTime);

    if (duration === null) throw new Error('its a null!');

    db.prepare(`
        UPDATE time_entries 
        SET startTime = ?, endTime = ?, event = ?, duration = ?
        WHERE id = ?
    `).run(
        entry.startTime,
        entry.endTime,
        entry.event,
        duration,
        entry.id
    );
});

ipcMain.handle('update-experience-entry', (_, entry) => {
    db.prepare(`
        UPDATE experience_entries
        SET experienceEntry = ?
        WHERE id = ?
    `).run(
        entry.experienceEntry,
        entry.id
    );
});

ipcMain.handle('update-experience-rate-entry', (_, entry) => {
    db.prepare(`
        UPDATE experience_entries 
        SET experienceEntryRating = ?
        WHERE id = ?
    `).run(
        entry.experienceEntryRating,
        entry.id
    );
});

//handle getting experience entries
ipcMain.handle("get-experience-entries", (_) => {
    try {
        return db.prepare("SELECT * FROM experience_entries ORDER BY id ASC").all();
    } catch (err) {
        console.error('Database error:', err);
        return null;
    }
})


// handle getting entries by date
ipcMain.handle('get-entries-by-date', (_, date) => {
    return db.prepare(`
    SELECT * FROM time_entries 
    WHERE entryDate = ? 
    ORDER BY startTime ASC
  `).all(date);
});

ipcMain.handle('get-experience-entry-by-id', (_, id) => {
    return db.prepare("SELECT * FROM experience_entries WHERE id = ?").get(id);
});

ipcMain.handle('delete-entry', (_, deleteid: number) => {
    if (isNaN(deleteid)) {
        console.error('Invalid ID format');
        return;
    }

    try {
        const result = db.prepare(
    "DELETE FROM time_entries WHERE id = ?"
        ).run(deleteid);
        return { success: true, changes: result.changes };
    } catch (err) {
        console.error('Delete failed:', err);
        return { success: false };
    }
})

ipcMain.handle('delete-experience-entry', (_, deleteid: number) => {
    if (isNaN(deleteid)) {
        console.error('Invalid ID format');
        return;
    }

    try {
        const result = db.prepare(
            "DELETE FROM experience_entries WHERE id = ?"
        ).run(deleteid);
        return { success: true, changes: result.changes };
    } catch (err) {
        console.error('Delete failed:', err);
        return { success: false };
    }
})


function calculateDuration(startTime: string, endTime: string): number | null {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalStart = startH * 60 + startM;
    const totalEnd = endH * 60 + endM;
    return totalEnd > totalStart ? totalEnd - totalStart : null;
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});