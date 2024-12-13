import {updateTaskText} from "../services/taskService.js";

export function createTaskCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `task-${task.title || 'new'}`;
    card.draggable = true;
    card.dataset.title = task.title;

    const titleEl = document.createElement('div');
    titleEl.classList.add('card-title');
    titleEl.textContent = task.title || 'Untitled Task';
    titleEl.contentEditable = true;

    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || 'No description available.';
    descriptionEl.contentEditable = true;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';

    saveBtn.addEventListener('click', async () => {
        const newTitle = titleEl.textContent.trim();
        const newDescription = descriptionEl.textContent.trim();

        if (!newTitle) {
            alert('Task title cannot be empty.');
            return;
        }

        try {
            const response = await updateTaskText(task.title, newTitle, newDescription);

            if (!response.ok) {
                alert('Failed to save task!');
                return;
            }

            alert('Task saved successfully!');
            card.remove();
            document.getElementById('plusButton').style.visibility = 'visible';
        } catch (error) {
            alert('An error occurred while saving.');
            console.error(error); // Log full error for debugging
            alert(error.message);
        }

    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        card.remove();
        document.getElementById('plusButton').style.visibility = 'visible';
    });

    card.append(titleEl, descriptionEl, saveBtn, cancelBtn);

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
