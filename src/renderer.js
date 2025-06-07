// DOM Elements
const entriesTable = document.getElementById('entries');
const addBtn = document.getElementById('addBtn');
const addEntryPopup = document.getElementById('addEntryPopup');
const entryForm = document.getElementById('addEntryForm');
const addCancelBtn = document.getElementById('addCancelBtn');
const editBtn = document.getElementById('editBtn');
const editEntryPopup = document.getElementById('editEntryPopup');

// Format time input (e.g., "930" -> "09:30")
function formatTime(input) {
    const clean = input.replace(/\D/g, '').padStart(4, '0');
    return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

// Load entries from the main process
async function loadEntries() {
    const entries = await window.electronAPI.getEntries();
    entriesTable.innerHTML = entries.map(entry => `
    <tr>
      <td>${entry.startTime}</td>
      <td>${entry.endTime}</td>
      <td>${entry.event}</td>
      <td>${entry.duration} min</td>
      <td><button class="editBtn" data-id="${entry.id}">Edit</button></td>
    </tr>
  `).join('');
}

// Form submission handler
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let startTime = document.getElementById('addStartTime').value;
    let endTime = document.getElementById('addEndTime').value;
    const event = document.getElementById('addEvent').value;

    // Format times if needed
    if (!startTime.includes(':')) startTime = formatTime(startTime);
    if (!endTime.includes(':')) endTime = formatTime(endTime);

    try {
        await window.electronAPI.addEntry({ startTime, endTime, event });
        addEntryPopup.style.display = 'none';
        await loadEntries();
        entryForm.reset();
    } catch (err) {
        alert(err.message);
    }
});

// UI Event Listeners
addBtn.addEventListener('click', () => {
    addEntryPopup.style.display = 'block';
});

addCancelBtn.addEventListener('click', () => {
    addEntryPopup.style.display = 'none';
    entryForm.reset();
});

editBtn.addEventListener('click', () => {
    editEntryPopup.style.display = 'block';
})

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
});