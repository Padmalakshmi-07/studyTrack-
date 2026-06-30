'use strict';

// ===== CONSTANTS =====
const KEYS = { activities: 'sat_activities', log: 'sat_log', theme: 'sat_theme' };

const QUOTES = [
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",author:"Malcolm X"},
  {text:"Learning never exhausts the mind.",author:"Leonardo da Vinci"},
  {text:"The expert in anything was once a beginner.",author:"Helen Hayes"},
  {text:"Push yourself, because no one else is going to do it for you.",author:"Unknown"},
  {text:"Great things never come from comfort zones.",author:"Unknown"},
  {text:"Don't watch the clock; do what it does — keep going.",author:"Sam Levenson"},
  {text:"The beautiful thing about learning is that no one can take it away from you.",author:"B.B. King"},
  {text:"Study hard, for the well is deep and our brains are shallow.",author:"Richard Baxter"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier"},
  {text:"The more that you read, the more things you will know.",author:"Dr. Seuss"},
  {text:"Education is not the filling of a pail, but the lighting of a fire.",author:"W.B. Yeats"},
];

// Inline SVG icons used in dynamically created elements.
// Stroke color is inherited via currentColor from the parent container.
const SVG = {
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  xCircle:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  alert:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const TOAST_ICONS = {
  success: SVG.checkCircle,
  error:   SVG.xCircle,
  info:    SVG.info,
  warning: SVG.alert,
};

// ===== STATE =====
let activities = JSON.parse(localStorage.getItem(KEYS.activities) || '[]');
let activityLog = JSON.parse(localStorage.getItem(KEYS.log) || '[]');
let currentFilter = 'all';
let searchQuery = '';

// ===== PERSIST =====
function save() {
  localStorage.setItem(KEYS.activities, JSON.stringify(activities));
  localStorage.setItem(KEYS.log, JSON.stringify(activityLog));
}

// ===== LOG =====
function addLog(type, text) {
  activityLog.unshift({ type, text, time: new Date().toISOString() });
  if (activityLog.length > 40) activityLog.length = 40;
}

// ====================================================
// TOAST NOTIFICATIONS
// ====================================================
function showToast(title, msg, type) {
  msg  = msg  || '';
  type = type || 'info';

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type]}</span>
    <div class="toast-body">
      <div class="toast-title">${escHtml(title)}</div>
      ${msg ? `<div class="toast-msg">${escHtml(msg)}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">&#10005;</button>
  `;
  el.querySelector('.toast-close').addEventListener('click', () => dismissToast(el));
  document.getElementById('toastContainer').appendChild(el);
  el._timer = setTimeout(() => dismissToast(el), 3800);
}

function dismissToast(el) {
  clearTimeout(el._timer);
  el.classList.add('hiding');
  setTimeout(() => el.remove(), 300);
}

// ====================================================
// DARK MODE
// ====================================================
const html = document.documentElement;

function initTheme() {
  const saved = localStorage.getItem(KEYS.theme);
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || preferred);
}

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem(KEYS.theme, theme);
  document.getElementById('themeIconHref').setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', '', 'info');
});

// ====================================================
// NAVIGATION
// ====================================================
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

function showSection(id) {
  sections.forEach(s => {
    const active = s.id === id;
    s.classList.toggle('active', active);
    if (active) { s.style.animation = 'none'; requestAnimationFrame(() => { s.style.animation = ''; }); }
  });
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
  document.getElementById('navLinks').classList.remove('open');
  const tog = document.getElementById('navToggle');
  tog.classList.remove('open');
  tog.setAttribute('aria-expanded', 'false');
  if (id === 'progress') renderProgress();
}

navLinks.forEach(l => l.addEventListener('click', e => {
  e.preventDefault(); showSection(l.dataset.section);
}));

document.getElementById('navToggle').addEventListener('click', function () {
  const open = !document.getElementById('navLinks').classList.contains('open');
  document.getElementById('navLinks').classList.toggle('open', open);
  this.classList.toggle('open', open);
  this.setAttribute('aria-expanded', String(open));
});

document.getElementById('startTrackingBtn').addEventListener('click', () => showSection('activities'));
document.getElementById('viewProgressBtn').addEventListener('click', () => showSection('progress'));

// ====================================================
// QUOTES
// ====================================================
let lastQuoteIdx = -1;

function showQuote() {
  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === lastQuoteIdx);
  lastQuoteIdx = idx;
  const q = QUOTES[idx];
  document.getElementById('quoteText').textContent = q.text;
  document.getElementById('quoteAuthor').textContent = '— ' + q.author;
}

