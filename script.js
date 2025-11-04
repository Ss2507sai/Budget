// ===== ENHANCED BUDGET DASHBOARD - ALL 10 PREMIUM FEATURES =====
// Full script.js integrating:
// 1. Budget vs Actual Comparison Chart
// 2. Smart Budget Alerts
// 3. Recurring Transactions
// 4. CSV/Excel Export
// 5. Month Comparison View
// 6. Expense Categories & Tags
// 7. Better Mobile Experience (JS handlers)
// 8. 50/30/20 Rule Visualizer
// 9. Savings Rate Calculator
// 10. Data Backup & Restore
//
// Notes:
// - This file is intended to be included after Chart.js and jsPDF if using exportToPDF.
// - Only JavaScript is provided (no HTML/CSS).
// - Uses localStorage/sessionStorage for persistence.
// - Avoids long dash characters; uses regular hyphen.

///////////////////////////
// Global state & config
///////////////////////////
let currentUser = null;
let currency = '₹';
let data = getDefaultData();
let filterState = { expenses: 'all', bills: 'all', savings: 'all', debt: 'all' };
let trendsChart = null;
let comparisonChart = null;
let ruleChart = null;
let savingsRateChart = null;
let alertsState = { lastAlertCheck: null, silencedUntil: null };
const EXPENSE_CATEGORIES = {
  needs: { name: 'Needs', color: '#ef4444', icon: '🏠' },
  wants: { name: 'Wants', color: '#f59e0b', icon: '🎮' },
  savings: { name: 'Savings', color: '#10b981', icon: '💰' },
  debt: { name: 'Debt', color: '#ec4899', icon: '💳' }
};
const ALERT_CONFIG_KEY = 'budget_alerts_config_v1';

///////////////////////////
// Utility helpers
///////////////////////////
function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 9);
}

function showToast(message, type = 'info') {
  // Assumes a container with id 'toastContainer' exists in the DOM
  const container = document.getElementById('toastContainer');
  if (!container) {
    // fallback: console.log
    console.log(`[${type}] ${message}`);
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatCurrency(amount) {
  return currency + (Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getUserStorageKey(key) {
  if (!currentUser) return `public_${key}`;
  return `user_${currentUser.email}_${key}`;
}

function parseJSONSafe(str, fallback = null) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

///////////////////////////
// Authentication (simple)
///////////////////////////
function getUsers() {
  const users = localStorage.getItem('budget_users');
  return users ? JSON.parse(users) : {};
}
function saveUsers(users) {
  localStorage.setItem('budget_users', JSON.stringify(users));
}
function checkAuth() {
  const loggedIn = sessionStorage.getItem('currentUser');
  if (loggedIn) {
    currentUser = JSON.parse(loggedIn);
    postLoginInit();
  } else {
    showAuthScreen();
  }
}
function loginUser(email, password) {
  const users = getUsers();
  email = email.trim().toLowerCase();
  if (!users[email] || users[email].password !== password) {
    showError('Login failed');
    return false;
  }
  currentUser = { email };
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  postLoginInit();
  return true;
}
function signupUser(email, password) {
  const users = getUsers();
  email = email.trim().toLowerCase();
  if (users[email]) { showError('Account exists'); return false; }
  users[email] = { password, createdAt: new Date().toISOString() };
  saveUsers(users);
  showToast('Account created. Please login.', 'success');
  return true;
}
function handleLogout() {
  sessionStorage.removeItem('currentUser');
  currentUser = null;
  showAuthScreen();
  showToast('Logged out', 'info');
}
function showAuthScreen() {
  // UI-related: expected in hosting HTML
  const main = document.getElementById('mainDashboard');
  if (main) main.style.display = 'none';
  const auth = document.getElementById('authScreen');
  if (auth) auth.style.display = 'flex';
}
function postLoginInit() {
  const main = document.getElementById('mainDashboard');
  if (main) main.style.display = 'block';
  const auth = document.getElementById('authScreen');
  if (auth) auth.style.display = 'none';
  loadDarkMode();
  createUserAvatar(currentUser.email);
  loadMonthData();
  applyRecurringTransactionsOnLoad();
  updateAll();
  updateTrendsChart();
  updateGoalsDisplay();
  checkAlerts();
  render50_30_20Rule();
  renderSavingsRate();
}

///////////////////////////
// Dark mode & avatar
///////////////////////////
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success');
  if (trendsChart) trendsChart.update();
}
function loadDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark-mode');
}
function createUserAvatar(email) {
  if (!email) return;
  const initials = email.substring(0, 2).toUpperCase();
  const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[email.charCodeAt(0) % colors.length];
  const avatar = document.getElementById('userAvatar');
  if (avatar) { avatar.textContent = initials; avatar.style.backgroundColor = color; }
  const widgetAvatar = document.getElementById('userAvatarWidget');
  if (widgetAvatar) { widgetAvatar.textContent = initials; widgetAvatar.style.backgroundColor = color; }
}

///////////////////////////
// Default data & storage
///////////////////////////
function getDefaultData() {
  return {
    income: [{ id: uid(), name: 'Realtor income', planned: 10600, actual: 10600, tags: [], category: 'needs' }],
    bills: [
      { id: uid(), name: 'Apartment', planned: 2300, actual: 2300, checked: true, tags: [], category: 'needs' },
      { id: uid(), name: 'Internet', planned: 85, actual: 85, checked: true, tags: [], category: 'needs' }
    ],
    expenses: [
      { id: uid(), name: 'Groceries', planned: 0, actual: 0, checked: false, tags: ['food'], category: 'needs' },
      { id: uid(), name: 'Swiggy', planned: 0, actual: 0, checked: false, tags: ['food','delivery'], category: 'wants' }
    ],
    savings: [
      { id: uid(), name: 'Retirement account', planned: 600, actual: 600, checked: true, tags: ['longterm'], category: 'savings' }
    ],
    debt: [
      { id: uid(), name: 'Credit card', planned: 315, actual: 315, checked: true, tags: [], category: 'debt' }
    ]
  };
}

function getCurrentMonthKey() {
  const startDate = document.getElementById('startDate');
  if (!startDate || !startDate.value) return 'budget_current';
  const date = new Date(startDate.value);
  return `budget_${date.getFullYear()}_${date.getMonth()}`;
}

function saveData() {
  if (!currentUser) return;
  const monthKey = getCurrentMonthKey();
  const key = getUserStorageKey(monthKey);
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // saved months list
    const monthsListKey = getUserStorageKey('savedMonthsList');
    let savedMonths = parseJSONSafe(localStorage.getItem(monthsListKey), []);
    if (!savedMonths.includes(monthKey)) { savedMonths.push(monthKey); localStorage.setItem(monthsListKey, JSON.stringify(savedMonths)); }
    localStorage.setItem(getUserStorageKey('currency'), currency);
    showToast('Saved', 'success');
  } catch (e) {
    console.error('Save error', e);
    showToast('Failed to save', 'error');
  }
}

function loadMonthData() {
  if (!currentUser) { data = getDefaultData(); return; }
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    data = parseJSONSafe(saved, getDefaultData());
  } else {
    data = getDefaultData();
  }
  currency = localStorage.getItem(getUserStorageKey('currency')) || currency;
}

