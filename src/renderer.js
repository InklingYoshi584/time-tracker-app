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

const todoTable = document.getElementById('todo-entries');
const addTodoBtn = document.getElementById('addTodoBtn');
const addTodoPopup = document.getElementById('addTodoPopup');
const addTodoForm = document.getElementById('addTodoForm');
const cancelTodoBtn = document.getElementById('cancelTodoBtn');
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
    const dateStr = formatDate(currentDisplayDate);

    // Load time entries
    const entries = await window.electronAPI.getEntriesByDate(dateStr);
    entriesTable.innerHTML = entries.map(entry => `
        <tr>
            <td>${entry.startTime}</td>
            <td>${entry.endTime}</td>
            <td>${entry.event}</td>
            <td>${entry.duration} min</td>
            <td>
                <button class="edit-btn" data-id="${entry.id}">Edit</button>
                <button class="delete-btn" data-id="${entry.id}">Delete</button>
            </td>
        </tr>
    `).join('');

    // Load experience entries
    const experienceEntries = await window.electronAPI.getExperienceEntries();
    experienceEntriesTable.innerHTML = experienceEntries.map(expEntry => `
        <tr>
            <td>${expEntry.experienceEntryDate}</td>
            <td>${expEntry.experienceEntry}</td>
            <td>${expEntry.experienceEntryRating}</td>
            <td>
                <button class="edit-exp-btn" data-id="${expEntry.id}">Edit</button>
                <button class="delete-exp-btn" data-id="${expEntry.id}">Delete</button>
                <button class="rate-exp-btn" data-id="${expEntry.id}">Rate</button>
            </td>
        </tr>
    `).join('');

    // Load TODOs for current date with completion status
    const todos = await window.electronAPI.getTodosByDate(dateStr);
    todoTable.innerHTML = todos.map(todo => `
        <tr style="${todo.completed ? 'color: #4CAF50; text-decoration: line-through' : ''}">
            <td>${todo.task}</td>
            <td>${todo.deadline || '-'}</td>
            <td>${todo.frequency !== 'none' ? '🔄 ' + todo.frequency : ''}</td>
            <td>${'★'.repeat(todo.importance)}</td>
            <td>
                <button class="complete-todo" 
                        data-id="${todo.id}"
                        style="background-color: ${todo.completed ? '#4CAF50' : '#f0f0f0'}">
                    ${todo.completed ? 'Completed ✓' : 'Complete'}
                </button>
                <button class="edit-todo" data-id="${todo.id}">Edit</button>
                <button class="delete-todo" data-id="${todo.id}">Delete ✗</button>
            </td>
        </tr>
    `).join('');
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

editTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedTodo = {
        id: lastClickedTodoId,
        task: document.getElementById('editTodoTask').value,
        deadline: document.getElementById('editTodoDeadline').value || null,
        frequency: document.getElementById('editTodoFrequency').value,
        importance: parseInt(document.getElementById('editTodoImportance').value)
    };

    await window.electronAPI.updateTodo(updatedTodo);
    editTodoPopup.style.display = 'none';
    await loadEntries(); // Refresh the display
});

// Cancel edit button
cancelEditTodoBtn.addEventListener('click', () => {
    editTodoPopup.style.display = 'none';
    editTodoForm.reset();
});


addTodoBtn.addEventListener('click', () => {
    addTodoPopup.style.display = 'block';
});

cancelTodoBtn.addEventListener('click', () => {
    addTodoPopup.style.display = 'none';
    addTodoForm.reset();
});

addTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = document.getElementById('todoTask').value;
    const deadline = document.getElementById('todoDeadline').value || null;
    const frequency = document.getElementById('todoFrequency').value;
    const importance = parseInt(document.getElementById('todoImportance').value);

    await window.electronAPI.addTodo({ task, deadline, frequency, importance });
    addTodoPopup.style.display = 'none';
    await loadEntries();
    addTodoForm.reset();
});

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
        }}
    )
    todoTable.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        if (btn.classList.contains('complete-todo')) {
            const dateStr = formatDate(currentDisplayDate);
            await window.electronAPI.toggleTodo({
                id: id,
                date: dateStr
            });
            await loadEntries(); // Refresh all entries
        } else if (btn.classList.contains('delete-todo')) {
            await window.electronAPI.deleteTodo(id);
            await loadEntries(); // Refresh all entries
        } else if (btn.classList.contains('edit-todo')) {
            lastClickedTodoId = id;
            const todo = await window.electronAPI.getTodoById(id);

            if (todo) {
                document.getElementById('editTodoTask').value = todo.task;
                document.getElementById('editTodoDeadline').value = todo.deadline || '';
                document.getElementById('editTodoFrequency').value = todo.frequency;
                document.getElementById('editTodoImportance').value = todo.importance;

                editTodoPopup.style.display = 'block';
            }
        }
    });

    document.getElementById('editTodoFrequency').addEventListener('change', function() {
        const deadlineField = document.getElementById('editTodoDeadline');
        if (this.value !== 'none') {
            deadlineField.disabled = true;
            deadlineField.value = '';
        } else {
            deadlineField.disabled = false;
        }
    });

    // Same for add form
    document.getElementById('todoFrequency').addEventListener('change', function() {
        const deadlineField = document.getElementById('todoDeadline');
        if (this.value !== 'none') {
            deadlineField.disabled = true;
            deadlineField.value = '';
        } else {
            deadlineField.disabled = false;
        }
    });
});