document.getElementById('quoteRefresh').addEventListener('click', function () {
  this.classList.remove('spin');
  void this.offsetWidth;
  this.classList.add('spin');
  showQuote();
});

// ====================================================
// HOME STATS (animated counter)
// ====================================================
function animateNumber(el, to) {
  const from = parseInt(el.textContent) || 0;
  if (from === to) return;
  const steps = Math.ceil(400 / 16);
  const diff = to - from;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    el.textContent = Math.round(from + diff * (i / steps));
    if (i >= steps) { el.textContent = to; clearInterval(iv); }
  }, 16);
}

function updateHomeStats() {
  const total = activities.length;
  const done  = activities.filter(a => a.completed).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  animateNumber(document.getElementById('totalActivities'), total);
  animateNumber(document.getElementById('completedActivities'), done);
  animateNumber(document.getElementById('pendingActivities'), total - done);
  document.getElementById('homeProgressPct').textContent = pct + '%';
}

// ====================================================
// UTILITIES
// ====================================================
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ====================================================
// ACTIVITIES — render helpers
// ====================================================
function getVisible() {
  const q = searchQuery.toLowerCase();
  return activities.filter(a => {
    const matchQ = !q || a.name.toLowerCase().includes(q);
    const matchF =
      currentFilter === 'all' ||
      (currentFilter === 'completed' &&  a.completed) ||
      (currentFilter === 'pending'   && !a.completed);
    return matchQ && matchF;
  });
}

function updateFilterCounts() {
  const q    = searchQuery.toLowerCase();
  const base = q ? activities.filter(a => a.name.toLowerCase().includes(q)) : activities;
  document.getElementById('cntAll').textContent     = base.length;
  document.getElementById('cntPending').textContent = base.filter(a => !a.completed).length;
  document.getElementById('cntDone').textContent    = base.filter(a =>  a.completed).length;
}

function renderActivities() {
  const visible = getVisible();
  const list    = document.getElementById('activityList');
  const empty   = document.getElementById('emptyState');

  list.innerHTML = '';
  if (visible.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    visible.forEach(a => list.appendChild(buildItem(a)));
  }
  updateFilterCounts();
  updateHomeStats();
}

function buildItem(act) {
  const div = document.createElement('div');
  div.className = `activity-item${act.completed ? ' completed' : ''}`;
  div.dataset.id  = act.id;
  div.dataset.cat = act.category;

  // Checkbox
  const check = document.createElement('div');
  check.className = `act-check${act.completed ? ' done' : ''}`;
  check.setAttribute('role', 'checkbox');
  check.setAttribute('aria-checked', String(act.completed));
  check.setAttribute('tabindex', '0');
  check.title = act.completed ? 'Mark as pending' : 'Mark as complete';
  const toggleFn = () => toggleActivity(act.id);
  check.addEventListener('click', toggleFn);
  check.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFn(); }
  });

  // Info
  const info = document.createElement('div');
  info.className = 'act-info';
  info.innerHTML = `
    <div class="act-name">${escHtml(act.name)}</div>
    <div class="act-meta">
      <span class="badge badge-${act.category}">${act.category}</span>
      <span class="act-date">${fmtDate(act.createdAt)}</span>
    </div>
  `;

  // Delete button
  const del = document.createElement('button');
  del.className = 'act-del';
  del.title = 'Delete task';
  del.setAttribute('aria-label', `Delete "${act.name}"`);
  del.innerHTML = SVG.trash;
  del.addEventListener('click', () => deleteActivity(act.id));

  div.append(check, info, del);
  return div;
}

// ====================================================
// ACTIVITIES — CRUD
// ====================================================
function addActivity() {
  const input = document.getElementById('activityInput');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }

  const category = document.getElementById('categorySelect').value;
  const act = { id: uid(), name, category, completed: false, createdAt: new Date().toISOString() };
  activities.unshift(act);
  addLog('added', `Added "${name}"`);
  save();
  input.value = '';
  input.focus();
  renderActivities();
  showToast('Task added', `"${name}" has been added to your list.`, 'info');
}

document.getElementById('addActivityBtn').addEventListener('click', addActivity);
document.getElementById('activityInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addActivity();
});

function toggleActivity(id) {
  const a = activities.find(x => x.id === id);
  if (!a) return;
  a.completed = !a.completed;
  addLog(a.completed ? 'completed' : 'added', `${a.completed ? 'Completed' : 'Reopened'} "${a.name}"`);
  save();
  renderActivities();

  if (a.completed) {
    showToast('Task completed', `"${a.name}" — well done, keep it up!`, 'success');
    if (activities.length > 0 && activities.every(x => x.completed)) {
      showToast('All tasks complete', 'Outstanding work! You finished everything.', 'success');
    }
  }
}