function getSavedMonths() {
  if (!currentUser) return [];
  const key = getUserStorageKey('savedMonthsList');
  return parseJSONSafe(localStorage.getItem(key), []);
}

///////////////////////////
// Item management (CRUD)
///////////////////////////
function addNewItem(category) {
  const itemName = prompt('Enter new item name:');
  if (!itemName || !category) return;
  const newItem = { id: uid(), name: itemName.trim(), planned: 0, actual: 0, checked: false, tags: [], category: inferCategoryFromName(itemName) };
  data[category].push(newItem);
  updateAll();
  showToast(`Added ${itemName}`, 'success');
}
function editItemName(category, id) {
  const item = data[category].find(i => i.id === id);
  if (!item) return;
  const newName = prompt('Edit item name:', item.name);
  if (!newName) return;
  item.name = newName.trim();
  item.category = inferCategoryFromName(newName);
  updateAll();
  showToast('Updated', 'success');
}
function deleteItem(category, id) {
  const idx = data[category].findIndex(i => i.id === id);
  if (idx === -1) return;
  if (!confirm(`Delete "${data[category][idx].name}"?`)) return;
  const name = data[category][idx].name;
  data[category].splice(idx, 1);
  updateAll();
  showToast(`Deleted ${name}`, 'info');
}
function toggleItemChecked(category, id, checked) {
  const item = data[category].find(i => i.id === id);
  if (!item) return;
  item.checked = !!checked;
  updateAll();
}

///////////////////////////
// Auto-categorization & tags (feature #6)
///////////////////////////
function inferCategoryFromName(name) {
  const lower = (name || '').toLowerCase();
  const needsKeywords = ['rent', 'apartment', 'mortgage', 'electricity', 'water', 'grocer', 'groceries', 'internet', 'insurance', 'fuel', 'maintenance'];
  const wantsKeywords = ['entertainment', 'movie', 'movies', 'swiggy', 'zomato', 'netflix', 'amazon', 'gym', 'vacation', 'dinner'];
  const savingsKeywords = ['retirement', 'emergency', 'savings', 'investment'];
  const debtKeywords = ['loan', 'credit', 'debt', 'lease'];
  if (savingsKeywords.some(k => lower.includes(k))) return 'savings';
  if (debtKeywords.some(k => lower.includes(k))) return 'debt';
  if (wantsKeywords.some(k => lower.includes(k))) return 'wants';
  if (needsKeywords.some(k => lower.includes(k))) return 'needs';
  return 'wants';
}

