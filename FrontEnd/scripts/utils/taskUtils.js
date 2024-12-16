import {updateTaskText, saveTask} from "../services/taskService.js";

export function createTaskCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `task-${task.title || 'new'}`;
    card.draggable = true;
    card.dataset.title = task.title;

    // Title element
    const titleEl = document.createElement('div');
    titleEl.classList.add('card-title');
    titleEl.textContent = task.title || 'Untitled Task';
    titleEl.contentEditable = false;

    // Description element
    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || 'No description available.';
    descriptionEl.contentEditable = false;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.innerHTML = '✎'; // Use an icon library like Font Awesome or Ionicons
    editBtn.title = 'Edit Task';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-btn');
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none'; // Hidden initially

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.display = 'none'; // Hidden initially

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.display = 'none'; // Hidden initially

    // Edit button functionality
    let isEditing = false;
    editBtn.addEventListener('click', () => {
        isEditing = !isEditing;
        titleEl.contentEditable = isEditing;
        descriptionEl.contentEditable = isEditing;

        saveBtn.style.display = isEditing ? 'inline-block' : 'none';
        cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
        deleteBtn.style.display = isEditing ? 'inline-block' : 'none';
        editBtn.textContent = isEditing ? 'Exit' : '✎';

        if (!isEditing) {
            // Discard unsaved changes
            titleEl.textContent = task.title || 'Untitled Task';
            descriptionEl.textContent = task.description || 'No description available.';
        }
    });

    // Save button functionality
    saveBtn.addEventListener('click', async () => {
        const newTitle = titleEl.textContent.trim();
        const newDescription = descriptionEl.textContent.trim();

        const success = await saveTask(task.id, newTitle, newDescription);
        if (success) {
            task.title = newTitle;
            task.description = newDescription;
            isEditing = false;
            editBtn.click(); // Exit edit mode
        }
    });

    // Cancel button functionality
    cancelBtn.addEventListener('click', () => {
        isEditing = false;
        editBtn.click(); // Exit edit mode
    });

    // Delete button functionality
    deleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the task: "${task.title}"?`);
        if (!confirmDelete) return;

        try {
            const success = await deleteTask(task.title);
            if (success) {
                card.remove(); // Remove the task from the DOM
                alert(`Task "${task.title}" deleted successfully.`);
            } else {
                alert(`Failed to delete task: "${task.title}".`);
            }
        } catch (error) {
            console.error(`Error deleting task "${task.title}":`, error);
            alert(`An error occurred while deleting the task: "${task.title}".`);
        }
    });

    // Append elements to the card
    card.append(editBtn, titleEl, descriptionEl, saveBtn, cancelBtn, deleteBtn);

    // Drag-and-drop functionality
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
    });

    return card;
}


export function getContainerId(task) {
    return task.isUrgent && task.isImportant
        ? 'urgent-important'
        : task.isUrgent && !task.isImportant
            ? 'urgent-not-important'
            : !task.isUrgent && task.isImportant
                ? 'not-urgent-important'
                : 'not-urgent-not-important';
}
