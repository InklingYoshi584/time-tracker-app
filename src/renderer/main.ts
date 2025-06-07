import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('electronAPI', {
    ipcRenderer: ipcRenderer,
});


// Load entries on startup
const loadEntries = async () => {
    const entries = await ipcRenderer.invoke("get-entries");
    const table = document.getElementById("entries-table") as HTMLTableElement;

    // Clear table except headers
    table.innerHTML = `
    <tr>
      <th>Start</th>
      <th>End</th>
      <th>Event</th>
      <th>Span (minutes)</th>
    </tr>
  `;

    // Append each entry as a new row
    entries.forEach((entry: any) => {
        const row = table.insertRow();
        row.innerHTML = `
      <td>${entry.starttime}</td>
      <td>${entry.endtime}</td>
      <td>${entry.event}</td>
      <td>${entry.spantime}</td>
    `;
    });
};

document.getElementById("record-btn")!.addEventListener("click", () => {
    ipcRenderer.send("open-record-window");
});

// Refresh data when entries are updated
ipcRenderer.on("refresh", loadEntries);

loadEntries();