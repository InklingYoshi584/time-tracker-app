import DatabaseConstructor from "better-sqlite3";
const db = new DatabaseConstructor("timeflow.db");

export class Database {
    static initialize() {
        db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        starttime TEXT NOT NULL,
        endtime TEXT NOT NULL,
        event TEXT NOT NULL,
        spantime INTEGER
      )
    `);
    }

    static getEntries() {
        return db.prepare("SELECT * FROM time_entries ORDER BY id DESC").all();
    }

    static addEntry(entry: { starttime: string; endtime: string; event: string; spantime: number }) {
        const stmt = db.prepare(`
      INSERT INTO time_entries (starttime, endtime, event, spantime)
      VALUES (?, ?, ?, ?)
    `);
        stmt.run(entry.starttime, entry.endtime, entry.event, entry.spantime);
    }
}