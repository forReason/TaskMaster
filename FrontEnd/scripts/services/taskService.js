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

