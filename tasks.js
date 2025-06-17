class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentTaskId = null;
        this.taskIdCounter = 1;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.createParticles();
        this.updateStatistics();
        this.updateProgress();
        this.setDefaultDueDate();
    }

    setDefaultDueDate() {
        const today = new Date().toISOString().split('T')[0]; 
        const taskDueDateInput = document.getElementById('taskDueDate');
        const editTaskDueDateInput = document.getElementById('editTaskDueDate');
        if (taskDueDateInput) taskDueDateInput.value = today;
        if (editTaskDueDateInput) editTaskDueDateInput.value = today;
    }

    loadTasks() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
            if (this.tasks.length > 0) {
                this.taskIdCounter = Math.max(...this.tasks.map(task => task.id)) + 1;
            }
            this.renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.renderTasks();
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    setupEventListeners() {
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal('taskModal'));
        }

        const closeTaskModal = document.getElementById('closeTaskModal');
        if (closeTaskModal) {
            closeTaskModal.addEventListener('click', () => this.closeModal('taskDetailsModal'));
        }

        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => this.closeModal('editModal'));
        }

        const editTask = document.getElementById('editTask');
        if (editTask) {
            editTask.addEventListener('click', () => this.openEditModal());
        }

        const deleteTask = document.getElementById('deleteTask');
        if (deleteTask) {
            deleteTask.addEventListener('click', () => this.deleteTask());
        }

        const cancelEdit = document.getElementById('cancelEdit');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeModal('editModal'));
        }

        const cancelAdd = document.getElementById('cancelAdd');
        if (cancelAdd) {
            cancelAdd.addEventListener('click', () => this.closeModal('taskModal'));
        }

        const saveEdit = document.getElementById('saveEdit');
        if (saveEdit) {
            saveEdit.addEventListener('click', () => this.saveTaskEdit());
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        const groupHeaders = document.querySelectorAll('.group-header');
        groupHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const group = header.parentElement;
                group.classList.toggle('collapsed');
                const toggle = header.querySelector('.group-toggle');
                if (toggle) {
                    toggle.classList.toggle('expanded');
                }
            });
        });
    }

    addTask() {
        const taskNameInput = document.getElementById('taskName');
        const taskOwnerInput = document.getElementById('taskOwner');
        const taskStatusSelect = document.getElementById('taskStatus');
        const taskDueDateInput = document.getElementById('taskDueDate');
        const taskDescriptionInput = document.getElementById('taskDescription');

        if (!taskNameInput || !taskStatusSelect || !taskDueDateInput) {
            this.showFeedback('Required form elements are missing.');
            return;
        }

        const taskName = taskNameInput.value.trim();
        const taskOwner = taskOwnerInput ? taskOwnerInput.value.trim() : '';
        const taskStatus = taskStatusSelect.value;
        const taskDueDate = taskDueDateInput.value;
        const taskDescription = taskDescriptionInput ? taskDescriptionInput.value.trim() : '';

        if (!taskName) {
            this.showFeedback('Please enter a task name');
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            name: taskName,
            owner: taskOwner || 'Unassigned',
            status: taskStatus,
            dueDate: taskDueDate,
            description: taskDescription,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStatistics();
        this.updateProgress();
        taskForm.reset();
        this.setDefaultDueDate(); 
        this.closeModal('taskModal');

        this.showFeedback(`Task "${task.name}" created successfully. Status: ${task.status}. Due: ${new Date(taskDueDate).toLocaleDateString()}.`);
    }

    renderTasks() {
        const todoContainer = document.getElementById('todoTasks');
        const completedContainer = document.getElementById('completedTasks');

        if (!todoContainer || !completedContainer) {
            console.error('Task containers not found.');
            return;
        }

        todoContainer.innerHTML = '';
        completedContainer.innerHTML = '';

        if (this.tasks.length === 0) {
            todoContainer.innerHTML = this.createEmptyState();
            completedContainer.innerHTML = this.createEmptyState();
            return;
        }

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            if (task.status === 'Done') {
                completedContainer.appendChild(taskElement);
            } else {
                todoContainer.appendChild(taskElement);
            }
        });

        const todoCount = document.querySelector('#todoTasks ~ .group-header .task-count');
        const completedCount = document.querySelector('#completedTasks ~ .group-header .task-count');

        if (todoCount) {
            todoCount.textContent = this.tasks.filter(task => task.status !== 'Done').length;
        }
        if (completedCount) {
            completedCount.textContent = this.tasks.filter(task => task.status === 'Done').length;
        }
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.id = task.id;

        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

        taskElement.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.name}</div>
                    <div class="task-id">ID: ${task.id}</div>
                </div>
                <span class="task-status status-${task.status.toLowerCase().replace(' ', '-')}">
                    ${task.status}
                </span>
            </div>
            <div class="task-description">${task.description || 'No description'}</div>
            <div class="task-info">
                <div class="task-owner">
                    <span class="owner-avatar">${task.owner[0]?.toUpperCase() || 'U'}</span>
                    ${task.owner}
                </div>
                <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>
            </div>
        `;

        taskElement.addEventListener('click', () => this.showTaskDetails(task.id));
        return taskElement;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">No tasks here لايوجد مهام </div>
                <div class="empty-state-subtext">Add a new task to get started اضف مهمه للبدأ</div>
            </div>
        `;
    }

    updateStatistics() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.status === 'Done').length;
        const workingTasks = this.tasks.filter(task => task.status === 'Working on it').length;
        const stuckTasks = this.tasks.filter(task => task.status === 'Stuck').length;

        const statItems = document.querySelectorAll('.stat-item .stat-number');
        if (statItems.length >= 4) {
            statItems[0].textContent = totalTasks;
            statItems[1].textContent = completedTasks;
            statItems[2].textContent = workingTasks;
            statItems[3].textContent = stuckTasks;
        }
    }

    updateProgress() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.status === 'Done').length;
        const percentage = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const progressPercentage = document.querySelector('.progress-percentage');
        const progressFill = document.querySelector('.progress-fill');

        if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
        if (progressFill) progressFill.style.width = `${percentage}%`;
    }

    showTaskDetails(taskId) {
        this.currentTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modalContent = document.querySelector('#taskDetailsModal .modal-body');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <div class="task-detail-item">
                <div class="detail-label">Task Name</div>
                <div class="detail-value">${task.name}</div>
            </div>
            <div class="task-detail-item">
                <div class="detail-label">Owner</div>
                <div class="detail-value">${task.owner}</div>
            </div>
            <div class="task-detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${task.status}</div>
            </div>
            <div class="task-detail-item">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
            </div>
            <div class="task-detail-item">
                <div class="detail-label">Description</div>
                <div class="detail-value">${task.description || 'No description'}</div>
            </div>
            <div class="task-detail-item">
                <div class="detail-label">Created At</div>
                <div class="detail-value">${new Date(task.createdAt).toLocaleDateString()}</div>
            </div>
        `;

        this.openModal('taskDetailsModal');
    }

    openEditModal() {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const inputs = {
            name: document.getElementById('editTaskName'),
            owner: document.getElementById('editTaskOwner'),
            status: document.getElementById('editTaskStatus'),
            dueDate: document.getElementById('editTaskDueDate'),
            description: document.getElementById('editTaskDescription')
        };

        if (Object.values(inputs).some(input => !input)) {
            this.showFeedback('Edit form elements are missing.');
            return;
        }

        inputs.name.value = task.name;
        inputs.owner.value = task.owner;
        inputs.status.value = task.status;
        inputs.dueDate.value = task.dueDate || new Date().toISOString().split('T')[0];
        inputs.description.value = task.description || '';

        this.closeModal('taskDetailsModal');
        this.openModal('editModal');
    }

    saveTaskEdit() {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const inputs = {
            name: document.getElementById('editTaskName'),
            owner: document.getElementById('editTaskOwner'),
            status: document.getElementById('editTaskStatus'),
            dueDate: document.getElementById('editTaskDueDate'),
            description: document.getElementById('editTaskDescription')
        };

        if (Object.values(inputs).some(input => !input)) {
            this.showFeedback('Edit form elements are missing.');
            return;
        }

        const oldName = task.name;
        task.name = inputs.name.value.trim();
        task.owner = inputs.owner.value.trim() || 'Unassigned';
        task.status = inputs.status.value;
        task.dueDate = inputs.dueDate.value;
        task.description = inputs.description.value.trim();

        if (!task.name) {
            this.showFeedback('Please enter a task name');
            return;
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStatistics();
        this.updateProgress();
        this.closeModal('editModal');

        this.showFeedback(`Task "${oldName}" updated to "${task.name}". New status: ${task.status}. ${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}.` : 'No due date.'}`);
    }

    deleteTask() {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        this.tasks = this.tasks.filter(t => t.id !== this.currentTaskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStatistics();
        this.updateProgress();
        this.closeModal('taskDetailsModal');

        this.showFeedback(`Task "${task.name}" deleted successfully.`);
    }

    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 3500);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        document.body.appendChild(particlesContainer);

        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${Math.random() * 4 + 2}px`;
            particle.style.height = particle.style.width;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particle.style.setProperty('--direction', Math.random() > 0.5 ? 1 : -1);
            particlesContainer.appendChild(particle);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});