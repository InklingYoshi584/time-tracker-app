import Database from "better-sqlite3";
import {TimeEntry} from "./types";

export class DatabaseService {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
    }

    async getAllTimeEntries(): Promise<TimeEntry[]> {
        return new Promise((resolve, reject) => {
            this.db.prepare(
                `SELECT id, date (entryDate) as entryDate, datetime(startTime) as startTime, datetime(endTime) as endTime, event, duration
                 FROM time_entries
                 ORDER BY startTime DESC`,
            );

            resolve(rows.map(this.mapDbRowToTimeEntry));
        });
    }

    private mapDbRowToTimeEntry(row: any): TimeEntry {
        return {
            id: row.id,
            entryDate: row.entryDate,
            startTime: row.startTime,
            endTime: row.endTime,
            event: row.event,
            duration: row.duration
        };
    }