///////////////////////////
// Rendering tables & UI glue (expects HTML placeholders)
///////////////////////////
function renderTable(category, tableId, hasProgress) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;
  let items = data[category] || [];
  if (hasProgress && filterState[category]) {
    if (filterState[category] === 'checked') items = items.filter(it => it.checked);
    if (filterState[category] === 'unchecked') items = items.filter(it => !it.checked);
  }
  let html = '';
  items.forEach((item) => {
    const progress = item.planned > 0 ? ((item.actual / item.planned) * 100).toFixed(2) + '%' : '100.00%';
    html += `<tr>
      <td style="min-width:160px;">
        ${hasProgress ? `<input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItemChecked('${category}','${item.id}', this.checked)">` : ''}
        <span ondblclick="editItemName('${category}','${item.id}')" style="cursor:pointer; margin-left:8px;">${item.name}</span>
        <div style="font-size:11px;color:#666;">${item.tags && item.tags.length ? item.tags.join(', ') : ''}</div>
      </td>
      <td><input type="number" value="${item.planned}" onchange="onPlannedChanged('${category}','${item.id}',this.value)"></td>
      <td><input type="number" value="${item.actual}" onchange="onActualChanged('${category}','${item.id}',this.value)"></td>
      ${hasProgress ? `<td>${progress}</td>` : ''}
      <td><button onclick="deleteItem('${category}','${item.id}')">×</button></td>
    </tr>`;
  });
  const totalPlanned = calculateTotal(category, 'planned');
  const totalActual = calculateTotal(category, 'actual');
  const totalProgress = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(2) + '%' : '100.00%';
  html += `<tr class="total-row"><td>TOTAL</td><td>${formatCurrency(totalPlanned)}</td><td>${formatCurrency(totalActual)}</td>${hasProgress ? `<td>${totalProgress}</td>` : ''}<td></td></tr>`;
  tbody.innerHTML = html;
}
function onPlannedChanged(category, id, value) {
  const item = (data[category] || []).find(i => i.id === id);
  if (!item) return;
  item.planned = parseFloat(value) || 0;
  updateAll();
}
function onActualChanged(category, id, value) {
  const item = (data[category] || []).find(i => i.id === id);
  if (!item) return;
  item.actual = parseFloat(value) || 0;
  updateAll();
}

///////////////////////////
// Calculations & main updater
///////////////////////////
function calculateTotal(category, field) {
  return (data[category] || []).reduce((s, it) => s + (Number(it[field]) || 0), 0);
}

function updateAll() {
  loadMonthData(); // ensures currency etc
  currency = document.getElementById('currency') ? document.getElementById('currency').value : currency;
  const totalIncome = calculateTotal('income', 'actual');
  const totalExpenses = calculateTotal('expenses', 'actual');
  const totalBills = calculateTotal('bills', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  const totalDebt = calculateTotal('debt', 'actual');
  const leftAmount = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;

  // Update summary cards if present
  const byId = id => document.getElementById(id);
  if (byId('summaryIncome')) byId('summaryIncome').textContent = formatCurrency(totalIncome);
  if (byId('summaryExpenses')) byId('summaryExpenses').textContent = formatCurrency(totalExpenses);
  if (byId('summaryBills')) byId('summaryBills').textContent = formatCurrency(totalBills);
  if (byId('summarySavings')) byId('summarySavings').textContent = formatCurrency(totalSavings);
  if (byId('summaryDebt')) byId('summaryDebt').textContent = formatCurrency(totalDebt);
  if (byId('amountLeft')) byId('amountLeft').textContent = formatCurrency(leftAmount);

  // render tables
  renderTable('income', 'incomeTable', false);
  renderTable('bills', 'billsTable', true);
  renderTable('expenses', 'expensesTable', true);
  renderTable('savings', 'savingsTable', true);
  renderTable('debt', 'debtTable', true);

  // charts and visualizers
  updateTrendsChart();
  updateBudgetVsActualChart();
  render50_30_20Rule();
  renderSavingsRate();

  updateGoalsDisplay();
  saveData();
  checkAlerts();
}

///////////////////////////
// Trends chart (existing)
///////////////////////////
function updateTrendsChart() {
  const canvas = document.getElementById('trendsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const savedMonths = getSavedMonths().sort();
  if (!savedMonths.length) { canvas.style.display = 'none'; return; }
  canvas.style.display = 'block';
  const monthsData = savedMonths.slice(-6).map(k => {
    const parsed = parseJSONSafe(localStorage.getItem(getUserStorageKey(k)), null);
    if (!parsed) return null;
    const parts = k.split('_');
    const year = parts[1], month = parseInt(parts[2]);
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return {
      label: `${monthNames[month]} ${year}`,
      income: (parsed.income || []).reduce((s,i)=>s+(i.actual||0),0),
      expenses: (parsed.expenses || []).reduce((s,i)=>s+(i.actual||0),0),
      bills: (parsed.bills || []).reduce((s,i)=>s+(i.actual||0),0),
      savings: (parsed.savings || []).reduce((s,i)=>s+(i.actual||0),0)
    };
  }).filter(Boolean);
  if (trendsChart) trendsChart.destroy();
  trendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthsData.map(d => d.label),
      datasets: [
        { label: 'Income', data: monthsData.map(d=>d.income), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', tension:0.4 },
        { label: 'Expenses', data: monthsData.map(d=>d.expenses), borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.08)', tension:0.4 },
        { label: 'Bills', data: monthsData.map(d=>d.bills), borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.08)', tension:0.4 },
        { label: 'Savings', data: monthsData.map(d=>d.savings), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.08)', tension:0.4 }
      ]
    },
    options: { responsive:true, plugins:{legend:{labels:{color:document.body.classList.contains('dark-mode')? '#e5e7eb' : '#333'}}}, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => currency + v.toLocaleString() } } } }
  });
}

///////////////////////////
// Budget vs Actual Comparison Chart (feature #1)
///////////////////////////
function updateBudgetVsActualChart() {
  const canvas = document.getElementById('comparisonChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const categories = ['Bills','Expenses','Savings','Debt'];
  const planned = [
    calculateTotal('bills','planned'),
    calculateTotal('expenses','planned'),
    calculateTotal('savings','planned'),
    calculateTotal('debt','planned')
  ];
  const actual = [
    calculateTotal('bills','actual'),
    calculateTotal('expenses','actual'),
    calculateTotal('savings','actual'),
    calculateTotal('debt','actual')
  ];
  if (comparisonChart) comparisonChart.destroy();
  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        { label: 'Planned', data: planned, backgroundColor: '#a78bfa' },
        { label: 'Actual', data: actual, backgroundColor: '#60a5fa' }
      ]
    },
    options: { responsive:true, plugins:{legend:{position:'top'}} }
  });
}

///////////////////////////
// Smart Budget Alerts (feature #2)
///////////////////////////
function getAlertsConfig() {
  return parseJSONSafe(localStorage.getItem(ALERT_CONFIG_KEY), {
    thresholds: { expensesPercent: 80, billsPercent: 90 }, // percent of income
    notifyWhenOverBudget: true,
    lastChecked: null
  });
}
function saveAlertsConfig(cfg) {
  localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(cfg));
}
function checkAlerts() {
  // Called on load and after updates
  if (!currentUser) return;
  const cfg = getAlertsConfig();
  const income = calculateTotal('income','actual') || 0;
  if (income <= 0) return;
  const expenses = calculateTotal('expenses','actual') + calculateTotal('bills','actual');
  const expensePct = (expenses / income) * 100;
  const now = Date.now();
  // Avoid repetitive alerts: simple cooldown with silencedUntil
  if (alertsState.silencedUntil && now < alertsState.silencedUntil) return;
  if (expensePct >= cfg.thresholds.expensesPercent) {
    showToast(`Alert: You have used ${expensePct.toFixed(0)}% of your income on expenses+bills.`, 'error');
    alertsState.lastAlertCheck = now;
    alertsState.silencedUntil = now + (1000 * 60 * 60); // silence for 1 hour
  }
  // Per-category alerts: if any category exceeds its planned budget by 20%
  ['expenses','bills','savings','debt'].forEach(cat => {
    const planned = calculateTotal(cat,'planned'), actual = calculateTotal(cat,'actual');
    if (planned > 0 && actual > planned * 1.2) {
      showToast(`Warning: ${cat} exceeded planned by ${(actual/planned*100 - 100).toFixed(0)}%`, 'error');
    }
  });
}

///////////////////////////
// Recurring Transactions (feature #3)
///////////////////////////
function getRecurringTransactions() {
  if (!currentUser) return [];
  return parseJSONSafe(localStorage.getItem(getUserStorageKey('recurring')), []);
}
function saveRecurringTransactions(list) {
  if (!currentUser) return;
  localStorage.setItem(getUserStorageKey('recurring'), JSON.stringify(list));
}
function addRecurringTransactionRaw(rec) {
  // rec: { id, name, amount, category: 'bills'|'expenses'|'income'|'savings'|'debt', frequency: 'monthly'|'weekly'|'daily', nextDate: 'YYYY-MM-DD', autoApply:true }
  const list = getRecurringTransactions();
  rec.id = rec.id || uid();
  list.push(rec);
  saveRecurringTransactions(list);
  showToast('Recurring transaction added', 'success');
}
function addRecurringTransaction() {
  // Simple prompt-based adding (no modal UI)
  const name = prompt('Name of recurring transaction:');
  if (!name) return;
  const amount = parseFloat(prompt('Amount:')) || 0;
  const category = prompt('Category (income|bills|expenses|savings|debt):', 'bills') || 'bills';
  const frequency = prompt('Frequency (daily|weekly|monthly):', 'monthly') || 'monthly';
  const nextDate = prompt('Next date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
  addRecurringTransactionRaw({ name, amount, category, frequency, nextDate, autoApply: true });
}
function applyRecurringTransactionsOnLoad() {
  // Look for recurring transactions due between last applied and now; apply them to the current month
  const recs = getRecurringTransactions();
  if (!recs.length) return;
  const today = new Date();
  const monthKey = getCurrentMonthKey();
  let applied = false;
  recs.forEach(rec => {
    if (!rec.nextDate) return;
    const next = new Date(rec.nextDate + 'T00:00:00');
    if (next <= today && rec.autoApply) {
      // Add to appropriate category in current data
      const entry = { id: uid(), name: rec.name, planned: rec.amount, actual: rec.amount, checked: false, tags: [], category: rec.category || inferCategoryFromName(rec.name) };
      if (!data[rec.category]) data[rec.category] = [];
      data[rec.category].push(entry);
      applied = true;
      // Advance nextDate based on frequency
      if (rec.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (rec.frequency === 'weekly') next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      rec.nextDate = next.toISOString().slice(0,10);
    }
  });
  if (applied) {
    saveRecurringTransactions(recs);
    saveData();
    showToast('Applied recurring transactions for this period', 'info');
  }
}

///////////////////////////
// CSV / Excel Export (feature #4)
///////////////////////////
function exportToCSV() {
  // exports all categories to a combined CSV
  const rows = [];
  const header = ['Category','Name','Planned','Actual','Checked','Tags','CategoryType'];
  rows.push(header.join(','));
  ['income','bills','expenses','savings','debt'].forEach(cat => {
    (data[cat] || []).forEach(it => {
      const line = [
        `"${cat}"`,
        `"${it.name.replace(/"/g,'""')}"`,
        `"${it.planned}"`,
        `"${it.actual}"`,
        `"${it.checked ? 'yes' : 'no'}"`,
        `"${(it.tags || []).join(';')}"`,
        `"${it.category || ''}"`
      ].join(',');
      rows.push(line);
    });
  });
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget_export_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('CSV exported', 'success');
}

