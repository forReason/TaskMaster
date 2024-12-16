import {updateTaskPriority, updateTaskText, saveTask, markTaskSuccess} from '../services/taskService.js';
import {createTaskCard} from "../utils/taskUtils.js";



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

            var taskId = e.dataTransfer.getData('text/plain');
            var draggedCard = document.getElementById(taskId);

            const isUrgent = container.dataset.urgent === 'true';
            const isImportant = container.dataset.important === 'true';
            var taskTitle = draggedCard.dataset.title;

            try {
                if (taskTitle === ""){
                    const titleEl = draggedCard.querySelector('.card-title');
                    const descriptionEl = draggedCard.querySelector('.card-description');
                    const currentTitle = titleEl.textContent.trim();
                    const currentDescription = descriptionEl.textContent.trim();
                    const newTaskCard = createTaskCard({ title: currentTitle.trim(), description: currentDescription.trim() });
                    const success = await saveTask(newTaskCard.id, currentTitle.trim(), currentDescription.trim());
                    taskTitle = currentTitle.trim();
                    taskId = newTaskCard.id;
                    draggedCard.remove();
                    draggedCard = newTaskCard;
                    const plusButton = document.getElementById('plusButton');
                    plusButton.style.visibility = 'visible';
                }
                await updateTaskPriority(taskTitle, isUrgent, isImportant);
                console.log('Appending card:', draggedCard.id, 'to container:', container.id);
                console.log('Dragged Card:', draggedCard, 'Parent Node:', draggedCard.parentNode);
                container.appendChild(draggedCard);
                await markTaskSuccess(taskId);
                console.log('Card successfully appended.');
            } catch (error) {
                console.error('Error updating task:', error);
                alert('Failed to move task!');
            }
        });
    });
}
