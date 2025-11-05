// ===== ENHANCED BUDGET DASHBOARD - COMPLETE FINAL VERSION =====

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currency = '₹';
let currentMonth = '';
let currentYear = '';
let data = getDefaultData();
let filterState = {
  expenses: 'all',
  bills: 'all',
  savings: 'all',
  debt: 'all'
};
let trendsChart = null;

// ===== DEFAULT DATA =====
function getDefaultData() {
  return {
    income: [],
    expenses: [],
    bills: [],
    savings: [],
    debt: []
  };
}

// ===== USER STORAGE FUNCTIONS =====
function getUserStorageKey(key) {
  if (!currentUser) return key;
  return `budget_${currentUser.email}_${key}`;
}

function getSavedMonths() {
  if (!currentUser) return [];
  const key = getUserStorageKey('savedMonthsList');
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth()).padStart(2, '0');
  return `month_${year}_${month}`;
}

// ===== AUTHENTICATION =====
function showAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'block';
  
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  if (userEmailDisplay && currentUser) {
    userEmailDisplay.textContent = currentUser.email;
  }
  
  createUserAvatar(currentUser.email);
  updateMobileAvatar();
  loadCurrentMonth();
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('budget_users') || '{}');
  
  if (users[email] && users[email].password === password) {
    currentUser = { email: email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showToast('Welcome back! 👋', 'success');
    showDashboard();
  } else {
    showToast('Invalid email or password', 'error');
  }
}

function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('budget_users') || '{}');
  
  if (users[email]) {
    showToast('Email already exists. Please login.', 'error');
    return;
  }
  
  users[email] = { password: password, createdAt: new Date().toISOString() };
  localStorage.setItem('budget_users', JSON.stringify(users));
  
  currentUser = { email: email };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  showToast('Account created successfully! 🎉', 'success');
  showDashboard();
}

