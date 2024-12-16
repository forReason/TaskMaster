export async function fetchTasks() {
    const response = await fetch('http://drg-taskmaster:5000/tasks');
    if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    return await response.json();
}

export async function updateTaskPriority(title, isUrgent, isImportant) {
    const response = await fetch(
        `http://drg-taskmaster:5000/tasks?title=${encodeURIComponent(title)}&isUrgent=${isUrgent}&isImportant=${isImportant}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );
    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }
}


export async function updateTaskText(oldTitle, newTitle, newDescription) {
    const response = await fetch(
        `http://drg-taskmaster:5000/tasks?title=${encodeURIComponent(oldTitle)}&newTitle=${encodeURIComponent(newTitle)}&description=${encodeURIComponent(newDescription)}`,
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
            `http://drg-taskmaster:5000/tasks/${encodeURIComponent(taskName)}`,
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

export async function getActiveTask() {
    const response = await fetch('http://drg-taskmaster:5000/tasks/active');
    if (!response.ok) {
        throw new Error(`Failed to fetch active task: ${response.statusText}`);
    }

    let activeTask = await response.text(); // Get the raw response as text
    console.log(`Raw active task fetched: ${activeTask}`);

    // Strip leading and trailing quotes (single or double)
    activeTask = activeTask.replace(/^"+|"+$/g, '').trim();
    console.log(`Sanitized active task: ${activeTask}`);

    return activeTask;
}

// Set the active task
export async function setActiveTask(taskId) {
    try {
        const response = await fetch(`http://drg-taskmaster:5000/tasks/active?taskId=${encodeURIComponent(taskId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Failed to set active task: ${response.statusText}`);
        }

        console.log(`Active task set to: ${taskId}`);
        return true;
    } catch (error) {
        console.error(`Error setting active task "${taskId}":`, error);
        alert('Failed to set the active task. Please try again.');
        return false;
    }
}

