import {updateTaskText, deleteTask, getActiveTask, setActiveTask} from "../services/taskService.js";

export function createTaskCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `task-${task.title || 'new'}`;
    card.draggable = true;
    card.dataset.title = task.title;

    // Header section for title and edit button
    const header = document.createElement('div');
    header.classList.add('card-header');

    // Title element
    const titleEl = document.createElement('div');
    titleEl.classList.add('card-title');
    titleEl.textContent = task.title || 'Untitled Task';
    titleEl.contentEditable = false;

    // Prevent dragging on title field
    titleEl.addEventListener('dragstart', (e) => e.stopPropagation());

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.innerHTML = '✎';
    editBtn.title = 'Edit Task';

    // Append title and edit button to header
    header.append(titleEl, editBtn);

    // Content section for description
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('card-content');

    // Description element
    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || 'No description available.';
    descriptionEl.contentEditable = false;

    // Prevent dragging on description field
    descriptionEl.addEventListener('dragstart', (e) => e.stopPropagation());

    // Append description to content wrapper
    contentWrapper.append(descriptionEl);

    // Action buttons row
    const actionButtonRow = document.createElement('div');
    actionButtonRow.classList.add('action-button-row');

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

    // Append buttons to the action button row
    actionButtonRow.append(saveBtn, cancelBtn, deleteBtn, setActiveBtn);

    // Append all elements to the card
    card.append(header, contentWrapper, actionButtonRow);

    // Set Active Task button functionality
    setActiveBtn.addEventListener('click', async () => {
        try {
            const success = await setActiveTask(task.title);
            if (success) {
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
        editBtn.textContent = isEditing ? 'X' : '✎';

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

    // Drag-and-drop functionality for the card
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
                createSparkles(card); // Start sparkles for the active task
            } else {
                card.classList.remove('active-task');
                // Cleanup sparkles for non-active tasks
                if (card.cleanupSparkles) {
                    card.cleanupSparkles();
                }
            }
        });
    } catch (error) {
        console.error('Error highlighting active task:', error);
    }
}



const sparkleIntervals = new Map(); // Store sparkle intervals for active tasks

function createSparkles(targetElement, sparkleCount = 50, sparkleInterval = 1000) {
    // Clean up existing interval if one exists for this element
    if (sparkleIntervals.has(targetElement)) {
        clearInterval(sparkleIntervals.get(targetElement));
        sparkleIntervals.delete(targetElement);
    }

    // Function to generate sparkles
    function generateSparkles() {
        // Remove expired sparkles but keep current ones animating
        targetElement.querySelectorAll('.sparkle.expired').forEach(sparkle => sparkle.remove());

        const rect = targetElement.getBoundingClientRect(); // Dynamically get the card's size and position

        // Create new sparkles
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');

            // Randomize size and position
            const size = Math.random() * 5 + 5; // Random size between 5px and 10px
            const left = Math.random() * (rect.width - size); // Within the element's width
            const top = Math.random() * (rect.height - size); // Within the element's height

            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;
            sparkle.style.left = `${left}px`;
            sparkle.style.top = `${top}px`;
            sparkle.style.animationDelay = `${Math.random()}s`; // Random animation start
            sparkle.classList.add('expired'); // Mark sparkle as removable after the animation cycle

            // Append sparkle to the target element
            targetElement.appendChild(sparkle);

            // Remove "expired" class after animation, keeping the sparkle visible during its lifetime
            sparkle.addEventListener('animationend', () => sparkle.classList.remove('expired'));
        }
    }

    // Generate sparkles initially
    generateSparkles();

    // Set interval to continuously generate sparkles
    const intervalId = setInterval(generateSparkles, sparkleInterval);
    sparkleIntervals.set(targetElement, intervalId);

    // Cleanup function for when sparkles are no longer needed
    targetElement.cleanupSparkles = () => {
        clearInterval(intervalId); // Clear interval
        sparkleIntervals.delete(targetElement); // Remove from Map
        targetElement.querySelectorAll('.sparkle').forEach(sparkle => sparkle.remove()); // Remove sparkles
    };
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
