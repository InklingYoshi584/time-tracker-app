// DOM Elements
const entriesTable = document.getElementById('entries');
const experienceEntriesTable = document.getElementById('experienceEntries');
const addExperienceEntryForm = document.getElementById('addExperienceEntryForm');
const addExperienceEntryPopup = document.getElementById('addExperienceEntryPopup');

const addBtn = document.getElementById('addBtn');
const addEntryPopup = document.getElementById('addEntryPopup');
const entryForm = document.getElementById('addEntryForm');
const addCancelBtn = document.getElementById('addCancelBtn');

const editEntryPopup = document.getElementById('editEntryPopup');
const editEntryForm = document.getElementById('editEntryForm');
const editCancelBtn = document.getElementById('editCancelBtn');

const editExperienceCancelBtn = document.getElementById('editExperienceCancelBtn');

const deleteEntryPopup = document.getElementById('deleteEntryPopup');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteComfBtn');

const deleteExperiencePopup = document.getElementById('deleteExperienceEntryPopup');
const deleteExperienceCancelBtn = document.getElementById('deleteExperienceCancelBtn');
const deleteExperienceComfBtn = document.getElementById('deleteExperienceComfBtn');

const rateExperiencePopup = document.getElementById('rateExperienceEntryPopup');

let lastClickedEntryId = null;

let currentDisplayDate = new Date();

function formatDate(date) {
    return date.toLocaleDateString("en-CA").split('/').join("-"); // YYYY-MM-DD
}

async function updateDisplay() {
    // Update the header
    return document.getElementById('current-date-display').textContent =
        currentDisplayDate.toLocaleDateString("en-CA").split('/').join("-");
}

async function filterEntries() {

    // Load entries for this date
    return await window.electronAPI.getEntriesByDate(
        formatDate(currentDisplayDate)
    );
}

// Navigation handlers
document.getElementById('prev-day').addEventListener('click', () => {
    currentDisplayDate.setDate(currentDisplayDate.getDate() - 1);
    loadEntries();
});

document.getElementById('next-day').addEventListener('click', () => {
    currentDisplayDate.setDate(currentDisplayDate.getDate() + 1);
    loadEntries();
});



// Format time input (e.g., "930" -> "09:30")
function formatTime(input) {
    const clean = input.replace(/\D/g, '').padStart(4, '0');
    return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

// Load entries from the main process
async function loadEntries() {
    await updateDisplay();
    const entries = await filterEntries();
    entriesTable.innerHTML = entries.map(entry => `
    <tr>
      <td>${entry.startTime}</td>
      <td>${entry.endTime}</td>
      <td>${entry.event}</td>
      <td>${entry.duration} min</td>
      <td><button class="edit-btn" data-id="${entry.id}">Edit</button>  <button class="delete-btn" data-id="${entry.id}">Delete</button></td>
    </tr>
  `).join('');

    const experienceEntries = await window.electronAPI.getExperienceEntries();
    experienceEntriesTable.innerHTML = experienceEntries.map(experienceEntry => `
    <tr>
        <td>${experienceEntry.experienceEntryDate}</td>
        <td>${experienceEntry.experienceEntry}</td>
        <td>${experienceEntry.experienceEntryRating}</td>
        <td><button class="edit-exp-btn" data-id="${experienceEntry.id}">Edit</button><button class="delete-exp-btn" data-id="${experienceEntry.id}">Delete</button><button class="rate-exp-btn" data-id="${experienceEntry.id}">Rate</button></td>
    </tr>
    `).join('')

}

document.getElementById('addExpBtn').addEventListener('click', () => {
    addExperienceEntryPopup.style.display = 'block';
})

addExperienceEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let experience = document.getElementById('addExperience').value;

    try {
        await window.electronAPI.addExperienceEntry({ experience });
        addExperienceEntryPopup.style.display = 'none';
        await loadEntries();
        addExperienceEntryForm.reset();
    } catch (err) {
        alert(err.message);
    }
})


