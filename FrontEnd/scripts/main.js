import { fetchTasks } from './services/taskService.js';
import { setupContainers } from './events/containerEvents.js';
import { setupPlusButton } from './events/plusButtonEvents.js';
import { createTaskCard, getContainerId, highlightActiveTask } from './utils/taskUtils.js';
document.addEventListener('DOMContentLoaded', async () => {
    console.log("starting app init");
    try {
        const tasks = await fetchTasks();
        const containers = document.querySelectorAll('.container');
        setupContainers(containers);

        tasks.forEach((task) => {
            const card = createTaskCard(task);
            const containerId = getContainerId(task);
            document.getElementById(containerId).appendChild(card);
        });

        setupPlusButton();
        await highlightActiveTask();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});