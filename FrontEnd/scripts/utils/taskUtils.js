import {updateTaskText, deleteTask, getActiveTask, setActiveTask} from "../services/taskService.js";

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

    // Prevent dragging on title field
    titleEl.addEventListener('mousedown', (e) => e.stopPropagation());
    titleEl.addEventListener('dragstart', (e) => e.preventDefault());

    // Description element
    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || 'No description available.';
    descriptionEl.contentEditable = false;

    // Prevent dragging on description field
    descriptionEl.addEventListener('mousedown', (e) => e.stopPropagation());
    descriptionEl.addEventListener('dragstart', (e) => e.preventDefault());

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.innerHTML = '✎';
    editBtn.title = 'Edit Task';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-btn');
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.display = 'none';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.display = 'none';

    // Set Active Task button
    const setActiveBtn = document.createElement('button');
    setActiveBtn.classList.add('set-active-btn');
    setActiveBtn.textContent = 'Set Active';
    setActiveBtn.title = 'Set this task as the active task';
    setActiveBtn.style.display = 'none';


    // Set Active Task button functionality
    setActiveBtn.addEventListener('click', async () => {
        try {
            const success = await setActiveTask(task.title);
            if (success) {
                alert(`Task "${task.title}" is now the active task.`);
                await highlightActiveTask(); // Update the UI to reflect the active task
            } else {
                alert(`Failed to set task "${task.title}" as active.`);
            }
        } catch (error) {
            console.error(`Error setting active task: ${error}`);
            alert('An error occurred while setting the active task.');
        }
        editBtn.click();
    });

    // Edit button functionality
    let isEditing = false;
    editBtn.addEventListener('click', () => {
        isEditing = !isEditing;
        titleEl.contentEditable = isEditing;
        descriptionEl.contentEditable = isEditing;

        saveBtn.style.display = isEditing ? 'inline-block' : 'none';
        cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
        deleteBtn.style.display = isEditing ? 'inline-block' : 'none';
        setActiveBtn.style.display = isEditing ? 'inline-block' : 'none';
        editBtn.textContent = isEditing ? 'Exit' : '✎';

        if (!isEditing) {
            titleEl.textContent = task.title || 'Untitled Task';
            descriptionEl.textContent = task.description || 'No description available.';
        }
    });

    // Save button functionality
    saveBtn.addEventListener('click', async () => {
        const newTitle = titleEl.textContent;
        const newDescription = descriptionEl.textContent;

        const success = await saveTask(task, newTitle, newDescription);
        if (success) {
            editBtn.click();
        }
    });

    // Cancel button functionality
    cancelBtn.addEventListener('click', () => {
        titleEl.textContent = task.title || 'Untitled Task';
        descriptionEl.textContent = task.description || 'No description available.';
        editBtn.click();
    });

    // Delete button functionality
    deleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the task: "${task.title}"?`);
        if (!confirmDelete) return;

        try {
            const success = await deleteTask(task.title);
            if (success) {
                card.remove();
            } else {
                alert(`Failed to delete task: "${task.title}".`);
            }
        } catch (error) {
            console.error(`Error deleting task "${task.title}":`, error);
            alert('An error occurred while deleting the task.');
        }
    });

    // Append elements to the card
    card.append(editBtn, titleEl, descriptionEl, saveBtn, cancelBtn, deleteBtn, setActiveBtn);

    // Drag-and-drop functionality
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
    });

    return card;
}

export async function saveTask(task, newTitle, newDescription) {
    if (!newTitle) {
        alert('Task title cannot be empty.');
        return false;
    }

    try {

        const response = await updateTaskText(task.title, newTitle, newDescription);

        if (!response.ok) {
            alert('Failed to save task!');
            return false;
        }
        const taskCard = document.getElementById(`task-${task.title}`);
        if (taskCard) {
            task.title = newTitle.trim();
            task.description = newDescription.trim();
            taskCard.title = newTitle.trim();
            taskCard.description = newDescription.trim();

            taskCard.description = newDescription.trim();
            taskCard.dataset.title = newTitle.trim();
            taskCard.dataset.description = newDescription.trim();
            taskCard.id = `task-${taskCard.title || 'new'}`;
            // Update the displayed content in the card
            const titleEl = taskCard.querySelector('.card-title');
            const descriptionEl = taskCard.querySelector('.card-description');

            if (titleEl) titleEl.textContent = newTitle;
            if (descriptionEl) descriptionEl.textContent = newDescription;
            const result = await markTaskSuccess(taskCard.id);
        }

        return true;
    } catch (error) {
        alert('An error occurred while saving.');
        console.error(error);
        alert(error.message);
        return false;
    }
}

export async function markTaskSuccess(taskId) {
    try {

        const taskCard = document.getElementById(taskId);
        if (taskCard) {
            console.log('Adding flash-success class to:', taskCard);
            taskCard.classList.add('flash-success');
            setTimeout(() => {
                console.log('Removing flash-success class from:', taskCard);
                taskCard.classList.remove('flash-success');
            }, 1500); // Remove class after 1 second
        }
        else{
            console.log('no task was found:', taskId);
        }

        return true;
    } catch (error) {
        alert('An error occurred while flashing a task green.');
        console.error(error);
        alert(error.message);
        return false;
    }
}
// Highlight the active task
export async function highlightActiveTask() {
    try {
        const activeTaskId = await getActiveTask();
        console.log(`Sanitized active task fetched: ${activeTaskId}`);

        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            const taskTitle = card.dataset.title;
            if (taskTitle === activeTaskId) {
                console.log(`Highlighting active task: ${taskTitle}`);
                card.classList.add('active-task');
            } else {
                card.classList.remove('active-task');
            }
        });
    } catch (error) {
        console.error('Error highlighting active task:', error);
    }
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