function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  
  currentUser = null;
  localStorage.removeItem('currentUser');
  data = getDefaultData();
  showToast('Logged out successfully', 'info');
  showAuth();
  closeUserMenu();
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
  
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}Form`).style.display = 'block';
}

// ===== MOBILE NAVIGATION =====
function showMobileSection(section) {
  const sections = document.querySelectorAll('.mobile-section');
  const buttons = document.querySelectorAll('.nav-btn');
  
  sections.forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  
  buttons.forEach(b => b.classList.remove('active'));
  
  const targetSection = document.getElementById(`section-${section}`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
  }
  
  const clickedBtn = document.querySelector(`[data-section="${section}"]`);
  if (clickedBtn) {
    clickedBtn.classList.add('active');
  }
}

// ===== MONTH MANAGEMENT =====
function saveCurrentMonth() {
  if (!currentUser) return;
  
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  
  localStorage.setItem(storageKey, JSON.stringify(data));
  
  const monthsListKey = getUserStorageKey('savedMonthsList');
  let savedMonths = getSavedMonths();
  
  if (!savedMonths.includes(monthKey)) {
    savedMonths.push(monthKey);
    localStorage.setItem(monthsListKey, JSON.stringify(savedMonths));
  }
  
  showToast('Month saved successfully! 💾', 'success');
}

function loadCurrentMonth() {
  if (!currentUser) return;
  
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  const saved = localStorage.getItem(storageKey);
  
  if (saved) {
    data = JSON.parse(saved);
  } else {
    data = getDefaultData();
  }
  
  updateAll();
  updateTrendsChart();
}

function loadMonthData(monthKey) {
  if (!currentUser) return;
  
  const storageKey = getUserStorageKey(monthKey);
  const saved = localStorage.getItem(storageKey);
  
  if (saved) {
    data = JSON.parse(saved);
    updateAll();
    showToast('Month loaded successfully!', 'success');
  }
}

function showMonthSelector() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    showToast('No saved months yet', 'info');
    return;
  }
  
  let html = '<h3 style="margin-bottom: 20px;">Select a Month to Load</h3>';
  html += '<div style="display: grid; gap: 10px;">';
  
  savedMonths.sort().reverse().forEach(monthKey => {
    const parts = monthKey.split('_');
    const year = parts[1];
    const month = parts[2];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const displayName = `${monthNames[parseInt(month)]} ${year}`;
    
    html += `
      <button onclick="loadMonthData('${monthKey}'); closeModal();" 
              style="padding: 15px; background: white; border: 2px solid #8b5cf6; border-radius: 8px; cursor: pointer; font-size: 16px; text-align: left; transition: all 0.3s;">
        📅 ${displayName}
      </button>
    `;
  });
  
  html += '</div>';
  showModal('Load Previous Month', html);
}

// ===== CATEGORY INITIALIZATION =====
function getCategoryForItem(itemName, categoryType) {
  if (categoryType === 'bills') return 'needs';
  if (categoryType === 'expenses') return 'wants';
  if (categoryType === 'savings') return 'savings';
  if (categoryType === 'debt') return 'debt';
  return 'wants';
}

function initializeCategories() {
  ['expenses', 'bills', 'savings', 'debt'].forEach(category => {
    data[category].forEach(item => {
      item.category = getCategoryForItem(item.name, category);
      if (!item.tags) {
        item.tags = [];
      }
    });
  });
}

// ===== DATA OPERATIONS =====
function saveData() {
  if (!currentUser) return;
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function addItem(category) {
  const name = prompt(`Enter ${category} name:`);
  if (!name) return;
  
  const planned = parseFloat(prompt('Enter planned amount:'));
  if (isNaN(planned)) {
    showToast('Invalid amount', 'error');
    return;
  }
  
  data[category].push({
    name: name.trim(),
    planned: planned,
    actual: 0,
    checked: false,
    category: getCategoryForItem(name, category),
    tags: []
  });
  
  updateAll();
  showToast(`${name} added successfully!`, 'success');
}

function deleteItem(category, index) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  data[category].splice(index, 1);
  updateAll();
  showToast('Item deleted', 'info');
}

function toggleCheck(category, index) {
  data[category][index].checked = !data[category][index].checked;
  updateAll();
}

function updateItemValue(category, index, field, value) {
  const numValue = parseFloat(value) || 0;
  data[category][index][field] = numValue;
  updateAll();
}

function calculateTotal(category, field) {
  return data[category].reduce((sum, item) => sum + (item[field] || 0), 0);
}

// ===== 50/30/20 RULE DISPLAY =====
function update503020Display() {
  console.log('=== update503020Display() called ===');
  
  const container = document.getElementById('rule503020Container');
  
  if (!container) {
    console.warn('⚠️ rule503020Container NOT FOUND in DOM!');
    return;
  }
  
  const totalIncome = calculateTotal('income', 'actual');
  console.log('Total Income:', totalIncome);
  
  if (totalIncome === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Add income data to see your 50/30/20 analysis</p>';
    return;
  }
  
  // Bills = Needs, Expenses = Wants, Savings = Savings
  const needsActual = calculateTotal('bills', 'actual');
  const wantsActual = calculateTotal('expenses', 'actual');
  const savingsActual = calculateTotal('savings', 'actual');
  
  console.log('Bills (Needs):', needsActual);
  console.log('Expenses (Wants):', wantsActual);
  console.log('Savings:', savingsActual);
  
  const needsIdeal = totalIncome * 0.50;
  const wantsIdeal = totalIncome * 0.30;
  const savingsIdeal = totalIncome * 0.20;
  
  const needsPercent = (needsActual / totalIncome * 100).toFixed(1);
  const wantsPercent = (wantsActual / totalIncome * 100).toFixed(1);
  const savingsPercent = (savingsActual / totalIncome * 100).toFixed(1);
  
  container.innerHTML = `
    <div class="rule-container">
      <div class="rule-item">
        <div class="rule-percentage" style="color: #ef4444;">50%</div>
        <div class="rule-label">Needs (Bills)</div>
        <div class="rule-amount">${formatCurrency(needsActual)}</div>
        <div class="rule-bar">
          <div class="rule-bar-fill" style="width: ${Math.min((needsActual / needsIdeal * 100), 100)}%; background: #ef4444;"></div>
        </div>
        <div class="rule-status" style="color: ${needsActual <= needsIdeal ? '#10b981' : '#ef4444'};">
          ${needsPercent}% of income
        </div>
      </div>
      
      <div class="rule-item">
        <div class="rule-percentage" style="color: #f59e0b;">30%</div>
        <div class="rule-label">Wants (Expenses)</div>
        <div class="rule-amount">${formatCurrency(wantsActual)}</div>
        <div class="rule-bar">
          <div class="rule-bar-fill" style="width: ${Math.min((wantsActual / wantsIdeal * 100), 100)}%; background: #f59e0b;"></div>
        </div>
        <div class="rule-status" style="color: ${wantsActual <= wantsIdeal ? '#10b981' : '#ef4444'};">
          ${wantsPercent}% of income
        </div>
      </div>
      
      <div class="rule-item">
        <div class="rule-percentage" style="color: #3b82f6;">20%</div>
        <div class="rule-label">Savings</div>
        <div class="rule-amount">${formatCurrency(savingsActual)}</div>
        <div class="rule-bar">
          <div class="rule-bar-fill" style="width: ${Math.min((savingsActual / savingsIdeal * 100), 100)}%; background: #3b82f6;"></div>
        </div>
        <div class="rule-status" style="color: ${savingsActual >= savingsIdeal ? '#10b981' : '#f59e0b'};">
          ${savingsPercent}% of income
        </div>
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="show503020Rule()" style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        View Detailed Analysis
      </button>
    </div>
  `;
  
  console.log('✅ 50/30/20 display updated successfully!');
}

function show503020Rule() {
  const totalIncome = calculateTotal('income', 'actual');
  
  if (totalIncome === 0) {
    showToast('Add income data first', 'info');
    return;
  }
  
  const needsActual = calculateTotal('bills', 'actual');
  const wantsActual = calculateTotal('expenses', 'actual');
  const savingsActual = calculateTotal('savings', 'actual');
  
  const needsIdeal = totalIncome * 0.50;
  const wantsIdeal = totalIncome * 0.30;
  const savingsIdeal = totalIncome * 0.20;
  
  const needsPercent = (needsActual / totalIncome * 100).toFixed(1);
  const wantsPercent = (wantsActual / totalIncome * 100).toFixed(1);
  const savingsPercent = (savingsActual / totalIncome * 100).toFixed(1);
  
  let html = `
    <h3 style="margin-bottom: 20px;">50/30/20 Budget Rule Analysis 📊</h3>
    <p style="color: #666; margin-bottom: 20px;">The 50/30/20 rule suggests: 50% for needs (Bills), 30% for wants (Expenses), 20% for savings.</p>
    
    <div style="display: grid; gap: 15px;">
      <div style="background: #fee; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>🏠 Needs (50%) - All Bills</strong></span>
          <span><strong>${formatCurrency(needsActual)} / ${formatCurrency(needsIdeal)}</strong></span>
        </div>
        <div style="background: #fef2f2; border-radius: 4px; height: 24px; overflow: hidden;">
          <div style="background: #ef4444; height: 100%; width: ${Math.min((needsActual / needsIdeal * 100), 100)}%; transition: width 0.3s; display: flex; align-items: center; padding-left: 10px; color: white; font-weight: bold; font-size: 12px;">
            ${needsPercent}%
          </div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: ${needsActual <= needsIdeal ? '#10b981' : '#ef4444'};">
          ${needsActual <= needsIdeal ? '✅ Within budget' : '⚠️ Over by ' + formatCurrency(needsActual - needsIdeal)}
        </p>
      </div>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>🎮 Wants (30%) - All Expenses</strong></span>
          <span><strong>${formatCurrency(wantsActual)} / ${formatCurrency(wantsIdeal)}</strong></span>
        </div>
        <div style="background: #fefce8; border-radius: 4px; height: 24px; overflow: hidden;">
          <div style="background: #f59e0b; height: 100%; width: ${Math.min((wantsActual / wantsIdeal * 100), 100)}%; transition: width 0.3s; display: flex; align-items: center; padding-left: 10px; color: white; font-weight: bold; font-size: 12px;">
            ${wantsPercent}%
          </div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: ${wantsActual <= wantsIdeal ? '#10b981' : '#ef4444'};">
          ${wantsActual <= wantsIdeal ? '✅ Within budget' : '⚠️ Over by ' + formatCurrency(wantsActual - wantsIdeal)}
        </p>
      </div>
      
      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>💰 Savings (20%)</strong></span>
          <span><strong>${formatCurrency(savingsActual)} / ${formatCurrency(savingsIdeal)}</strong></span>
        </div>
        <div style="background: #eff6ff; border-radius: 4px; height: 24px; overflow: hidden;">
          <div style="background: #3b82f6; height: 100%; width: ${Math.min((savingsActual / savingsIdeal * 100), 100)}%; transition: width 0.3s; display: flex; align-items: center; padding-left: 10px; color: white; font-weight: bold; font-size: 12px;">
            ${savingsPercent}%
          </div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: ${savingsActual >= savingsIdeal ? '#10b981' : '#f59e0b'};">
          ${savingsActual >= savingsIdeal ? '✅ Meeting goal!' : '💡 Save ' + formatCurrency(savingsIdeal - savingsActual) + ' more'}
        </p>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #f8f5ff; border-radius: 8px;">
      <h4>Quick Tips</h4>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">📄 Bills are counted as "Needs" - keep them under 50%</li>
        <li style="margin-bottom: 8px;">🛍️ Expenses are counted as "Wants" - keep them under 30%</li>
        <li style="margin-bottom: 8px;">💰 Automate savings to hit your 20% target</li>
      </ul>
    </div>
  `;
  
  showModal('50/30/20 Budget Rule', html);
}

// ===== SAVINGS RATE DISPLAY =====
function updateSavingsRateDisplay() {
  const container = document.getElementById('savingsRateContainer');
  if (!container) return;
  
  const totalIncome = calculateTotal('income', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  
  if (totalIncome === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Add income data to track your savings rate</p>';
    return;
  }
  
  const savingsRate = (totalSavings / totalIncome * 100).toFixed(1);
  const monthlySavings = totalSavings;
  const annualSavings = monthlySavings * 12;
  
  let rateColor = '#ef4444';
  if (savingsRate >= 20) rateColor = '#10b981';
  else if (savingsRate >= 10) rateColor = '#f59e0b';
  
  container.innerHTML = `
    <div class="savings-rate-display">
      <div class="savings-rate-percentage" style="color: ${rateColor};">${savingsRate}%</div>
      <div class="savings-rate-label">Your Savings Rate</div>
    </div>
    <div class="savings-trend">
      <div class="trend-item">
        <div class="trend-value">${formatCurrency(monthlySavings)}</div>
        <div class="trend-label">Monthly</div>
      </div>
      <div class="trend-item">
        <div class="trend-value">${formatCurrency(annualSavings)}</div>
        <div class="trend-label">Annual</div>
      </div>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="showSavingsRate()" style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        View Full Analysis
      </button>
    </div>
  `;
}

function showSavingsRate() {
  const totalIncome = calculateTotal('income', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  
  if (totalIncome === 0) {
    showToast('Add income data first', 'info');
    return;
  }
  
  const savingsRate = (totalSavings / totalIncome * 100).toFixed(1);
  const monthlySavings = totalSavings;
  const annualSavings = monthlySavings * 12;
  
  const yearsTo100k = totalSavings > 0 ? (100000 / annualSavings).toFixed(1) : '∞';
  const yearsTo500k = totalSavings > 0 ? (500000 / annualSavings).toFixed(1) : '∞';
  const yearsTo1m = totalSavings > 0 ? (1000000 / annualSavings).toFixed(1) : '∞';
  
  let rateComment = '';
  if (savingsRate < 5) rateComment = '🔴 Low - Consider reducing expenses';
  else if (savingsRate < 10) rateComment = '🟠 Fair - Room for improvement';
  else if (savingsRate < 20) rateComment = '🟡 Good - Above average';
  else if (savingsRate < 30) rateComment = '🟢 Great - Excellent savings habit';
  else rateComment = '🌟 Outstanding - Top 10%!';
  
  let html = `
    <h3 style="margin-bottom: 20px;">Savings Rate Analysis 💰</h3>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; font-size: 48px; font-weight: bold;">${savingsRate}%</h2>
      <p style="margin: 0; font-size: 18px;">Your Savings Rate</p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">${rateComment}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
        <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Monthly Savings</div>
        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(monthlySavings)}</div>
      </div>
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Annual Savings</div>
        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${formatCurrency(annualSavings)}</div>
      </div>
    </div>
    
    <div style="background: #f8f5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 15px 0;">Time to Reach Goals (at current rate)</h4>
      <div style="display: grid; gap: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
          <span>₹1,00,000</span>
          <span style="font-weight: bold; color: #8b5cf6;">${yearsTo100k} years</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
          <span>₹5,00,000</span>
          <span style="font-weight: bold; color: #8b5cf6;">${yearsTo500k} years</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 6px;">
          <span>₹10,00,000</span>
          <span style="font-weight: bold; color: #8b5cf6;">${yearsTo1m} years</span>
        </div>
      </div>
    </div>
  `;
  
  showModal('Savings Rate Calculator', html);
}

// ===== UPDATE ALL FUNCTION =====
function updateAll() {
  console.log('=== updateAll() called ===');
  
  const currencyEl = document.getElementById('currency');
  if (currencyEl) {
    currency = currencyEl.value;
  }
  
  initializeCategories();
  
  const totalIncome = calculateTotal('income', 'actual');
  const totalExpenses = calculateTotal('expenses', 'actual');
  const totalBills = calculateTotal('bills', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  const totalDebt = calculateTotal('debt', 'actual');
  const leftAmount = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
  
  console.log('Totals - Income:', totalIncome, 'Expenses:', totalExpenses, 'Bills:', totalBills, 'Savings:', totalSavings, 'Debt:', totalDebt);
  
  // Update summary cards
  updateSummaryCard('totalIncome', totalIncome, '#10b981');
  updateSummaryCard('totalExpenses', totalExpenses, '#ef4444');
  updateSummaryCard('totalBills', totalBills, '#f59e0b');
  updateSummaryCard('totalSavings', totalSavings, '#3b82f6');
  updateSummaryCard('totalDebt', totalDebt, '#ec4899');
  updateSummaryCard('leftAmount', leftAmount, leftAmount >= 0 ? '#10b981' : '#ef4444');
  
  // Update category tables
  updateTable('income');
  updateTable('expenses');
  updateTable('bills');
  updateTable('savings');
  updateTable('debt');
  
  // Update charts and displays
  console.log('About to call update503020Display...');
  update503020Display();
  updateSavingsRateDisplay();
  updateBudgetComparisonChart();
  updateTrendsChart();
  updateGoalsDisplay();
  
  saveData();
}

function updateSummaryCard(id, value, color) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = formatCurrency(value);
    el.style.color = color;
  }
}

function formatCurrency(amount) {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateTable(category) {
  const tbody = document.getElementById(`${category}List`);
  if (!tbody) return;
  
  const filteredItems = data[category].filter(item => {
    if (filterState[category] === 'all') return true;
    if (filterState[category] === 'paid') return item.checked;
    if (filterState[category] === 'unpaid') return !item.checked;
    return true;
  });
  
  if (filteredItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #999; padding: 30px;">No items yet. Click "+ Add New" to start!</td></tr>`;
    return;
  }
  
  tbody.innerHTML = filteredItems.map((item, originalIndex) => {
    const actualIndex = data[category].indexOf(item);
    const percentage = item.planned > 0 ? (item.actual / item.planned * 100).toFixed(0) : 100;
    
    return `
      <tr class="${item.checked ? 'checked' : ''}">
        <td>
          <input type="checkbox" ${item.checked ? 'checked' : ''} 
                 onchange="toggleCheck('${category}', ${actualIndex})">
          <span>${item.name}</span>
        </td>
        <td>
          <input type="number" value="${item.planned}" 
                 onchange="updateItemValue('${category}', ${actualIndex}, 'planned', this.value)" 
                 min="0" step="0.01">
        </td>
        <td>
          <input type="number" value="${item.actual}" 
                 onchange="updateItemValue('${category}', ${actualIndex}, 'actual', this.value)" 
                 min="0" step="0.01">
        </td>
        <td>
          <span class="percentage">${percentage}%</span>
          <button onclick="deleteItem('${category}', ${actualIndex})" class="delete-btn">×</button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Update totals
  const totalPlanned = calculateTotal(category, 'planned');
  const totalActual = calculateTotal(category, 'actual');
  const totalPercentage = totalPlanned > 0 ? (totalActual / totalPlanned * 100).toFixed(2) : '100.00';
  
  document.getElementById(`${category}PlannedTotal`).textContent = formatCurrency(totalPlanned);
  document.getElementById(`${category}ActualTotal`).textContent = formatCurrency(totalActual);
  document.getElementById(`${category}PercentageTotal`).textContent = totalPercentage + '%';
}

function setFilter(category, filterType) {
  filterState[category] = filterType;
  
  document.querySelectorAll(`#${category}Filters .filter-btn`).forEach(btn => {
    btn.classList.remove('active');
  });
  
  event.target.classList.add('active');
  
  updateTable(category);
}

