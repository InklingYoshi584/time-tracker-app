export interface SyncItem {
    id: string;
    timestamp: number;
    data: any; // Replace with your specific data type
    version: number;
    deleted?: boolean;
    deviceId: string;
}

export type SyncPayload = {
    items: SyncItem[];
    lastSyncTimestamp: number | null;
    deviceInfo: {
        id: string;
        platform: string;
        appVersion: string;
    };
};

export interface TimeEntry {
    id: number;
    entryDate: string; // ISO date string (YYYY-MM-DD)
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    event: string; // Description of the event
    duration: number; // Duration in seconds
}