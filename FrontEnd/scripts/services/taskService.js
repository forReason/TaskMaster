export async function fetchTasks() {
    const response = await fetch('http://localhost:5169/tasks');
    if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    return await response.json();
}

export async function updateTaskPriority(title, isUrgent, isImportant) {
    const response = await fetch(
        `http://localhost:5169/tasks?title=${encodeURIComponent(title)}&isUrgent=${isUrgent}&isImportant=${isImportant}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );
    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }
}
export async function saveTask(taskId, newTitle, newDescription) {
    if (!newTitle) {
        alert('Task title cannot be empty.');
        return false;
    }

    try {
        const response = await updateTaskText(taskId, newTitle, newDescription);

        if (!response.ok) {
            alert('Failed to save task!');
            return false;
        }

        const result = await markTaskSuccess(taskId);

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
export async function updateTaskText(oldTitle, newTitle, newDescription) {
    const response = await fetch(
        `http://localhost:5169/tasks?title=${encodeURIComponent(oldTitle)}&newTitle=${encodeURIComponent(newTitle)}&description=${encodeURIComponent(newDescription)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );

    // Check if the response is OK; otherwise, throw an error
    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }

    // Return the response object for further handling
    return response;
}
export async function deleteTask(taskName) {
    try {
        const response = await fetch(
            `http://localhost:5169/tasks/${encodeURIComponent(taskName)}`,
            {
                method: 'DELETE',
                headers: { 'accept': '*/*' },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.statusText}`);
        }

        console.log(`Task "${taskName}" successfully deleted.`);
        return true;
    } catch (error) {
        console.error(`Error deleting task "${taskName}":`, error);
        alert('Failed to delete the task. Please try again.');
        return false;
    }
}