// ===== CHARTS =====
function updateBudgetComparisonChart() {
  const canvas = document.getElementById('budgetComparisonChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  const categories = ['Income', 'Expenses', 'Bills', 'Savings', 'Debt'];
  const planned = [
    calculateTotal('income', 'planned'),
    calculateTotal('expenses', 'planned'),
    calculateTotal('bills', 'planned'),
    calculateTotal('savings', 'planned'),
    calculateTotal('debt', 'planned')
  ];
  const actual = [
    calculateTotal('income', 'actual'),
    calculateTotal('expenses', 'actual'),
    calculateTotal('bills', 'actual'),
    calculateTotal('savings', 'actual'),
    calculateTotal('debt', 'actual')
  ];
  
  const isDark = document.body.classList.contains('dark-mode');
  
  if (window.budgetComparisonChart) {
    window.budgetComparisonChart.destroy();
  }
  
  window.budgetComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          label: 'Planned',
          data: planned,
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: '#8b5cf6',
          borderWidth: 2
        },
        {
          label: 'Actual',
          data: actual,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: '#10b981',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: isDark ? '#e5e7eb' : '#333'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: isDark ? '#e5e7eb' : '#333',
            callback: function(value) {
              return currency + value.toLocaleString();
            }
          },
          grid: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        },
        x: {
          ticks: {
            color: isDark ? '#e5e7eb' : '#333'
          },
          grid: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        }
      }
    }
  });
}

