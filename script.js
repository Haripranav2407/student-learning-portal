// script.js - Complete Mini LMS
const STORAGE_KEY = 'lms_portal_data';
let data = loadData();
let currentUser = null;
let quizTimer = null;
let currentCourseId = null;
let currentModule = null;

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return {
        users: [{ username: 'student', password: 'pass123', email: 'student@example.com', progress: {} }],
        courses: [
            {
                id: 1,
                name: 'Mathematics 101',
                description: 'Introduction to Algebra and Geometry',
                modules: [
                    {
                        id: 1,
                        name: 'Basic Algebra',
                        content: 'Learn variables, equations, solving linear equations, and basic functions.',
                        quiz: [
                            { question: 'What is 5 + 7?', options: ['10', '11', '12', '13'], answer: '12' },
                            { question: 'Solve: x - 3 = 9', options: ['10', '11', '12', '13'], answer: '12' }
                        ]
                    },
                    {
                        id: 2,
                        name: 'Geometry Basics',
                        content: 'Study shapes, angles, area, perimeter, and basic theorems.',
                        quiz: [
                            { question: 'A triangle has how many sides?', options: ['3', '4', '5', '6'], answer: '3' }
                        ]
                    }
                ]
            }
        ],
        notes: []
    };
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Switch between Register and Login
document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
});

document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('register-section').classList.add('active');
});

// Registration
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm-password').value;
    const email = document.getElementById('reg-email').value.trim();

    if (password !== confirm) return showError('register-error', 'Passwords do not match.');
    if (password.length < 6) return showError('register-error', 'Password must be at least 6 characters.');
    if (data.users.some(u => u.username === username)) return showError('register-error', 'Username already taken.');

    const newUser = { username, password, email: email || '', progress: {} };
    data.users.push(newUser);
    saveData();

    currentUser = newUser;
    showMainApp();
    initApp();
    alert(`Welcome, ${username}! Your account has been created.`);
});

function showError(id, msg) {
    document.getElementById(id).textContent = msg;
}

// Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        showMainApp();
        initApp();
    } else {
        document.getElementById('login-error').textContent = 'Invalid username or password';
    }
});

function showMainApp() {
    document.querySelectorAll('.auth-container').forEach(el => el.parentElement.classList.remove('active'));
    document.querySelector('header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('welcome-user').textContent = currentUser.username;
}

// Navigation
document.querySelectorAll('nav button[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(btn.dataset.section).classList.add('active');
    });
});

document.getElementById('logout').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('register-section').classList.add('active');
    document.querySelector('header').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');
});

function initApp() {
    renderDashboard();
    renderCourses();
    renderNotes();
    renderProfile();
    populateNoteCourses();
}

