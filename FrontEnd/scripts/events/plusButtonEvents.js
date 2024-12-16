import { createTaskCard } from '../utils/taskUtils.js';

export function setupPlusButton() {
    const plusButton = document.getElementById('plusButton');
    plusButton.addEventListener('click', () => {
        const emptyTaskCard = createTaskCard({ title: '', description: '' });

        emptyTaskCard.style.position = 'fixed';
        emptyTaskCard.style.top = '50%';
        emptyTaskCard.style.left = '50%';
        emptyTaskCard.style.transform = 'translate(-50%, -50%)';
        emptyTaskCard.style.padding = '1rem';
        emptyTaskCard.style.width = '300px';
        emptyTaskCard.style.zIndex = '10000';

        document.body.appendChild(emptyTaskCard);
        plusButton.style.visibility = 'hidden';
    });
}
