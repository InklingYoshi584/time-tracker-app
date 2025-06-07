// DOM Elements
const entriesTable = document.getElementById('entries');
const addBtn = document.getElementById('addBtn');
const popup = document.getElementById('popup');
const entryForm = document.getElementById('entryForm');
const cancelBtn = document.getElementById('cancelBtn');

// Format time input (e.g., "930" -> "09:30")
function formatTime(input) {
    const clean = input.replace(/\D/g, '').padStart(4, '0');
    return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

// Load entries from main process
async function loadEntries() {
    const entries = await window.electronAPI.getEntries();
    entriesTable.innerHTML = entries.map(entry => `
    <tr>
      <td>${entry.start_time}</td>
      <td>${entry.end_time}</td>
      <td>${entry.event}</td>
      <td>${entry.duration} min</td>
    </tr>
  `).join('');
}

// Form submission handler
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let startTime = document.getElementById('startTime').value;
    let endTime = document.getElementById('endTime').value;
    const event = document.getElementById('event').value;

    // Format times if needed
    if (!startTime.includes(':')) startTime = formatTime(startTime);
    if (!endTime.includes(':')) endTime = formatTime(endTime);

    try {
        await window.electronAPI.addEntry({ startTime, endTime, event });
        popup.style.display = 'none';
        await loadEntries();
        entryForm.reset();
    } catch (err) {
        alert(err.message);
    }
});

// UI Event Listeners
addBtn.addEventListener('click', () => {
    popup.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    entryForm.reset();
});

// Initial load
document.addEventListener('DOMContentLoaded', loadEntries);