///////////////////////////
// Month Comparison View (feature #5)
///////////////////////////
function compareTwoMonths(monthKeyA, monthKeyB) {
  // monthKey format: budget_YYYY_M
  const a = parseJSONSafe(localStorage.getItem(getUserStorageKey(monthKeyA)));
  const b = parseJSONSafe(localStorage.getItem(getUserStorageKey(monthKeyB)));
  if (!a || !b) {
    showToast('One or both months not found', 'error');
    return;
  }
  const summaryA = {
    income: (a.income||[]).reduce((s,i)=>s+(i.actual||0),0),
    expenses: (a.expenses||[]).reduce((s,i)=>s+(i.actual||0),0),
    bills: (a.bills||[]).reduce((s,i)=>s+(i.actual||0),0),
    savings: (a.savings||[]).reduce((s,i)=>s+(i.actual||0),0),
    debt: (a.debt||[]).reduce((s,i)=>s+(i.actual||0),0)
  };
  const summaryB = {
    income: (b.income||[]).reduce((s,i)=>s+(i.actual||0),0),
    expenses: (b.expenses||[]).reduce((s,i)=>s+(i.actual||0),0),
    bills: (b.bills||[]).reduce((s,i)=>s+(i.actual||0),0),
    savings: (b.savings||[]).reduce((s,i)=>s+(i.actual||0),0),
    debt: (b.debt||[]).reduce((s,i)=>s+(i.actual||0),0)
  };
  // render comparison in modal
  const categories = ['income','expenses','bills','savings','debt'];
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">';
  html += `<div><strong>Category</strong></div><div><strong>${monthKeyA}</strong></div><div><strong>${monthKeyB}</strong></div>`;
  categories.forEach(cat => {
    html += `<div>${cat}</div><div>${formatCurrency(summaryA[cat])}</div><div>${formatCurrency(summaryB[cat])}</div>`;
  });
  html += '</div>';
  showModal('Month Comparison', html);
  // Also show a small chart if canvas exists
  const canvas = document.getElementById('monthCompareCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const labels = categories.map(c => c.charAt(0).toUpperCase() + c.slice(1));
    const dataA = categories.map(c => summaryA[c]);
    const dataB = categories.map(c => summaryB[c]);
    if (window.monthCompareChart) window.monthCompareChart.destroy();
    window.monthCompareChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: monthKeyA, data: dataA }, { label: monthKeyB, data: dataB }] },
      options: { responsive:true }
    });
  }
}