// Dashboard & Progress
function renderDashboard() {
    const container = document.getElementById('progress-overview');
    container.innerHTML = data.courses.length === 0 ? '<p>No courses yet. Add one!</p>' : '';
    data.courses.forEach(course => {
        const progress = getProgress(course.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${course.name}</h3>
            <p>${course.description}</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
            <p><strong>${progress.toFixed(0)}%</strong> Complete</p>
            <button onclick="viewCourseModules(${course.id})" class="btn-secondary">Open Course</button>
        `;
        container.appendChild(card);
    });
}

function getProgress(courseId) {
    const course = data.courses.find(c => c.id === courseId);
    if (!course || course.modules.length === 0) return 0;
    const completed = (currentUser.progress[courseId] || []).length;
    return (completed / course.modules.length) * 100;
}

// Courses
function renderCourses() {
    const list = document.getElementById('course-list');
    list.innerHTML = '';
    data.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${course.name}</h3>
            <p>${course.description || 'No description'}</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${getProgress(course.id)}%"></div></div>
            <button onclick="viewCourseModules(${course.id})" class="btn-primary">View Modules</button>
        `;
        list.appendChild(card);
    });
}

window.viewCourseModules = function(courseId) {
    currentCourseId = courseId;
    const course = data.courses.find(c => c.id === courseId);
    const section = document.getElementById('courses');
    section.innerHTML = `
        <h2>${course.name} - Modules</h2>
        <div class="grid" id="module-list"></div>
        <button onclick="backToCourses()" class="btn-outline">← Back to Courses</button>
    `;
    const list = document.getElementById('module-list');
    course.modules.forEach(mod => {
        const completed = (currentUser.progress[courseId] || []).includes(mod.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${mod.name} ${completed ? '✓' : ''}</h3>
            <p>${mod.content.substring(0, 100)}...</p>
            <button onclick="viewModule(${courseId}, ${mod.id})" class="btn-primary">Open Module</button>
        `;
        list.appendChild(card);
    });
};

window.backToCourses = function() {
    renderCourses();
};

window.viewModule = function(courseId, moduleId) {
    const course = data.courses.find(c => c.id === courseId);
    currentModule = course.modules.find(m => m.id === moduleId);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('module').classList.add('active');
    document.getElementById('module-name').textContent = currentModule.name;
    document.getElementById('module-content').textContent = currentModule.content;

    document.getElementById('complete-module').onclick = () => completeModule(courseId, moduleId);
    document.getElementById('start-quiz').onclick = () => startQuiz(courseId, moduleId);
    document.getElementById('back-to-course').onclick = () => viewCourseModules(courseId);
};

function completeModule(courseId, moduleId) {
    if (!currentUser.progress[courseId]) currentUser.progress[courseId] = [];
    if (!currentUser.progress[courseId].includes(moduleId)) {
        currentUser.progress[courseId].push(moduleId);
        saveData();
        renderDashboard();
        alert('Module completed!');
    }
    viewCourseModules(courseId);
}

// Quiz
function startQuiz(courseId, moduleId) {
    document.getElementById('module').classList.remove('active');
    document.getElementById('quiz').classList.add('active');
    const course = data.courses.find(c => c.id === courseId);
    const module = course.modules.find(m => m.id === moduleId);
    document.getElementById('quiz-title').textContent = `${course.name} - ${module.name}`;

    const qDiv = document.getElementById('quiz-questions');
    qDiv.innerHTML = '';
    module.quiz.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<p><strong>${i+1}. ${q.question}</strong></p>`;
        q.options.forEach(opt => {
            div.innerHTML += `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`;
        });
        qDiv.appendChild(div);
    });

    startTimer(300);
    document.getElementById('submit-quiz').onclick = () => submitQuiz(module.quiz);
}

function startTimer(seconds) {
    let time = seconds;
    const el = document.getElementById('quiz-timer');
    clearInterval(quizTimer);
    quizTimer = setInterval(() => {
        const m = String(Math.floor(time / 60)).padStart(2, '0');
        const s = String(time % 60).padStart(2, '0');
        el.textContent = `Time Left: ${m}:${s}`;
        if (time-- <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
    }, 1000);
}

function submitQuiz(questions) {
    clearInterval(quizTimer);
    let score = 0;
    questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (sel && sel.value === q.answer) score++;
    });
    alert(`Quiz Finished!\nScore: ${score}/${questions.length}`);
    document.getElementById('quiz').classList.remove('active');
    viewCourseModules(currentCourseId);
}

// Notes
function populateNoteCourses() {
    const select = document.getElementById('note-course');
    select.innerHTML = '<option value="">Select Course</option>';
    data.courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    const userNotes = data.notes.filter(n => n.user === currentUser.username);
    if (userNotes.length === 0) {
        list.innerHTML = '<p>No notes yet. Start taking notes!</p>';
        return;
    }
    userNotes.forEach(n => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${n.course}</h3><p>${n.content}</p>`;
        list.appendChild(card);
    });
}

document.getElementById('add-note').addEventListener('click', () => {
    document.getElementById('add-note-form').classList.toggle('hidden');
});
document.getElementById('cancel-note').addEventListener('click', () => {
    document.getElementById('add-note-form').classList.add('hidden');
});
document.getElementById('add-note-form').addEventListener('submit', e => {
    e.preventDefault();
    const course = document.getElementById('note-course').value;
    const content = document.getElementById('note-content').value.trim();
    if (course && content) {
        data.notes.push({ id: Date.now(), user: currentUser.username, course, content });
        saveData();
        renderNotes();
        e.target.reset();
        e.target.classList.add('hidden');
    }
});

// Profile
function renderProfile() {
    document.getElementById('profile-username').value = currentUser.username;
    document.getElementById('profile-email').value = currentUser.email || '';
}
document.getElementById('profile-form').addEventListener('submit', e => {
    e.preventDefault();
    currentUser.email = document.getElementById('profile-email').value.trim();
    saveData();
    alert('Profile updated!');
});

// Add Course
document.getElementById('add-course').addEventListener('click', () => {
    document.getElementById('add-course-form').classList.toggle('hidden');
});
document.getElementById('cancel-course').addEventListener('click', () => {
    document.getElementById('add-course-form').classList.add('hidden');
});
document.getElementById('add-course-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('course-name').value.trim();
    const desc = document.getElementById('course-description').value.trim();
    if (name) {
        data.courses.push({ id: Date.now(), name, description: desc, modules: [] });
        saveData();
        renderCourses();
        renderDashboard();
        e.target.reset();
        e.target.classList.add('hidden');
    }
});