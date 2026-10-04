class TodoCalendar {
    constructor() {
        this.currentDate = new Date();
        this.todos = this.loadTodos();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
    }

    setupEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextMonth());
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        const modal = document.getElementById('modal');
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        document.getElementById('monthYear').textContent = `${year}년 ${month + 1}월`;

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        const daysContainer = document.getElementById('daysContainer');
        daysContainer.innerHTML = '';

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'day other-month';
            day.innerHTML = `<div class="day-number">${prevLastDate - i}</div>`;
            daysContainer.appendChild(day);
        }

        const today = new Date();
        for (let date = 1; date <= lastDate; date++) {
            const day = document.createElement('div');
            day.className = 'day';

            const dateStr = this.getDateString(year, month, date);
            const todoCount = this.getTodoCount(dateStr);

            if (
                year === today.getFullYear() &&
                month === today.getMonth() &&
                date === today.getDate()
            ) {
                day.classList.add('today');
            }

            if (todoCount > 0) {
                day.classList.add('has-todo');
            }

            day.innerHTML = `<div class="day-number">${date}</div>`;
            if (todoCount > 0) {
                day.innerHTML += `<div class="todo-count">📝 ${todoCount}</div>`;
            }

            day.addEventListener('click', () => this.openModal(dateStr));
            daysContainer.appendChild(day);
        }

        const totalCells = daysContainer.children.length;
        const remainingCells = 42 - totalCells;
        for (let date = 1; date <= remainingCells; date++) {
            const day = document.createElement('div');
            day.className = 'day other-month';
            day.innerHTML = `<div class="day-number">${date}</div>`;
            daysContainer.appendChild(day);
        }
    }

    getDateString(year, month, date) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    }

    getTodoCount(dateStr) {
        return this.todos[dateStr]?.length || 0;
    }

    openModal(dateStr) {
        const modal = document.getElementById('modal');
        const date = new Date(dateStr);

        document.getElementById('selectedDate').textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
        document.getElementById('todoInput').value = '';
        document.getElementById('todoInput').dataset.dateStr = dateStr;

        this.renderTodoList(dateStr);
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    renderTodoList(dateStr) {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        const todos = this.todos[dateStr] || [];
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = 'todo-item';

            li.innerHTML = `
                <input type="checkbox" id="todo-${index}" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${index}">${todo.text}</label>
                <button class="delete-btn">삭제</button>
            `;

            li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
                todo.completed = !todo.completed;
                this.saveTodos();
                this.renderTodoList(dateStr);
            });

            li.querySelector('.delete-btn').addEventListener('click', () => {
                this.todos[dateStr].splice(index, 1);
                if (this.todos[dateStr].length === 0) {
                    delete this.todos[dateStr];
                }
                this.saveTodos();
                this.renderTodoList(dateStr);
                this.renderCalendar();
            });

            todoList.appendChild(li);
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const dateStr = input.dataset.dateStr;
        const text = input.value.trim();

        if (!text || !dateStr) return;

        if (!this.todos[dateStr]) {
            this.todos[dateStr] = [];
        }

        this.todos[dateStr].push({
            text,
            completed: false,
            createdAt: new Date().toISOString()
        });

        this.saveTodos();
        input.value = '';
        this.renderTodoList(dateStr);
        this.renderCalendar();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : {};
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoCalendar();
});