// Form submission handler
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let startTime = document.getElementById('addStartTime').value;
    let endTime = document.getElementById('addEndTime').value;
    const event = document.getElementById('addEvent').value;
    let date = formatDate(currentDisplayDate);

    // Format times if needed
    if (!startTime.includes(':')) startTime = formatTime(startTime);
    if (!endTime.includes(':')) endTime = formatTime(endTime);

    try {
        await window.electronAPI.addEntry({ startTime, endTime, event, date});
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

deleteCancelBtn.addEventListener('click', () => {
    deleteEntryPopup.style.display = 'none';
})

deleteExperienceCancelBtn.addEventListener('click',  () => {
    deleteExperiencePopup.style.display = 'none';
})

deleteExperienceComfBtn.addEventListener('click',  async () => {
    await window.electronAPI.deleteExperienceEntry(lastClickedExperienceEntryId)
    deleteExperiencePopup.style.display = 'none';
    await loadEntries();
})

deleteConfirmBtn.addEventListener('click',  async () => {
    await window.electronAPI.deleteEntry(lastClickedEntryId)
    deleteEntryPopup.style.display = 'none';
    await loadEntries();
})

document.getElementById('editEntryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    let editStartTime = document.getElementById("editStartTime").value;
    let editEndTime = document.getElementById("editEndTime").value;

    if (!editEndTime.includes(':')) editEndTime = formatTime(editEndTime);
    if (!editStartTime.includes(':')) editStartTime = formatTime(editStartTime);

    const updatedEntry = {
        id: lastClickedEntryId,
        startTime: editStartTime,
        endTime: editEndTime,
        event: document.getElementById('editEvent').value
    };

    await window.electronAPI.updateEntry(updatedEntry);
    await loadEntries(); // Refresh the table
    document.getElementById('editEntryPopup').style.display = 'none';
});

document.getElementById('editExperienceEntryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedExperienceEntry = {
        id: lastClickedExperienceEntryId,
        experienceEntry: document.getElementById("editExperience").value,
    };

    await window.electronAPI.updateExperienceEntry(updatedExperienceEntry);
    await loadEntries(); // Refresh the table
    document.getElementById('editExperienceEntryPopup').style.display = 'none';
});

editExperienceCancelBtn.addEventListener('click', () => {
    document.getElementById('editExperienceEntryPopup').style.display = 'none';
})


document.getElementById('rateExperienceEntryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedExperienceEntryRating = {
        id: lastClickedExperienceEntryId,
        experienceEntryRating: document.getElementById("rateExperience").value,
    };

    await window.electronAPI.updateExperienceRateEntry(updatedExperienceEntryRating);
    await loadEntries(); // Refresh the table
    document.getElementById('rateExperienceEntryPopup').style.display = 'none';
});

document.getElementById("rateExperienceCancelBtn").addEventListener('click', () => {
    document.getElementById('rateExperienceEntryPopup').style.display = 'none';
})

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    currentDisplayDate = new Date(); // Today
    await loadEntries();
    document.getElementById('entries').addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-id]');
            if (button) {
                lastClickedEntryId = parseInt(button.dataset.id, 10);
                console.log('Stored ID:', lastClickedEntryId); // Verify in DevTools
            }

            if (button.classList.contains('edit-btn')) {
                const entry = await window.electronAPI.getEntryById(lastClickedEntryId);
                if (entry) {
                    document.getElementById('editStartTime').value = entry.startTime;
                    document.getElementById('editEndTime').value = entry.endTime;
                    document.getElementById('editEvent').value = entry.event;

                    // 4. Show the edit popup
                    document.getElementById('editEntryPopup').style.display = 'block';
                }
            } else if (button.classList.contains('delete-btn')) {
                deleteEntryPopup.style.display = 'block';
            }
    });

    document.getElementById('experienceEntries').addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-id]');
        if (button) {
            lastClickedExperienceEntryId = parseInt(button.dataset.id, 10);
            console.log('Stored ID:', lastClickedExperienceEntryId); // Verify in DevTools
        }

        if (button.classList.contains('edit-exp-btn')) {
            const experienceEntry = await window.electronAPI.getExperienceEntryById(lastClickedExperienceEntryId);
            if (experienceEntry) {
                document.getElementById('editExperience').value = experienceEntry.experienceEntry;
                document.getElementById('editExperienceEntryPopup').style.display = 'block';
            }
        } else if (button.classList.contains('delete-exp-btn')) {
            deleteExperiencePopup.style.display = 'block';
        } else if (button.classList.contains('rate-exp-btn')) {
            rateExperiencePopup.style.display = 'block';
        }
    });




});