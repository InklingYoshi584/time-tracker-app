import {app, BrowserWindow, ipcMain, ipcRenderer} from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
let mainWindow: BrowserWindow;
// Initialize database
const db = new Database('time-tracker.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entryDate TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP NOT NULL,
    event TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL
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

// handle getting entries by date
ipcMain.handle('get-entries-by-date', (_, date) => {
    return db.prepare(`
    SELECT * FROM time_entries 
    WHERE entryDate = ? 
    ORDER BY startTime ASC
  `).all(date);
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

function calculateDuration(startTime: string, endTime: string): number | null {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalStart = startH * 60 + startM;
    const totalEnd = endH * 60 + endM;
    return totalEnd > totalStart ? totalEnd - totalStart : null;
}

//bluetooth sync protocol
const SYNC_PROTOCOL = {
    SERVICE_UUID: '4a8c53dc-1f2a-4b3d-9e7f-6c1a9d8b5e2f',
    CHARACTERISTIC_UUID: 'f4a3b2c1-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    MAX_RETRIES: 3,
    SYNC_TIMEOUT: 30000 // 30 seconds
};

interface NavigatorWithBluetooth extends Navigator {
    bluetooth: Bluetooth;
}

// Type guard to check for Bluetooth support
function isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
}


async function connectAndSync(pin: any) {
    try {

        if (!isBluetoothSupported()) {
            new Error('Web Bluetooth API not supported in this browser');
        }

        // 1. Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: 'TimeTracker-', // Match devices advertising with our prefix
                services: [SYNC_PROTOCOL.SERVICE_UUID]
            }],
            optionalServices: [SYNC_PROTOCOL.CHARACTERISTIC_UUID]
        });

        console.log('Found device:', device.name);

        // 2. Connect to the GATT server
        const server = await device.gatt!.connect();
        console.log('Connected to GATT server');

        // 3. Get the sync service
        const service = await server.getPrimaryService(SYNC_PROTOCOL.SERVICE_UUID);

        // 4. Get the data characteristic
        const characteristic = await service.getCharacteristic(SYNC_PROTOCOL.CHARACTERISTIC_UUID);

        // 5. Verify PIN (Challenge-Response)
        await verifyPin(characteristic, pin);

        // 6. Perform data sync
        const syncData = await getLocalDataToSync();
        await exchangeData(characteristic, syncData, pin);

        console.log('Sync completed successfully');
        return true;

    } catch (error) {
        console.error('Sync failed:', error);
        return false;
    }
}

// Helper Functions
async function verifyPin(characteristic: BluetoothRemoteGATTCharacteristic, pin: any) {
    // 1. Generate random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(16));

    // 2. Write a challenge to device
    await characteristic.writeValue(challenge);

    // 3. Read response (should be HMAC of challenge with PIN)
    const response = await characteristic.readValue();

    // 4. Verify HMAC
    const expectedResponse = await generatePinHmac(challenge, pin);
    if (!arrayBufferEquals(response.buffer, expectedResponse)) {
        throw new Error('PIN verification failed');
    }
}

async function exchangeData(characteristic: BluetoothRemoteGATTCharacteristic, data: any, pin: any) {
    // 1. Encrypt data with a PIN-derived key
    const encryptedData = await encryptData(data, pin);

    // 2. Send data in chunks (BLE has ~20 byte MTU)
    const chunkSize = 20;
    for (let i = 0; i < encryptedData.length; i += chunkSize) {
        const chunk = encryptedData.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);

        // Wait for ACK
        const ack = await characteristic.readValue();
        if (new Uint8Array(ack.buffer)[0] !== 0x01) {
            throw new Error('Chunk transfer failed');
        }
    }

    // 3. Send sync complete marker
    await characteristic.writeValue(new TextEncoder().encode('SYNC_DONE'));
}

// Crypto Utilities
async function generatePinHmac(challenge: BufferSource, pin: string | undefined) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    return await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        ),
        challenge
    );
}

function arrayBufferEquals(buf1: ArrayBufferLike, buf2: ArrayBuffer) {
    if (buf1.byteLength !== buf2.byteLength) return false;
    const a1 = new Uint8Array(buf1);
    const a2 = new Uint8Array(buf2);
    return a1.every((val, i) => val === a2[i]);
}

// Usage Example




app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
export default connectAndSync