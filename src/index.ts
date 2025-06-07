import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import Database from "better-sqlite3";

// Declare the main window
let mainWindow: BrowserWindow | null = null;

// Initialize SQLite Database
const dbPath = path.join(app.getPath("userData"), "time-tracker.db"); // Database file location
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    event TEXT NOT NULL,
    duration INTEGER NOT NULL
  )
`);

// Function to create the main Electron BrowserWindow
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true, // Enable Node.js in the renderer process for simplicity
        },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Time Tracker</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
          }
          th {
            background-color: #f5f5f5;
          }
          .popup {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border: 1px solid #ddd;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            border-radius: 8px;
          }
          .popup.active {
            display: block;
          }
          .overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }
          .overlay.active {
            display: block;
          }
        </style>
      </head>
      <body>
        <h1>Time Tracker</h1>
        <table>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Event</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody id="time-entries"></tbody>
        </table>
        <button onclick="openPopup()">Add Entry</button>

        <div id="popup" class="popup">
          <h2>Add Time Entry</h2>
          <form id="timeEntryForm">
            <label>
              Start Time (HH:MM): <input type="text" id="startTime" required />
            </label>
            <br><br>
            <label>
              End Time (HH:MM): <input type="text" id="endTime" required />
            </label>
            <br><br>
            <label>
              Event: <input type="text" id="event" required />
            </label>
            <br><br>
            <button type="submit">Add</button>
            <button type="button" onclick="closePopup()">Cancel</button>
          </form>
        </div>
        <div id="overlay" class="overlay" onclick="closePopup()"></div>

        <script>
          const { ipcRenderer } = require('electron');

          const loadEntries = () => {
            ipcRenderer.invoke('get-entries').then((entries) => {
              const tableBody = document.getElementById('time-entries');
              tableBody.innerHTML = '';
              entries.forEach((entry) => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                  <td>\${entry.start_time}</td>
                  <td>\${entry.end_time}</td>
                  <td>\${entry.event}</td>
                  <td>\${entry.duration}</td>
                \`;
                tableBody.appendChild(row);
              });
            });
          };

          const openPopup = () => {
            document.getElementById('popup').classList.add('active');
            document.getElementById('overlay').classList.add('active');
          };

          const closePopup = () => {
            document.getElementById('popup').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
          };

          document.getElementById('timeEntryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            const event = document.getElementById('event').value;

            ipcRenderer.invoke('add-entry', { startTime, endTime, event }).then((error) => {
              if (error) alert(error);
              else {
                closePopup();
                loadEntries();
              }
            });
          });

          loadEntries();
        </script>
      </body>
    </html>
  `;

    mainWindow.loadURL("data:text/html;charset=UTF-8," + encodeURIComponent(htmlContent));
}

// IPC Handlers for Database Operations
ipcMain.handle("get-entries", () => {
    return db.prepare("SELECT * FROM time_entries ORDER BY id DESC").all();
});

ipcMain.handle("add-entry", (_, { startTime, endTime, event }) => {
    if (!startTime || !endTime || !event) {
        return "All fields are required";
    }

    const duration = calculateDuration(startTime, endTime);
    if (duration === null) {
        return "Invalid time range";
    }

    db.prepare(`
    INSERT INTO time_entries (start_time, end_time, event, duration)
    VALUES (?, ?, ?, ?)
  `).run(startTime, endTime, event, duration);

    return null; // No errors
});

// Helper Function: Calculate Time Duration
function calculateDuration(startTime: string, endTime: string): number | null {
    const parseTime = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    return end > start ? end - start : null;
}

// App Lifecycle Events
app.whenReady().then(createMainWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});