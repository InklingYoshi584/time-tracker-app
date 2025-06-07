import {contextBridge, ipcRenderer} from "electron";
contextBridge.exposeInMainWorld('electronAPI', {
    ipcRenderer: ipcRenderer,
});

document.getElementById("record-form")!.addEventListener("submit", (e) => {
    e.preventDefault();

    const startTime = (document.getElementById("start-time") as HTMLInputElement).value;
    const endTime = (document.getElementById("end-time") as HTMLInputElement).value;
    const event = (document.getElementById("event") as HTMLInputElement).value;

    const spantime = parseInt(endTime) - parseInt(startTime); // Simple time diff logic
    const formattedStart = `${startTime.substr(0, 2)}:${startTime.substr(2)}`;
    const formattedEnd = `${endTime.substr(0, 2)}:${endTime.substr(2)}`;

    ipcRenderer.send("record-event", {
        starttime: formattedStart,
        endtime: formattedEnd,
        event,
        spantime,
    });

    ipcRenderer.send("close-record-window");
});