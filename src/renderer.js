// DOM Elements
const entriesTable = document.getElementById('entries');

const addBtn = document.getElementById('addBtn');
const addEntryPopup = document.getElementById('addEntryPopup');
const entryForm = document.getElementById('addEntryForm');
const addCancelBtn = document.getElementById('addCancelBtn');

const editEntryPopup = document.getElementById('editEntryPopup');
const editEntryForm = document.getElementById('editEntryForm');
const editCancelBtn = document.getElementById('editCancelBtn');
const editComfirmBtn = document.getElementById('editComfirmBtn');

const deleteEntryPopup = document.getElementById('deleteEntryPopup');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteComfBtn');

let lastClickedEntryId = null;

deleteID = 0
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
      <td><button class="edit-btn" data-id="${entry.id}">Edit</button>  <button class="delete-btn" data-id="${entry.id}">Delete</button></td>
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

editCancelBtn.addEventListener('click', () => {
    editEntryForm.reset();
    editEntryPopup.style.display = 'none';
})

deleteCancelBtn.addEventListener('click', async (e) => {
    deleteEntryPopup.style.display = 'none';
})

deleteConfirmBtn.addEventListener('click', async () => {
    console.log(lastClickedEntryId);
    console.log('deleting entry with id:', lastClickedEntryId);
    await window.electronAPI.deleteEntry(lastClickedEntryId)
    deleteEntryPopup.style.display = 'none';
    await loadEntries();
})


// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    await loadEntries();
    document.getElementById('entries').addEventListener('click', (e) => {
        const button = e.target.closest('button[data-id]');
        if (button) {
            lastClickedEntryId = parseInt(button.dataset.id, 10);
            console.log('Stored ID:', lastClickedEntryId); // Verify in DevTools
        }

        if (button.classList.contains('edit-btn')) {
            editEntryPopup.style.display = 'block';
        }
        else if (button.classList.contains('delete-btn')) {
            deleteEntryPopup.style.display = 'block';
        }
    });

});