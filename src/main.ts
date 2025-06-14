import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import Database from 'better-sqlite3';let mainWindow: BrowserWindow;
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

db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
        deadline TEXT,
                                         task TEXT NOT NULL,
                                         frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'custom', 'none')),
        importance INTEGER DEFAULT 3 CHECK(importance BETWEEN 1 AND 5),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS todo_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    completion_date TEXT NOT NULL,
    FOREIGN KEY(todo_id) REFERENCES todos(id)
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
    const date = new Date().toLocaleDateString("en-ca"); // Current date


    db.prepare(`
    INSERT INTO experience_entries (experienceEntryDate, ExperienceEntry, ExperienceEntryRating)
    VALUES (?, ?, ?)
  `).run(date, experience, 0);
})


//handle time entry addition
ipcMain.handle('add-entry', (_, { startTime, endTime, event, date}) => {
    const duration = calculateDuration(startTime, endTime);
    if (duration === null) throw new Error('Invalid time range');


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


// Add task
ipcMain.handle('add-todo', (_, todo) => {
    const { task, deadline, frequency, importance } = todo;

    // Auto-calculate deadline for recurring tasks
    const effectiveDeadline = frequency !== 'none' ?
        calculateNextOccurrence(frequency) :
        deadline;

    return db.prepare(`
        INSERT INTO todos (task, deadline, frequency, importance)
        VALUES (?, ?, ?, ?)
    `).run(task, effectiveDeadline, frequency, importance);
});

// Get Todos (sorted by priority)
ipcMain.handle('get-todos', () => {
    return db.prepare(`
        SELECT * FROM todos
        WHERE
            (frequency = 'none' OR
             (frequency != 'none' AND (completed = 0 OR next_occurrence <= DATE('now'))))
        ORDER BY
            completed ASC,
            CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
            deadline ASC,
            importance DESC,
            id ASC
    `).all();
});

// Update the toggle-todo handler
ipcMain.handle('toggle-todo', (_, { id, date }) => {
    // Check if this todo is already completed for the specified date
    const existing = db.prepare(`
        SELECT 1 FROM todo_completions 
        WHERE todo_id = ? AND completion_date = ?
    `).get(id, date);

    if (existing) {
        // Uncomplete for this date
        db.prepare(`
            DELETE FROM todo_completions
            WHERE todo_id = ? AND completion_date = ?
        `).run(id, date);
        return { completed: false };
    } else {
        // Complete for this date
        db.prepare(`
            INSERT INTO todo_completions (todo_id, completion_date)
            VALUES (?, ?)
        `).run(id, date);
        return { completed: true };
    }
});

ipcMain.handle('get-todos-by-date', (_, date) => {
    return db.prepare(`
        SELECT
            t.*,
            EXISTS (
                SELECT 1 FROM todo_completions c
                WHERE c.todo_id = t.id AND c.completion_date = ?
            ) as completed
        FROM todos t
        ORDER BY t.importance DESC, t.id ASC
    `).all(date);
});

function calculateNextOccurrence(frequency: string, baseDate?: string): string | null {
    const date = baseDate ? new Date(baseDate) : new Date();

    switch(frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            return null;
    }

    return date.toLocaleDateString("en-ca");
}


function resetRecurringTasks() {
}

// Delete task entry
ipcMain.handle('delete-todo', (_, id) => {
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
});

// Add this with your other IPC handlers
ipcMain.handle('update-todo', (_, todo) => {
    // Auto-calculate deadline if frequency is set
    const effectiveDeadline = todo.frequency !== 'none' ?
        calculateNextOccurrence(todo.frequency) :
        todo.deadline;

    return db.prepare(`
        UPDATE todos
        SET task = ?,
            deadline = ?,
            frequency = ?,
            importance = ?
        WHERE id = ?
    `).run(
        todo.task,
        effectiveDeadline,
        todo.frequency,
        todo.importance,
        todo.id
    );
});

ipcMain.handle('get-todo-by-id', (_, id) => {
    return db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
});

function calculateDuration(startTime: string, endTime: string): number | null {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalStart = startH * 60 + startM;
    const totalEnd = endH * 60 + endM;
    return totalEnd > totalStart ? totalEnd - totalStart : null;
}

app.whenReady().then(() => {
    createWindow();
    resetRecurringTasks();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});