///////////////////////////
// Better Mobile Experience - simple handlers (feature #7)
///////////////////////////
function enableMobileHandlers() {
  // Make big tap areas for summary cards
  document.querySelectorAll('.summary-card').forEach(el => {
    el.addEventListener('touchstart', () => el.classList.add('tapped'));
    el.addEventListener('touchend', () => el.classList.remove('tapped'));
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-target');
      if (target) {
        const panel = document.getElementById(target);
        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  // Swipe to open/close sidebar (basic)
  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 80) toggleSidebar(true);
    if (diff < -80) toggleSidebar(false);
  });
}
function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open', !!open);
}

///////////////////////////
// 50/30/20 Rule Visualizer (feature #8)
///////////////////////////
function render50_30_20Rule() {
  const canvas = document.getElementById('ruleChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const income = calculateTotal('income','actual') || 0;
  const needs = calculateTotal('bills','actual') + calculateTotal('expenses','actual');
  const wants = calculateTotal('expenses','actual'); // approximation
  const savings = calculateTotal('savings','actual');
  const targetNeeds = income * 0.5;
  const targetWants = income * 0.3;
  const targetSavings = income * 0.2;
  const labels = ['Needs','Wants','Savings'];
  const actuals = [needs, wants, savings];
  const targets = [targetNeeds, targetWants, targetSavings];
  if (ruleChart) ruleChart.destroy();
  ruleChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: actuals, backgroundColor: ['#ef4444','#f59e0b','#10b981'] },
        { label: 'Target', data: targets.map(t=>0), backgroundColor: ['rgba(0,0,0,0)'] } // target shown via legend only
      ]
    },
    options: {
      responsive:true,
      plugins: {
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatCurrency(ctx.raw)}` } },
        legend: { position:'bottom' }
      }
    }
  });
  // Display textual guidance
  const guidance = document.getElementById('ruleGuidance');
  if (guidance) {
    guidance.innerHTML = `
      <div>Income: ${formatCurrency(income)}</div>
      <div>Needs target: ${formatCurrency(targetNeeds)}, actual: ${formatCurrency(needs)}</div>
      <div>Wants target: ${formatCurrency(targetWants)}, actual: ${formatCurrency(wants)}</div>
      <div>Savings target: ${formatCurrency(targetSavings)}, actual: ${formatCurrency(savings)}</div>
    `;
  }
}

///////////////////////////
// Savings Rate Calculator (feature #9)
///////////////////////////
function calculateSavingsRate() {
  const income = calculateTotal('income','actual') || 0;
  const savings = calculateTotal('savings','actual') || 0;
  if (income <= 0) return 0;
  return (savings / income) * 100;
}
function renderSavingsRate() {
  const el = document.getElementById('savingsRate');
  if (el) {
    const rate = calculateSavingsRate();
    el.textContent = `${rate.toFixed(1)}%`;
  }
  const canvas = document.getElementById('savingsRateChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rate = calculateSavingsRate();
  if (savingsRateChart) savingsRateChart.destroy();
  savingsRateChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels:['Savings','Rest'], datasets:[{ data:[rate, Math.max(0,100-rate)], backgroundColor:['#10b981','#e5e7eb'] }] },
    options: { responsive:true, plugins:{legend:{display:false}}, circumference: 180, rotation: -90 }
  });
}

///////////////////////////
// Data Backup & Restore (feature #10)
///////////////////////////
function backupAllData() {
  if (!currentUser) { showToast('Login to backup data', 'info'); return; }
  const months = getSavedMonths();
  const exportObj = { meta: { user: currentUser.email, createdAt: new Date().toISOString() }, months: {} };
  months.forEach(mk => {
    const key = getUserStorageKey(mk);
    exportObj.months[mk] = parseJSONSafe(localStorage.getItem(key), null);
  });
  // Also include recurring, goals, alerts config
  exportObj.recurring = getRecurringTransactions();
  exportObj.goals = parseJSONSafe(localStorage.getItem(getUserStorageKey('goals')), []);
  exportObj.alerts = getAlertsConfig();
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget_backup_${currentUser.email}_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Backup created', 'success');
}
function restoreFromBackupFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const obj = JSON.parse(e.target.result);
      if (!obj || !obj.months) throw new Error('Invalid backup');
      Object.keys(obj.months).forEach(mk => {
        const key = getUserStorageKey(mk);
        localStorage.setItem(key, JSON.stringify(obj.months[mk]));
      });
      if (Array.isArray(obj.recurring)) saveRecurringTransactions(obj.recurring);
      if (Array.isArray(obj.goals)) localStorage.setItem(getUserStorageKey('goals'), JSON.stringify(obj.goals));
      if (obj.alerts) saveAlertsConfig(obj.alerts);
      showToast('Backup restored. Reloading...', 'success');
      setTimeout(()=> location.reload(), 1200);
    } catch (err) {
      console.error(err);
      showToast('Failed to restore backup', 'error');
    }
  };
  reader.readAsText(file);
}

///////////////////////////
// Export to PDF (existing, improved)
///////////////////////////
function exportToPDF() {
  showToast('Generating PDF...', 'info');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Budget Report', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`User: ${currentUser ? currentUser.email : 'Guest'}`, 20, 36);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 44);
    const totalIncome = calculateTotal('income','actual');
    const totalExpenses = calculateTotal('expenses','actual');
    const totalBills = calculateTotal('bills','actual');
    const totalSavings = calculateTotal('savings','actual');
    const totalDebt = calculateTotal('debt','actual');
    const balance = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
    doc.text(`Income: ${formatCurrency(totalIncome)}`, 20, 56);
    doc.text(`Expenses: ${formatCurrency(totalExpenses)}`, 20, 64);
    doc.text(`Bills: ${formatCurrency(totalBills)}`, 20, 72);
    doc.text(`Savings: ${formatCurrency(totalSavings)}`, 20, 80);
    doc.text(`Debt: ${formatCurrency(totalDebt)}`, 20, 88);
    doc.setFont(undefined, 'bold');
    doc.text(`Balance: ${formatCurrency(balance)}`, 20, 96);
    // Save
    doc.save(`Budget_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('PDF exported', 'success');
  } catch (err) {
    console.error('PDF export error', err);
    showToast('PDF export failed', 'error');
  }
}