function updateTrendsChart() {
  const canvas = document.getElementById('trendsChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    canvas.style.display = 'none';
    return;
  }
  
  canvas.style.display = 'block';
  
  const monthsData = savedMonths.sort().slice(-6).map(monthKey => {
    const parts = monthKey.split('_');
    const year = parts[1];
    const month = parts[2];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const storageKey = getUserStorageKey(monthKey);
    const monthData = JSON.parse(localStorage.getItem(storageKey));
    
    if (!monthData) return null;
    
    return {
      label: `${monthNames[parseInt(month)]} ${year}`,
      income: monthData.income.reduce((sum, item) => sum + (item.actual || 0), 0),
      expenses: monthData.expenses.reduce((sum, item) => sum + (item.actual || 0), 0),
      bills: monthData.bills.reduce((sum, item) => sum + (item.actual || 0), 0),
      savings: monthData.savings.reduce((sum, item) => sum + (item.actual || 0), 0)
    };
  }).filter(d => d !== null);
  
  if (trendsChart) {
    trendsChart.destroy();
  }
  
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e5e7eb' : '#333';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  
  trendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthsData.map(d => d.label),
      datasets: [
        {
          label: 'Income',
          data: monthsData.map(d => d.income),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: monthsData.map(d => d.expenses),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        },
        {
          label: 'Bills',
          data: monthsData.map(d => d.bills),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4
        },
        {
          label: 'Savings',
          data: monthsData.map(d => d.savings),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: function(value) {
              return currency + value.toLocaleString();
            }
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// ===== GOALS =====
function getUserGoals() {
  if (!currentUser) return [];
  const key = getUserStorageKey('goals');
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

function saveUserGoals(goals) {
  if (!currentUser) return;
  const key = getUserStorageKey('goals');
  localStorage.setItem(key, JSON.stringify(goals));
}

function updateGoalsDisplay() {
  const goals = getUserGoals();
  const goalsSection = document.getElementById('goalsSection');
  const goalsContainer = document.getElementById('goalsContainer');
  
  if (!goalsSection || !goalsContainer) return;
  
  if (goals.length === 0) {
    goalsSection.style.display = 'none';
    return;
  }
  
  goalsSection.style.display = 'block';
  
  const totalSavings = calculateTotal('savings', 'actual');
  goals.forEach(goal => {
    goal.current = Math.min(totalSavings, goal.target);
  });
  saveUserGoals(goals);
  
  let html = '';
  goals.forEach((goal, index) => {
    const progress = goal.target > 0 ? (goal.current / goal.target * 100) : 0;
    const progressColor = progress >= 100 ? '#10b981' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#f59e0b' : '#ef4444';
    
    html += `
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 2px solid #e9d5ff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong>${goal.name}</strong>
          <span style="font-size: 14px; color: #666;">${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
        </div>
        <div style="background: #e9d5ff; border-radius: 8px; height: 20px; overflow: hidden;">
          <div style="background: ${progressColor}; height: 100%; width: ${Math.min(progress, 100)}%; transition: width 0.3s; display: flex; align-items: center; padding-left: 8px; color: white; font-weight: bold; font-size: 11px;">
            ${progress.toFixed(0)}%
          </div>
        </div>
      </div>
    `;
  });
  
  goalsContainer.innerHTML = html;
}

function showGoalsModal() {
  const goals = getUserGoals();
  
  let html = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 15px;">Set Your Budget Goals 🎯</h3>
      <button onclick="addNewGoal()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        + Add New Goal
      </button>
    </div>
  `;
  
  if (goals.length === 0) {
    html += '<p style="color: #666; text-align: center; padding: 40px;">No goals yet. Create your first goal to get started!</p>';
  } else {
    goals.forEach((goal, index) => {
      const progress = goal.target > 0 ? (goal.current / goal.target * 100) : 0;
      const progressColor = progress >= 100 ? '#10b981' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#f59e0b' : '#ef4444';
      
      html += `
        <div style="background: #f8f5ff; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div>
              <h4 style="margin: 0 0 5px 0;">${goal.name}</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">${formatCurrency(goal.current)} of ${formatCurrency(goal.target)}</p>
            </div>
            <button onclick="deleteGoal(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
          <div style="background: #e9d5ff; border-radius: 8px; height: 24px; overflow: hidden;">
            <div style="background: ${progressColor}; height: 100%; width: ${Math.min(progress, 100)}%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
              ${progress.toFixed(1)}%
            </div>
          </div>
          ${progress >= 100 ? '<p style="margin: 10px 0 0 0; color: #10b981; font-weight: bold;">🎉 Goal Achieved!</p>' : ''}
        </div>
      `;
    });
  }
  
  showModal('Budget Goals', html);
}

function addNewGoal() {
  const name = prompt('Goal name (e.g., "Save for vacation"):');
  if (!name) return;
  
  const target = parseFloat(prompt('Target amount:'));
  if (isNaN(target) || target <= 0) {
    showToast('Invalid target amount', 'error');
    return;
  }
  
  const goals = getUserGoals();
  goals.push({
    name: name.trim(),
    target: target,
    current: 0,
    createdAt: new Date().toISOString()
  });
  
  saveUserGoals(goals);
  showToast('Goal added successfully! 🎯', 'success');
  showGoalsModal();
}

function deleteGoal(index) {
  if (!confirm('Delete this goal?')) return;
  
  const goals = getUserGoals();
  goals.splice(index, 1);
  saveUserGoals(goals);
  showToast('Goal deleted', 'info');
  showGoalsModal();
}

// ===== RECURRING TRANSACTIONS =====
function getRecurringTransactions() {
  if (!currentUser) return [];
  const key = getUserStorageKey('recurring');
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

function saveRecurringTransactions(recurring) {
  if (!currentUser) return;
  const key = getUserStorageKey('recurring');
  localStorage.setItem(key, JSON.stringify(recurring));
}

function showRecurringTransactions() {
  const recurring = getRecurringTransactions();
  
  let html = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 15px;">Recurring Transactions 🔄</h3>
      <button onclick="addRecurringTransaction()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        + Add Recurring Transaction
      </button>
    </div>
  `;
  
  if (recurring.length === 0) {
    html += '<p style="color: #666; text-align: center; padding: 40px;">No recurring transactions. Add bills or expenses that repeat monthly!</p>';
  } else {
    recurring.forEach((item, index) => {
      const frequencyText = item.frequency === 'monthly' ? 'Every month' : 
                           item.frequency === 'weekly' ? 'Every week' : 'Every year';
      
      html += `
        <div style="background: #f8f5ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #8b5cf6;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 5px 0;">${item.name}</h4>
              <p style="margin: 0; color: #666; font-size: 13px;">
                ${formatCurrency(item.amount)} • ${frequencyText} • ${item.category}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Next: ${item.nextDate}</p>
            </div>
            <div>
              <button onclick="applyRecurring(${index})" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 12px;">Apply Now</button>
              <button onclick="deleteRecurring(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  showModal('Recurring Transactions', html);
}

function addRecurringTransaction() {
  const name = prompt('Transaction name (e.g., "Rent"):');
  if (!name) return;
  
  const amount = parseFloat(prompt('Amount:'));
  if (isNaN(amount) || amount <= 0) {
    showToast('Invalid amount', 'error');
    return;
  }
  
  const category = prompt('Category (expenses/bills/savings/debt):') || 'expenses';
  const frequency = prompt('Frequency (monthly/weekly/yearly):') || 'monthly';
  
  const recurring = getRecurringTransactions();
  recurring.push({
    name: name.trim(),
    amount: amount,
    category: category,
    frequency: frequency,
    nextDate: new Date().toISOString().split('T')[0],
    autoApply: false
  });
  
  saveRecurringTransactions(recurring);
  showToast('Recurring transaction added! 🔄', 'success');
  showRecurringTransactions();
}

function applyRecurring(index) {
  const recurring = getRecurringTransactions();
  const item = recurring[index];
  
  if (!data[item.category]) {
    showToast('Invalid category', 'error');
    return;
  }
  
  const existingIndex = data[item.category].findIndex(i => i.name === item.name);
  
  if (existingIndex >= 0) {
    data[item.category][existingIndex].actual += item.amount;
  } else {
    data[item.category].push({
      name: item.name,
      planned: item.amount,
      actual: item.amount,
      checked: true,
      category: getCategoryForItem(item.name, item.category),
      tags: []
    });
  }
  
  const nextDate = new Date(item.nextDate);
  if (item.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
  else if (item.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
  else if (item.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
  
  recurring[index].nextDate = nextDate.toISOString().split('T')[0];
  saveRecurringTransactions(recurring);
  
  updateAll();
  showToast(`Applied: ${item.name}`, 'success');
  showRecurringTransactions();
}

function deleteRecurring(index) {
  if (!confirm('Delete this recurring transaction?')) return;
  
  const recurring = getRecurringTransactions();
  recurring.splice(index, 1);
  saveRecurringTransactions(recurring);
  showToast('Recurring transaction deleted', 'info');
  showRecurringTransactions();
}

// ===== BACKUP & RESTORE =====
function showBackupRestore() {
  let html = `
    <h3 style="margin-bottom: 20px;">💾 Backup & Restore</h3>
    <div style="display: grid; gap: 20px;">
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h4 style="margin: 0 0 10px 0;">📥 Create Backup</h4>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Download all your budget data as a JSON file</p>
        <button onclick="backupAllData(); closeModal();" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%;">
          Download Backup
        </button>
      </div>
      
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 10px 0;">📤 Restore from Backup</h4>
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Upload a previously saved backup file</p>
        <button onclick="document.getElementById('restoreFileInput').click(); closeModal();" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%;">
          Choose Backup File
        </button>
      </div>
    </div>
  `;
  
  showModal('Backup & Restore', html);
}

function backupAllData() {
  if (!currentUser) return;
  
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    user: currentUser.email,
    currency: currency,
    currentData: data,
    goals: getUserGoals(),
    recurring: getRecurringTransactions(),
    months: {}
  };
  
  const savedMonths = getSavedMonths();
  savedMonths.forEach(monthKey => {
    const storageKey = getUserStorageKey(monthKey);
    const monthData = localStorage.getItem(storageKey);
    if (monthData) {
      backup.months[monthKey] = JSON.parse(monthData);
    }
  });
  
  const dataStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BudgetBackup_${currentUser.email}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showToast('✅ Backup created successfully!', 'success');
}

function handleRestoreFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      
      if (!backup.version || !backup.user || !backup.currentData) {
        showToast('Invalid backup file format', 'error');
        return;
      }
      
      if (backup.currentData) {
        data = backup.currentData;
        saveData();
      }
      
      if (backup.goals) {
        saveUserGoals(backup.goals);
      }
      
      if (backup.recurring) {
        saveRecurringTransactions(backup.recurring);
      }
      
      if (backup.months) {
        Object.keys(backup.months).forEach(monthKey => {
          const storageKey = getUserStorageKey(monthKey);
          localStorage.setItem(storageKey, JSON.stringify(backup.months[monthKey]));
        });
        
        const monthsListKey = getUserStorageKey('savedMonthsList');
        let savedMonths = getSavedMonths();
        Object.keys(backup.months).forEach(monthKey => {
          if (!savedMonths.includes(monthKey)) {
            savedMonths.push(monthKey);
          }
        });
        localStorage.setItem(monthsListKey, JSON.stringify(savedMonths));
      }
      
      updateAll();
      updateTrendsChart();
      updateGoalsDisplay();
      
      showToast('✅ Data restored successfully! Refreshing...', 'success');
      setTimeout(() => location.reload(), 1500);
      
    } catch (error) {
      console.error('Restore error:', error);
      showToast('❌ Failed to restore backup. Invalid file.', 'error');
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

// ===== EXPORT FUNCTIONS =====
function exportToPDF() {
  showToast('Generating PDF...', 'info');
  window.print();
}

function exportToCSV() {
  if (!currentUser) return;
  
  let csv = 'Category,Name,Planned,Actual,Percentage,Status\n';
  
  ['income', 'expenses', 'bills', 'savings', 'debt'].forEach(category => {
    data[category].forEach(item => {
      const percentage = item.planned > 0 ? (item.actual / item.planned * 100).toFixed(2) : '100.00';
      const status = item.checked ? 'Paid' : 'Unpaid';
      csv += `${category},${item.name},${item.planned},${item.actual},${percentage}%,${status}\n`;
    });
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Budget_${currentUser.email}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showToast('CSV exported successfully! 📊', 'success');
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  
  const icon = document.getElementById('darkModeIcon');
  const text = document.getElementById('darkModeText');
  if (icon && text) {
    icon.textContent = isDark ? '☀️' : '🌙';
    text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
  
  updateMobileAvatar();
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
  
  if (trendsChart) {
    updateTrendsChart();
  }
  if (window.budgetComparisonChart) {
    updateBudgetComparisonChart();
  }
}

function loadDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('darkModeIcon');
    const text = document.getElementById('darkModeText');
    if (icon && text) {
      icon.textContent = '☀️';
      text.textContent = 'Light Mode';
    }
  }
}

// ===== UI FUNCTIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showModal(title, content) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  if (modal && modalTitle && modalContent) {
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.style.display = 'flex';
  }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function createUserAvatar(email) {
  const initials = email.substring(0, 2).toUpperCase();
  const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const colorIndex = email.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  const avatar = document.getElementById('userAvatar');
  if (avatar) {
    avatar.textContent = initials;
    avatar.style.backgroundColor = color;
  }
  
  const widgetAvatar = document.getElementById('userAvatarWidget');
  if (widgetAvatar) {
    widgetAvatar.textContent = initials;
    widgetAvatar.style.backgroundColor = color;
  }
}

function updateMobileAvatar() {
  if (!currentUser) return;
  
  const mobileAvatar = document.getElementById('userAvatarMobile');
  const mobileEmail = document.getElementById('userEmailDisplayMobile');
  const darkModeIconMobile = document.getElementById('darkModeIconMobile');
  const darkModeTextMobile = document.getElementById('darkModeTextMobile');
  
  if (mobileAvatar) {
    const initials = currentUser.email.substring(0, 2).toUpperCase();
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const colorIndex = currentUser.email.charCodeAt(0) % colors.length;
    
    mobileAvatar.textContent = initials;
    mobileAvatar.style.backgroundColor = colors[colorIndex];
  }
  
  if (mobileEmail) {
    mobileEmail.textContent = currentUser.email;
  }
  
  const isDark = document.body.classList.contains('dark-mode');
  if (darkModeIconMobile && darkModeTextMobile) {
    darkModeIconMobile.textContent = isDark ? '☀️' : '🌙';
    darkModeTextMobile.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userDropdownMenu');
  const btn = document.getElementById('widgetToggleBtn');
  
  if (menu && btn) {
    menu.classList.toggle('show');
    btn.classList.toggle('active');
  }
}

function closeUserMenu() {
  const menu = document.getElementById('userDropdownMenu');
  const btn = document.getElementById('widgetToggleBtn');
  
  if (menu && btn) {
    menu.classList.remove('show');
    btn.classList.remove('active');
  }
}

function closeAlertBanner() {
  const banner = document.getElementById('alertBanner');
  if (banner) {
    banner.style.display = 'none';
  }
}

function showAlertBanner(message) {
  const banner = document.getElementById('alertBanner');
  const messageEl = document.getElementById('alertMessage');
  if (banner && messageEl) {
    messageEl.textContent = message;
    banner.style.display = 'block';
    setTimeout(() => closeAlertBanner(), 5000);
  }
}

function showMonthComparison() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length < 2) {
    showToast('Need at least 2 months of data to compare', 'info');
    return;
  }
  
  const lastMonths = savedMonths.sort().slice(-6);
  
  const comparisonData = lastMonths.map(monthKey => {
    const parts = monthKey.split('_');
    const year = parts[1];
    const month = parts[2];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const storageKey = getUserStorageKey(monthKey);
    const monthData = JSON.parse(localStorage.getItem(storageKey));
    
    if (!monthData) return null;
    
    return {
      label: `${monthNames[parseInt(month)]} ${year}`,
      income: monthData.income.reduce((sum, item) => sum + (item.actual || 0), 0),
      expenses: monthData.expenses.reduce((sum, item) => sum + (item.actual || 0), 0),
      bills: monthData.bills.reduce((sum, item) => sum + (item.actual || 0), 0),
      savings: monthData.savings.reduce((sum, item) => sum + (item.actual || 0), 0)
    };
  }).filter(d => d !== null);
  
  let html = `
    <h3 style="margin-bottom: 20px;">Month-to-Month Comparison 📈</h3>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Month</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Income</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Expenses</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Bills</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Savings</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Balance</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  comparisonData.forEach(month => {
    const balance = month.income - month.expenses - month.bills - month.savings;
    html += `
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">${month.label}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #10b981;">${formatCurrency(month.income)}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #ef4444;">${formatCurrency(month.expenses)}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #f59e0b;">${formatCurrency(month.bills)}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: #3b82f6;">${formatCurrency(month.savings)}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(balance)}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  
  const avgIncome = comparisonData.reduce((sum, m) => sum + m.income, 0) / comparisonData.length;
  const avgExpenses = comparisonData.reduce((sum, m) => sum + m.expenses, 0) / comparisonData.length;
  const avgSavings = comparisonData.reduce((sum, m) => sum + m.savings, 0) / comparisonData.length;
  
  html += `
    <div style="margin-top: 20px; padding: 15px; background: #f8f5ff; border-radius: 8px;">
      <h4>Averages</h4>
      <p>Monthly Income: ${formatCurrency(avgIncome)}</p>
      <p>Monthly Expenses: ${formatCurrency(avgExpenses)}</p>
      <p>Monthly Savings: ${formatCurrency(avgSavings)}</p>
      <p>Savings Rate: ${(avgSavings / avgIncome * 100).toFixed(1)}%</p>
    </div>
  `;
  
  showModal('Month Comparison', html);
}

// ===== EVENT LISTENERS =====
document.addEventListener('click', function(event) {
  const menu = document.getElementById('userDropdownMenu');
  const btn = document.getElementById('widgetToggleBtn');
  
  if (menu && btn) {
    const isClickInside = menu.contains(event.target) || btn.contains(event.target);
    
    if (!isClickInside && menu.classList.contains('show')) {
      closeUserMenu();
    }
  }
});

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
  loadDarkMode();
  
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboard();
  } else {
    showAuth();
  }
  
  showMobileSection('overview');
});
