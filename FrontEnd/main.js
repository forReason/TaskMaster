document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5169/tasks');
        if (!response.ok) {
            console.error('Failed to load tasks:', response.statusText);
            return;
        }

        const tasks = await response.json();

        const containers = document.querySelectorAll('.container');
        containers.forEach(container => {
            container.addEventListener('dragover', e => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            container.addEventListener('drop', async e => {
                e.preventDefault();
                container.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const draggedCard = document.getElementById(taskId);

                const isUrgent = container.dataset.urgent === 'true';
                const isImportant = container.dataset.important === 'true';

                const taskTitle = draggedCard.dataset.title;
                const updateResponse = await fetch(`http://localhost:5169/tasks?title=${encodeURIComponent(taskTitle)}&isUrgent=${isUrgent}&isImportant=${isImportant}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify([]),
                });

                if (!updateResponse.ok) {
                    console.error('Failed to update task:', updateResponse.statusText);
                    return;
                }

                container.appendChild(draggedCard);
            });
        });

        tasks.forEach(task => {
            const card = createTaskCard(task);
            const containerId = getContainerId(task);
            document.getElementById(containerId).appendChild(card);
        });

    } catch (fetchError) {
        console.error('Error fetching tasks:', fetchError);
    }
});

function createTaskCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = `task-${task.title || 'new'}`;
    card.draggable = true;

    const titleEl = document.createElement('div');
    titleEl.classList.add('card-title');
    titleEl.textContent = task.title || "Untitled Task";
    titleEl.contentEditable = true; // Allow direct editing
    titleEl.style.border = "1px solid #ccc";
    titleEl.style.marginBottom = "0.5rem";
    titleEl.style.padding = "0.5rem";

    const descriptionEl = document.createElement('div');
    descriptionEl.classList.add('card-description');
    descriptionEl.textContent = task.description || "No description available.";
    descriptionEl.contentEditable = true; // Allow direct editing
    descriptionEl.style.border = "1px solid #ccc";
    descriptionEl.style.padding = "0.5rem";

    const saveBtn = document.createElement('button');
    saveBtn.textContent = "Save";
    saveBtn.style.marginRight = "0.5rem";

    saveBtn.addEventListener('click', async () => {
        const newTitle = titleEl.textContent.trim();
        const newDescription = descriptionEl.textContent.trim();

        if (!newTitle) {
            alert("Task title cannot be empty.");
            return;
        }

        try {
            // Save the task to the backend
            const response = await fetch(
                `http://localhost:5169/tasks?title=${encodeURIComponent(newTitle)}&description=${encodeURIComponent(newDescription)}&isUrgent=false&isImportant=false`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                console.error("Failed to save task:", response.statusText);
                alert("Failed to save task!");
                return;
            }

            alert("Task saved successfully!");
            card.remove(); // Remove the overlay after saving
            plusButton.style.visibility = 'visible'; // Restore the plus button
        } catch (error) {
            console.error("Error saving task:", error);
            alert("An error occurred while saving.");
        }
    });



    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener('click', () => {
        card.remove(); // Remove the overlay
        plusButton.style.visibility = 'visible'; // Restore the plus button
    });

    card.appendChild(titleEl);
    card.appendChild(descriptionEl);
    card.appendChild(saveBtn);
    card.appendChild(cancelBtn);

    return card;
}


function createEditButton(card, titleEl, descriptionEl, task) {
    const editBtn = document.createElement('button');
    editBtn.textContent = "Edit";
    editBtn.style.marginRight = "0.5rem";

    editBtn.addEventListener('click', () => {
        // Create input fields for editing
        const titleInput = document.createElement('input');
        titleInput.type = "text";
        titleInput.value = task.title;
        titleInput.style.width = "100%";

        const descriptionInput = document.createElement('textarea');
        descriptionInput.value = task.description;
        descriptionInput.style.width = "100%";

        // Replace the static elements with input fields
        card.replaceChild(titleInput, titleEl);
        card.replaceChild(descriptionInput, descriptionEl);

        // Change the button text to "Save"
        editBtn.textContent = "Save";

        // Update the button's click handler for saving
        editBtn.addEventListener(
            'click',
            async () => {
                const newTitle = titleInput.value.trim();
                const newDescription = descriptionInput.value.trim();

                try {
                    // Call the API to update the task
                    const response = await fetch(
                        `http://localhost:5169/tasks?title=${encodeURIComponent(task.title)}&newTitle=${encodeURIComponent(newTitle)}&description=${encodeURIComponent(newDescription)}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: '*/*',
                            },
                            body: JSON.stringify(["string"]),
                        }
                    );

                    if (!response.ok) {
                        console.error('Failed to update task:', response.statusText);
                        alert("Failed to save changes!");
                        return;
                    }

                    // Update the task locally and visually
                    task.title = newTitle;
                    task.description = newDescription;
                    titleEl.textContent = newTitle || "Untitled Task";
                    descriptionEl.textContent = newDescription || "No description available.";

                    // Replace input fields back with static elements
                    card.replaceChild(titleEl, titleInput);
                    card.replaceChild(descriptionEl, descriptionInput);

                    // Revert button text to "Edit"
                    editBtn.textContent = "Edit";
                } catch (error) {
                    console.error("Error saving task:", error);
                    alert("An error occurred while saving changes.");
                }
            },
            { once: true } // Ensure this handler runs only once
        );
    });

    return editBtn;
}


function createDeleteButton(card, task) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                // Call the API to delete the task
                const response = await fetch(`http://localhost:5169/tasks/${encodeURIComponent(task.title)}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': '*/*'
                    },
                });

                if (!response.ok) {
                    console.error('Failed to delete task:', response.statusText);
                    alert("Failed to delete task.");
                    return;
                }

                // Remove the card from the DOM if the API call is successful
                card.remove();
            } catch (error) {
                console.error("Error deleting task:", error);
                alert("An error occurred while deleting the task.");
            }
        }
    });

    return deleteBtn;
}
document.addEventListener('DOMContentLoaded', () => {
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



function getContainerId(task) {
    return task.isUrgent && task.isImportant
        ? 'urgent-important'
        : task.isUrgent && !task.isImportant
            ? 'urgent-not-important'
            : !task.isUrgent && task.isImportant
                ? 'not-urgent-important'
                : 'not-urgent-not-important';
}