///////////////////////////
// Goals UI (already present, reused)
///////////////////////////
function getUserGoals() {
  if (!currentUser) return [];
  return parseJSONSafe(localStorage.getItem(getUserStorageKey('goals')), []);
}
function saveUserGoals(goals) {
  if (!currentUser) return;
  localStorage.setItem(getUserStorageKey('goals'), JSON.stringify(goals));
}
function showGoalsModal() {
  const goals = getUserGoals();
  let html = `<div style="margin-bottom:10px;"><button onclick="addNewGoal()">+ Add New Goal</button></div>`;
  if (!goals.length) html += '<div>No goals yet</div>';
  else {
    goals.forEach((g, idx) => {
      const p = g.target>0 ? Math.min(100, (g.current||0)/g.target*100) : 0;
      html += `<div style="padding:8px;border:1px solid #eee;margin-bottom:8px;"><strong>${g.name}</strong><div>${formatCurrency(g.current||0)} / ${formatCurrency(g.target)} (${p.toFixed(0)}%)</div><button onclick="deleteGoal(${idx})">Delete</button></div>`;
    });
  }
  showModal('Budget Goals', html);
}
function addNewGoal() {
  const name = prompt('Goal name:');
  if (!name) return;
  const target = parseFloat(prompt('Target amount:')) || 0;
  if (target <= 0) { showToast('Invalid target', 'error'); return; }
  const goals = getUserGoals();
  goals.push({ name, target, current: 0, createdAt: new Date().toISOString() });
  saveUserGoals(goals);
  showToast('Goal added', 'success');
  updateGoalsDisplay();
}
function deleteGoal(index) {
  if (!confirm('Delete goal?')) return;
  const goals = getUserGoals();
  goals.splice(index,1);
  saveUserGoals(goals);
  showToast('Goal deleted', 'info');
  updateGoalsDisplay();
}
function updateGoalsDisplay() {
  const goals = getUserGoals();
  const container = document.getElementById('goalsContainer');
  if (!container) return;
  if (!goals.length) { container.innerHTML = '<div>No goals</div>'; return; }
  // update current amounts from savings
  const totalSavings = calculateTotal('savings','actual');
  goals.forEach(g => { g.current = Math.min(g.target, totalSavings); });
  saveUserGoals(goals);
  let html = '';
  goals.forEach(g => {
    const pct = g.target>0 ? (g.current/g.target*100) : 0;
    html += `<div style="padding:12px;border:1px solid #eee;margin-bottom:8px;"><strong>${g.name}</strong><div>${formatCurrency(g.current)} / ${formatCurrency(g.target)}</div><div style="height:10px;background:#f1f5f9;border-radius:6px;margin-top:6px;"><div style="height:100%;width:${pct}% ;background:#8b5cf6;border-radius:6px;"></div></div></div>`;
  });
  container.innerHTML = html;
}

