document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5169/tasks');
        if (!response.ok) {
            console.error('Failed to load tasks:', response.statusText);
            return;
        }

        const tasks = await response.json();

        const containers = document.querySelectorAll('.container');
        containers.forEach((container) => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            container.addEventListener('drop', async (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const draggedCard = document.getElementById(taskId);

                const isUrgent = container.dataset.urgent === 'true';
                const isImportant = container.dataset.important === 'true';

                const taskTitle = draggedCard.dataset.title;

                try {
                    // Send the parameters in the query string as required by the backend
                    const updateResponse = await fetch(
                        `http://localhost:5169/tasks?title=${encodeURIComponent(taskTitle)}&isUrgent=${isUrgent}&isImportant=${isImportant}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    if (!updateResponse.ok) {
                        console.error('Failed to update task:', updateResponse.statusText);
                        alert('Failed to move task!');
                        return;
                    }

                    // Move the card visually
                    container.appendChild(draggedCard);
                } catch (error) {
                    console.error('Error updating task:', error);
                    alert('An error occurred while moving the task.');
                }
            });

        });

        tasks.forEach((task) => {
            const card = createTaskCard(task);
            const containerId = getContainerId(task);
            document.getElementById(containerId).appendChild(card);
        });
    } catch (fetchError) {
        console.error('Error fetching tasks:', fetchError);
    }

    const plusButton = document.getElementById('plusButton');

    plusButton.addEventListener('click', () => {
        // Create an empty task shell
        const emptyTaskCard = createTaskCard({ title: '', description: '' });

        // Style the empty task card to overlay the button
        emptyTaskCard.style.position = 'fixed';
        emptyTaskCard.style.top = '50%';
        emptyTaskCard.style.left = '50%';
        emptyTaskCard.style.transform = 'translate(-50%, -50%)';
        emptyTaskCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        emptyTaskCard.style.padding = '1rem';
        emptyTaskCard.style.backgroundColor = 'white';
        emptyTaskCard.style.width = '300px';
        emptyTaskCard.style.zIndex = '1000';

        // Append the task to the body
        document.body.appendChild(emptyTaskCard);

        // Hide the plus button (optional, can keep it visible if needed)
        plusButton.style.visibility = 'hidden';
    });
});

function createTaskCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `task-${task.title || 'new'}`;
    card.draggable = true;
    card.dataset.title = task.title;

    const titleEl = document.createElement('div');
    titleEl.classList.add('card-title');
    titleEl.textContent = task.title || 'Untitled Task';
    titleEl.contentEditable = true;
    titleEl.style.border = '1px solid #ccc';
    titleEl.style.marginBottom = '0.5rem';
    titleEl.style.padding = '0.5rem';

    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || 'No description available.';
    descriptionEl.contentEditable = true;
    descriptionEl.style.border = '1px solid #ccc';
    descriptionEl.style.padding = '0.5rem';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.marginRight = '0.5rem';

    saveBtn.addEventListener('click', async () => {
        const newTitle = titleEl.textContent.trim();
        const newDescription = descriptionEl.textContent.trim();

        if (!newTitle) {
            alert('Task title cannot be empty.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5169/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                    isUrgent: false, // Default urgency
                    isImportant: false, // Default importance
                }),
            });

            if (!response.ok) {
                console.error('Failed to save task:', response.statusText);
                alert('Failed to save task!');
                return;
            }

            alert('Task saved successfully!');
            card.remove(); // Remove the overlay after saving
            plusButton.style.visibility = 'visible'; // Restore the plus button
        } catch (error) {
            console.error('Error saving task:', error);
            alert('An error occurred while saving.');
        }
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        card.remove(); // Remove the overlay
        plusButton.style.visibility = 'visible'; // Restore the plus button
    });

    card.appendChild(titleEl);
    card.appendChild(descriptionEl);
    card.appendChild(saveBtn);
    card.appendChild(cancelBtn);

    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
    });

    return card;
}

function getContainerId(task) {
    return task.isUrgent && task.isImportant
        ? 'urgent-important'
        : task.isUrgent && !task.isImportant
            ? 'urgent-not-important'
            : !task.isUrgent && task.isImportant
                ? 'not-urgent-important'
                : 'not-urgent-not-important';
}