function deleteActivity(id) {
  const a = activities.find(x => x.id === id);
  if (!a) return;
  activities = activities.filter(x => x.id !== id);
  addLog('deleted', `Deleted "${a.name}"`);
  save();
  renderActivities();
  showToast('Task deleted', `"${a.name}" has been removed.`, 'error');
}

// Bulk actions
document.getElementById('markAllBtn').addEventListener('click', () => {
  const pending = activities.filter(a => !a.completed);
  if (!pending.length) {
    showToast('All tasks complete', 'Every task is already marked as done.', 'success');
    return;
  }
  pending.forEach(a => { a.completed = true; });
  addLog('bulk', `Marked ${pending.length} task${pending.length > 1 ? 's' : ''} as done`);
  save();
  renderActivities();
  showToast(
    `${pending.length} task${pending.length > 1 ? 's' : ''} completed`,
    'Keep up the great work!',
    'success'
  );
});

document.getElementById('clearCompletedBtn').addEventListener('click', () => {
  const done = activities.filter(a => a.completed);
  if (!done.length) {
    showToast('Nothing to clear', 'No completed tasks found.', 'warning');
    return;
  }
  activities = activities.filter(a => !a.completed);
  addLog('deleted', `Cleared ${done.length} completed task${done.length > 1 ? 's' : ''}`);
  save();
  renderActivities();
  showToast('Cleared', `${done.length} completed task${done.length > 1 ? 's' : ''} removed.`, 'info');
});

// ====================================================
// SEARCH
// ====================================================
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  searchClear.style.display = searchQuery ? 'flex' : 'none';
  renderActivities();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.display = 'none';
  searchInput.focus();
  renderActivities();
});

// ====================================================
// FILTER TABS
// ====================================================
document.querySelectorAll('.ftab').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderActivities();
  });
});

// ====================================================
// PROGRESS
// ====================================================
function renderProgress() {
  const total     = activities.length;
  const completed = activities.filter(a => a.completed).length;
  const pending   = total - completed;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
  const circ      = 2 * Math.PI * 50; // r = 50

  // Ring
  const ring = document.getElementById('progressRingFill');
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ - (pct / 100) * circ;
  document.getElementById('progressPercent').textContent = pct + '%';

  // Stats
  document.getElementById('progTotal').textContent     = total;
  document.getElementById('progCompleted').textContent = completed;
  document.getElementById('progPending').textContent   = pending;

  // Bar
  document.getElementById('progressBarFill').style.width = pct + '%';
  document.getElementById('progressBarPct').textContent  = pct + '%';
  document.getElementById('pbTrack').setAttribute('aria-valuenow', pct);
  document.getElementById('progRemaining').textContent =
    `${pending} task${pending !== 1 ? 's' : ''} remaining`;
  document.getElementById('progDoneLabel').textContent = `${completed} done`;

  // Category breakdown
  const cats = ['study','assignment','exam','project','reading','practice','revision'];
  const breakdown = document.getElementById('categoryBreakdown');
  breakdown.innerHTML = '';
  let any = false;

  cats.forEach(cat => {
    const group = activities.filter(a => a.category === cat);
    if (!group.length) return;
    any = true;
    const done = group.filter(a => a.completed).length;
    const p    = Math.round((done / group.length) * 100);
    const row  = document.createElement('div');
    row.className = `cat-row cat-${cat}`;
    row.innerHTML = `
      <span class="cat-name">${cat}</span>
      <div class="cat-track"><div class="cat-fill" style="width:${p}%"></div></div>
      <span class="cat-cnt">${done}/${group.length}</span>
    `;
    breakdown.appendChild(row);
  });

  if (!any) breakdown.innerHTML = '<p class="log-empty">Add tasks to see breakdown.</p>';

  // Activity log
  const logEl = document.getElementById('activityLog');
  logEl.innerHTML = '';
  if (!activityLog.length) {
    logEl.innerHTML = '<p class="log-empty">No activity yet.</p>';
    return;
  }
  activityLog.slice(0, 12).forEach(entry => {
    const d = new Date(entry.time);
    const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            + ', ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `
      <div class="log-dot ${entry.type}"></div>
      <span class="log-txt">${escHtml(entry.text)}</span>
      <span class="log-time">${t}</span>
    `;
    logEl.appendChild(item);
  });
}

// ====================================================
// INIT
// ====================================================
initTheme();
showQuote();
renderActivities();