///////////////////////////
// Modal helper (simple)
///////////////////////////
function showModal(title, content) {
  const existing = document.getElementById('customModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'customModal';
  modal.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `<div style="background:#fff;padding:22px;border-radius:10px;max-width:920px;width:90%;max-height:80vh;overflow:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">${title}</h3>
      <button onclick="closeModal()">Close</button>
    </div>
    <div id="modalContent">${content}</div>
  </div>`;
  document.body.appendChild(modal);
}
function closeModal() {
  const m = document.getElementById('customModal');
  if (m) m.remove();
}

///////////////////////////
// Import / Restore UI wrapper
///////////////////////////
function promptRestoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const f = e.target.files[0];
    if (f) restoreFromBackupFile(f);
  };
  input.click();
}

///////////////////////////
// Small helpers for month load/delete/view (already there)
///////////////////////////
function viewPreviousMonths() {
  const saved = getSavedMonths();
  if (!saved.length) { showToast('No saved months', 'info'); return; }
  let html = '<div style="max-height:420px;overflow:auto;">';
  saved.sort().reverse().forEach(mk => {
    const parts = mk.split('_');
    const y = parts[1], m = parseInt(parts[2]);
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const displayName = `${monthNames[m]} ${y}`;
    const snapshot = parseJSONSafe(localStorage.getItem(getUserStorageKey(mk)), null);
    const income = snapshot ? (snapshot.income||[]).reduce((s,i)=>s+(i.actual||0),0) : 0;
    const expenses = snapshot ? (snapshot.expenses||[]).reduce((s,i)=>s+(i.actual||0),0) : 0;
    html += `<div style="padding:12px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;">
      <div><strong>${displayName}</strong><div style="font-size:13px;color:#666">${formatCurrency(income)} income · ${formatCurrency(expenses)} expenses</div></div>
      <div style="display:flex;gap:8px">
        <button onclick="loadMonth('${mk}')">Load</button>
        <button onclick="deleteMonth('${mk}')">Delete</button>
      </div>
    </div>`;
  });
  html += '</div>';
  showModal('Saved Months', html);
}
function loadMonth(monthKey) {
  closeModal();
  const parts = monthKey.split('_');
  const year = parts[1], month = parseInt(parts[2]);
  const start = document.getElementById('startDate'), end = document.getElementById('endDate');
  if (start && end) {
    start.value = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const endDate = new Date(year, month+1, 0);
    end.value = `${year}-${String(month+1).padStart(2,'0')}-${endDate.getDate()}`;
  }
  const stored = parseJSONSafe(localStorage.getItem(getUserStorageKey(monthKey)), null);
  if (!stored) { showToast('Month data missing', 'error'); return; }
  data = stored;
  updateAll();
  showToast('Month loaded', 'success');
}
function deleteMonth(monthKey) {
  if (!confirm('Delete this month? This cannot be undone.')) return;
  localStorage.removeItem(getUserStorageKey(monthKey));
  const monthsListKey = getUserStorageKey('savedMonthsList');
  let list = getSavedMonths();
  const idx = list.indexOf(monthKey);
  if (idx > -1) { list.splice(idx,1); localStorage.setItem(monthsListKey, JSON.stringify(list)); }
  showToast('Month deleted', 'info');
  viewPreviousMonths();
}

