import {updateTaskPriority} from '../services/taskService.js';

export function setupContainers(containers) {
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
                await updateTaskPriority(taskTitle, isUrgent, isImportant);
                container.appendChild(draggedCard);
            } catch (error) {
                console.error('Error updating task:', error);
                alert('Failed to move task!');
            }
        });
    });
}
