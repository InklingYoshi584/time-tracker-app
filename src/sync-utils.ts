import {SyncItem, SyncPayload} from "./types";
import packageJSON from "../package.json";
let APP_VERSION: string = packageJSON.version;
export async function getLocalDataToSync(): Promise<SyncPayload> {
    try {
        // 1. Get device ID (generates if doesn't exist)
        const deviceId = await getDeviceId();

        // 2. Get last sync timestamp from local storage
        const lastSync = await getLastSyncTimestamp();

        // 3. Retrieve only changed items since last sync
        const itemsToSync = await getChangedItems(lastSync);

        return {
            items: itemsToSync,
            lastSyncTimestamp: lastSync,
            deviceInfo: {
                id: deviceId,
                platform: navigator.platform,
                appVersion: APP_VERSION // Your app version constant
            }
        };
    } catch (error) {
        console.error('Failed to prepare sync data:', error);
        throw error;
    }
}

// Helper functions
async function getDeviceId(): Promise<string> {
    const STORAGE_KEY = 'deviceId';
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
        // Generate a v4 UUID for the device
        deviceId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }

    return deviceId;
}

async function getLastSyncTimestamp(): Promise<number | null> {
    const timestamp = localStorage.getItem('lastSyncTimestamp');
    return timestamp ? parseInt(timestamp) : null;
}

async function getChangedItems(since: number | null): Promise<SyncItem[]> {
    // Replace with your actual data store access
    const allItems = await getAllLocalItems();

    // Filter based on sync strategy
    if (since) {
        // Delta sync - only items changed since last sync
        return allItems.filter(item =>
            item.timestamp > since &&
            !item.deleted
        );
    } else {
        // First sync - include all non-deleted items
        return allItems.filter(item => !item.deleted);
    }
}

// Mock database access - replace with your actual data layer
async function getAllLocalItems(): Promise<SyncItem[]> {
    // Example using IndexedDB
    return new Promise((resolve) => {
        const request = indexedDB.open('TimeTrackerDB');

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction('timeEntries', 'readonly');
            const store = transaction.objectStore('timeEntries');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result.map(entry => ({
                    id: entry.id,
                    timestamp: entry.updatedAt || Date.now(),
                    data: entry,
                    version: entry.version || 1,
                    deviceId: localStorage.getItem('deviceId') || 'unknown'
                })));
            };
        };

        request.onerror = () => resolve([]);
    });
}

// Conflict resolution helper
export function resolveConflicts(local: SyncItem[], remote: SyncItem[]): SyncItem[] {
    const merged = [...local, ...remote];
    const uniqueItems = new Map<string, SyncItem>();

    merged.forEach(item => {
        const existing = uniqueItems.get(item.id);

        if (!existing ||
            item.timestamp > existing.timestamp ||
            (item.timestamp === existing.timestamp && item.version > existing.version)) {
            uniqueItems.set(item.id, item);
        }
    });

    return Array.from(uniqueItems.values());
}