///////////////////////////
// Initial DOMContentLoaded wiring
///////////////////////////
document.addEventListener('DOMContentLoaded', function() {
  // Attach basic handlers if elements exist
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = (document.getElementById('email') || {}).value || '';
      const password = (document.getElementById('password') || {}).value || '';
      const mode = authForm.getAttribute('data-mode') || 'login'; // optional
      if (mode === 'signup') signupUser(email, password);
      else loginUser(email, password);
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);

  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.addEventListener('click', backupAllData);

  const restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn) restoreBtn.addEventListener('click', promptRestoreBackup);

  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);

  const toggleDarkBtn = document.getElementById('darkModeToggle');
  if (toggleDarkBtn) toggleDarkBtn.addEventListener('click', toggleDarkMode);

  const addRecurringBtn = document.getElementById('addRecurringBtn');
  if (addRecurringBtn) addRecurringBtn.addEventListener('click', addRecurringTransaction);

  // Mobile helpers
  enableMobileHandlers();

  // Load auth state
  checkAuth();
});

///////////////////////////
// Misc helpers & developer utilities
///////////////////////////
function consoleDumpCurrentState() {
  console.log({ currentUser, data, savedMonths: getSavedMonths(), recurring: getRecurringTransactions() });
}

// expose a few functions for debug in browser console
window.budgetApp = {
  getData: () => data,
  saveData,
  addRecurringTransactionRaw,
  exportToCSV,
  exportToPDF,
  backupAllData,
  restoreFromBackupFile,
  compareTwoMonths,
  calculateSavingsRate,
  render50_30_20Rule,
  checkAlerts,
  consoleDumpCurrentState
};
