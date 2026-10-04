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

        const uploadInput = document.getElementById('uploadInput');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        const modal = document.getElementById('modal');
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    handleUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            alert('엑셀(.xlsx, .xls) 또는 CSV 파일만 업로드할 수 있습니다.');
            event.target.value = '';
            return;
        }

        if (ext === 'csv') {
            this.readCsv(file);
        } else {
            this.readExcel(file);
        }
    }

    readCsv(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'string' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            this.importRows(rows);
        };
        reader.readAsText(file, 'utf-8');
    }

    readExcel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            this.importRows(rows);
        };
        reader.readAsArrayBuffer(file);
    }

    importRows(rows) {
        if (!rows || rows.length === 0) {
            alert('업로드된 파일에 내용이 없습니다.');
            return;
        }

        const dateKey = this.findColumnKey(rows[0], ['날짜', '일자', 'date', 'day', '일', 'schedule date']);
        const taskKey = this.findColumnKey(rows[0], ['할일', '할 일', '내용', 'task', 'todo', 'title', '메모', '업무']);

        if (!dateKey || !taskKey) {
            alert('엑셀에 "날짜"와 "할 일" 열이 있어야 합니다.\n예시: 날짜 / 할 일');
            return;
        }

        let added = 0;

        rows.forEach((row) => {
            const rawDate = row[dateKey];
            const rawTask = row[taskKey];
            if (rawDate === undefined || rawTask === undefined) return;

            const dateStr = this.parseDateToString(rawDate);
            const taskText = String(rawTask).trim();
            if (!dateStr || !taskText) return;

            if (!this.todos[dateStr]) {
                this.todos[dateStr] = [];
            }

            const alreadyExists = this.todos[dateStr].some(todo => todo.text === taskText);
            if (!alreadyExists) {
                this.todos[dateStr].push({
                    text: taskText,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
                added++;
            }
        });

        this.saveTodos();
        this.renderCalendar();

        if (added > 0) {
            alert(`${added}개의 일정이 달력에 추가되었습니다.`);
        } else {
            alert('추가된 일정이 없습니다. 날짜/할 일 형식이 맞는지 확인해 주세요.');
        }

        const fileInput = document.getElementById('uploadInput');
        if (fileInput) fileInput.value = '';
    }

    normalizeText(value) {
        return String(value).replace(/\s+/g, '').toLowerCase();
    }

    findColumnKey(row, candidates) {
        if (!row) return null;

        const keys = Object.keys(row);
        for (const candidate of candidates) {
            const lowerCandidate = this.normalizeText(candidate);
            for (const key of keys) {
                const lowerKey = this.normalizeText(key);
                if (lowerKey.includes(lowerCandidate)) {
                    return key;
                }
            }
        }
        return null;
    }

    parseDateToString(value) {
        if (value === null || value === undefined || value === '') return null;

        const dateValue = new Date(value);
        if (!isNaN(dateValue.getTime())) {
            return this.formatDate(dateValue);
        }

        const text = String(value).trim();
        const match = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (match) {
            const y = Number(match[1]);
            const m = Number(match[2]);
            const d = Number(match[3]);
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        const match2 = text.match(/(\d{4})(\d{2})(\d{2})/);
        if (match2) {
            const y = Number(match2[1]);
            const m = Number(match2[2]);
            const d = Number(match2[3]);
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        const match3 = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (match3) {
            const y = Number(match3[3]);
            const m = Number(match3[1]);
            const d = Number(match3[2]);
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        return null;
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
