// ===== ENHANCED BUDGET DASHBOARD - COMPLETE VERSION WITH ALL FEATURES =====

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

// ===== ALERT BANNER =====
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

// ===== 50/30/20 RULE DISPLAY =====
function update503020Display() {
  const container = document.getElementById('rule503020Container');
  if (!container) return;
  
  const totalIncome = calculateTotal('income', 'actual');
  if (totalIncome === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Add income data to see your 50/30/20 analysis</p>';
    return;
  }
  
  const needsActual = data.expenses.filter(e => e.category === 'needs').reduce((sum, e) => sum + (e.actual || 0), 0) +
                      data.bills.filter(b => b.category === 'needs').reduce((sum, b) => sum + (b.actual || 0), 0);
  const wantsActual = data.expenses.filter(e => e.category === 'wants').reduce((sum, e) => sum + (e.actual || 0), 0) +
                      data.bills.filter(b => b.category === 'wants').reduce((sum, b) => sum + (b.actual || 0), 0);
  const savingsActual = calculateTotal('savings', 'actual');
  
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
        <div class="rule-label">Needs</div>
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
        <div class="rule-label">Wants</div>
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

// ===== BUDGET COMPARISON CHART =====
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

// ===== MOBILE AVATAR UPDATE =====
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

// ===== EXPENSE CATEGORIES & TAGS =====
const EXPENSE_CATEGORIES = {
  needs: { name: 'Needs', color: '#ef4444', icon: '🏠' },
  wants: { name: 'Wants', color: '#f59e0b', icon: '🎮' },
  savings: { name: 'Savings', color: '#10b981', icon: '💰' },
  debt: { name: 'Debt', color: '#ec4899', icon: '💳' }
};

function getCategoryForItem(itemName, categoryType) {
  const needsKeywords = ['rent', 'apartment', 'mortgage', 'electricity', 'water', 'groceries', 'internet', 'insurance', 'fuel', 'maintenance'];
  const wantsKeywords = ['entertainment', 'movies', 'swiggy', 'zomato', 'netflix', 'amazon', 'gym', 'vacation'];
  const savingsKeywords = ['retirement', 'emergency', 'savings', 'investment'];
  const debtKeywords = ['loan', 'credit', 'debt', 'lease'];
  
  const lowerName = itemName.toLowerCase();
  
  if (categoryType === 'savings' || savingsKeywords.some(k => lowerName.includes(k))) return 'savings';
  if (categoryType === 'debt' || debtKeywords.some(k => lowerName.includes(k))) return 'debt';
  if (wantsKeywords.some(k => lowerName.includes(k))) return 'wants';
  if (needsKeywords.some(k => lowerName.includes(k))) return 'needs';
  
  return categoryType === 'bills' ? 'needs' : 'wants';
}

function initializeCategories() {
  ['expenses', 'bills', 'savings', 'debt'].forEach(category => {
    data[category].forEach(item => {
      if (!item.category) {
        item.category = getCategoryForItem(item.name, category);
      }
      if (!item.tags) {
        item.tags = [];
      }
    });
  });
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

// ===== MONTH COMPARISON VIEW =====
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

// ===== 50/30/20 RULE VISUALIZER =====
function show503020Rule() {
  const totalIncome = calculateTotal('income', 'actual');
  
  if (totalIncome === 0) {
    showToast('Add income data first', 'info');
    return;
  }
  
  const totalExpenses = calculateTotal('expenses', 'actual') + calculateTotal('bills', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  
  const needsActual = data.expenses.filter(e => e.category === 'needs').reduce((sum, e) => sum + (e.actual || 0), 0) +
                      data.bills.filter(b => b.category === 'needs').reduce((sum, b) => sum + (b.actual || 0), 0);
  const wantsActual = data.expenses.filter(e => e.category === 'wants').reduce((sum, e) => sum + (e.actual || 0), 0) +
                      data.bills.filter(b => b.category === 'wants').reduce((sum, b) => sum + (b.actual || 0), 0);
  
  const needsIdeal = totalIncome * 0.50;
  const wantsIdeal = totalIncome * 0.30;
  const savingsIdeal = totalIncome * 0.20;
  
  const needsPercent = (needsActual / totalIncome * 100).toFixed(1);
  const wantsPercent = (wantsActual / totalIncome * 100).toFixed(1);
  const savingsPercent = (totalSavings / totalIncome * 100).toFixed(1);
  
  let html = `
    <h3 style="margin-bottom: 20px;">50/30/20 Budget Rule Analysis 📊</h3>
    <p style="color: #666; margin-bottom: 20px;">The 50/30/20 rule suggests: 50% for needs, 30% for wants, 20% for savings & debt.</p>
    
    <div style="display: grid; gap: 15px;">
      <div style="background: #fee; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>🏠 Needs (50%)</strong></span>
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
          <span><strong>🎮 Wants (30%)</strong></span>
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
          <span><strong>${formatCurrency(totalSavings)} / ${formatCurrency(savingsIdeal)}</strong></span>
        </div>
        <div style="background: #eff6ff; border-radius: 4px; height: 24px; overflow: hidden;">
          <div style="background: #3b82f6; height: 100%; width: ${Math.min((totalSavings / savingsIdeal * 100), 100)}%; transition: width 0.3s; display: flex; align-items: center; padding-left: 10px; color: white; font-weight: bold; font-size: 12px;">
            ${savingsPercent}%
          </div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: ${totalSavings >= savingsIdeal ? '#10b981' : '#f59e0b'};">
          ${totalSavings >= savingsIdeal ? '✅ Meeting goal!' : '💡 Save ' + formatCurrency(savingsIdeal - totalSavings) + ' more'}
        </p>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #f8f5ff; border-radius: 8px;">
      <h4>Quick Tips</h4>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Review your wants category and cut unnecessary expenses</li>
        <li style="margin-bottom: 8px;">Automate savings to hit your 20% target</li>
        <li style="margin-bottom: 8px;">Track needs carefully - housing and utilities should be under 50%</li>
      </ul>
    </div>
  `;
  
  showModal('50/30/20 Budget Rule', html);
}

// ===== SAVINGS RATE CALCULATOR =====
function showSavingsRate() {
  const totalIncome = calculateTotal('income', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  const totalExpenses = calculateTotal('expenses', 'actual') + calculateTotal('bills', 'actual');
  
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
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0;">💡 How to Improve</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Aim for 20% savings rate as a minimum</li>
        <li style="margin-bottom: 8px;">Automate transfers to savings accounts</li>
        <li style="margin-bottom: 8px;">Review subscriptions and reduce unnecessary expenses</li>
        <li style="margin-bottom: 8px;">Increase income through side hustles or career growth</li>
      </ul>
    </div>
  `;
  
  showModal('Savings Rate Calculator', html);
}

// ===== DATA BACKUP & RESTORE =====
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

// ===== TOAST NOTIFICATIONS =====
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

// ===== USER AVATAR =====
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

// ===== USER MENU DROPDOWN FUNCTIONS =====
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

// ===== BUDGET GOALS =====
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
              <p style="margin: 0; color: #666; font-size: 14px;">${currency}${goal.current.toLocaleString()} of ${currency}${goal.target.toLocaleString()}</p>
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
          <span style="font-size: 14px; color: #666;">${currency}${goal.current.toLocaleString()} / ${currency}${goal.target.toLocaleString()}</span>
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

// ===== SPENDING TRENDS CHART =====
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

// ===== EXPORT TO PDF =====
function exportToPDF() {
  showToast('Generating PDF...', 'info');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Budget Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`User: ${currentUser.email}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
    doc.text(`Period: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}`, 20, 49);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Financial Summary', 20, 60);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const totalIncome = calculateTotal('income', 'actual');
    const totalExpenses = calculateTotal('expenses', 'actual');
    const totalBills = calculateTotal('bills', 'actual');
    const totalSavings = calculateTotal('savings', 'actual');
    const totalDebt = calculateTotal('debt', 'actual');
    const balance = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
    
    let yPos = 70;
    doc.text(`Income: ${formatCurrency(totalIncome)}`, 20, yPos);
    yPos += 7;
    doc.text(`Expenses: ${formatCurrency(totalExpenses)}`, 20, yPos);
    yPos += 7;
    doc.text(`Bills: ${formatCurrency(totalBills)}`, 20, yPos);
    yPos += 7;
    doc.text(`Savings: ${formatCurrency(totalSavings)}`, 20, yPos);
    yPos += 7;
    doc.text(`Debt: ${formatCurrency(totalDebt)}`, 20, yPos);
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Balance: ${formatCurrency(balance)}`, 20, yPos);
    
    yPos += 15;
    doc.setFontSize(14);
    doc.text('Income Details', 20, yPos);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    yPos += 7;
    
    data.income.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${item.name}: ${formatCurrency(item.actual)}`, 25, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Expenses Details', 20, yPos);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    yPos += 7;
    
    data.expenses.forEach(item => {
      if (item.actual > 0) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.name}: ${formatCurrency(item.actual)}`, 25, yPos);
        yPos += 6;
      }
    });
    
    const monthName = document.getElementById('monthName').textContent;
    doc.save(`Budget_Report_${monthName}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    showToast('✅ PDF exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    showToast('❌ Failed to export PDF', 'error');
  }
}

// ===== CSV/EXCEL EXPORT =====
function exportToCSV() {
  let csv = 'Category,Item,Planned,Actual,Status\n';
  
  const categories = ['income', 'expenses', 'bills', 'savings', 'debt'];
  
  categories.forEach(category => {
    data[category].forEach(item => {
      const status = item.checked ? 'Paid' : 'Unpaid';
      csv += `${category},${item.name},${item.planned},${item.actual},${status}\n`;
    });
  });
  
  csv += `\nSummary\n`;
  csv += `Total Income,,${calculateTotal('income', 'planned')},${calculateTotal('income', 'actual')}\n`;
  csv += `Total Expenses,,${calculateTotal('expenses', 'planned')},${calculateTotal('expenses', 'actual')}\n`;
  csv += `Total Bills,,${calculateTotal('bills', 'planned')},${calculateTotal('bills', 'actual')}\n`;
  csv += `Total Savings,,${calculateTotal('savings', 'planned')},${calculateTotal('savings', 'actual')}\n`;
  csv += `Total Debt,,${calculateTotal('debt', 'planned')},${calculateTotal('debt', 'actual')}\n`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Budget_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showToast('✅ CSV exported successfully!', 'success');
}

// ===== USER MANAGEMENT =====
function getUsers() {
  const users = localStorage.getItem('budget_users');
  return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
  localStorage.setItem('budget_users', JSON.stringify(users));
}

// ✅ FIXED: Changed from sessionStorage to localStorage
function checkAuth() {
  const loggedInUser = localStorage.getItem('currentUser');
  
  if (loggedInUser) {
    currentUser = JSON.parse(loggedInUser);
    showDashboard();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('mainDashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainDashboard').style.display = 'block';
  document.getElementById('userEmailDisplay').textContent = currentUser.email;
  
  createUserAvatar(currentUser.email);
  updateMobileAvatar();
  loadDarkMode();
  loadMonthData();
  initializeCategories();
  updateMonth();
  updateAll();
  updateTrendsChart();
  updateGoalsDisplay();
  update503020Display();
  updateSavingsRateDisplay();
  updateBudgetComparisonChart();
  
  showMobileSection('dashboard');
}

document.addEventListener('DOMContentLoaded', function() {
  const authForm = document.getElementById('authForm');
  const toggleAuth = document.getElementById('toggleAuth');
  let isLoginMode = true;

  if (authForm) {
    authForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('authSubmitBtn');
      
      hideMessages();

      if (!email || !password) {
        showError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = isLoginMode ? 'Logging in...' : 'Signing up...';

      setTimeout(() => {
        try {
          const users = getUsers();

          if (isLoginMode) {
            if (!users[email]) {
              showError('Account not found. Please sign up first.');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Login';
              return;
            }

            if (users[email].password !== password) {
              showError('Incorrect password');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Login';
              return;
            }

            currentUser = { email: email };
            // ✅ FIXED: Changed from sessionStorage to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
            showToast(`Welcome back, ${email}! 👋`, 'success');

          } else {
            if (users[email]) {
              showError('Account already exists. Please login instead.');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Sign Up';
              return;
            }

            users[email] = {
              password: password,
              createdAt: new Date().toISOString()
            };
            saveUsers(users);

            showSuccess('Account created successfully! You can now login.');
            
            setTimeout(() => {
              toggleAuthMode();
              document.getElementById('password').value = '';
            }, 1500);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
          }
        } catch (error) {
          showError('An error occurred. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = isLoginMode ? 'Login' : 'Sign Up';
        }
      }, 500);
    });
  }

  if (toggleAuth) {
    toggleAuth.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthMode();
    });
  }

  function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('toggleText');
    const toggleAuthLink = document.getElementById('toggleAuth');
    
    if (isLoginMode) {
      authTitle.textContent = 'Login';
      authSubmitBtn.textContent = 'Login';
      toggleText.textContent = "Don't have an account?";
      toggleAuthLink.textContent = 'Sign Up';
    } else {
      authTitle.textContent = 'Sign Up';
      authSubmitBtn.textContent = 'Sign Up';
      toggleText.textContent = 'Already have an account?';
      toggleAuthLink.textContent = 'Login';
    }
    
    hideMessages();
  }

  checkAuth();
});

// ✅ FIXED: Changed from sessionStorage to localStorage
function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showAuthScreen();
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  showToast('Logged out successfully', 'info');
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  document.getElementById('successMessage').style.display = 'none';
}

function showSuccess(message) {
  const successEl = document.getElementById('successMessage');
  successEl.textContent = message;
  successEl.style.display = 'block';
  document.getElementById('errorMessage').style.display = 'none';
}

function hideMessages() {
  document.getElementById('errorMessage').style.display = 'none';
  document.getElementById('successMessage').style.display = 'none';
}

// ===== DATA MANAGEMENT =====
function getUserStorageKey(key) {
  return `user_${currentUser.email}_${key}`;
}

function getCurrentMonthKey() {
  const startDate = document.getElementById('startDate');
  if (startDate && startDate.value) {
    const date = new Date(startDate.value);
    currentMonth = date.getMonth();
    currentYear = date.getFullYear();
    return `budget_${currentYear}_${currentMonth}`;
  }
  return 'budget_current';
}

function loadMonthData() {
  if (!currentUser) return getDefaultData();
  
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  const savedData = localStorage.getItem(storageKey);
  
  if (savedData) {
    data = JSON.parse(savedData);
  } else {
    data = getDefaultData();
  }
}

function getDefaultData() {
  return {
    income: [
      { name: 'Realtor income', planned: 10600, actual: 10600 }
    ],
    bills: [
      { name: 'Apartment', planned: 2300, actual: 2300, checked: true },
      { name: 'Internet', planned: 85, actual: 85, checked: true },
      { name: 'Electricity', planned: 190, actual: 190, checked: true },
      { name: 'Water', planned: 50, actual: 50, checked: true },
      { name: 'Netflix', planned: 18.5, actual: 18.5, checked: true },
      { name: 'Gym membership', planned: 45, actual: 45, checked: true },
      { name: 'Car insurance', planned: 140, actual: 140, checked: true }
    ],
    expenses: [
      { name: 'Scooty', planned: 0, actual: 0, checked: false },
      { name: 'Fuel', planned: 0, actual: 0, checked: false },
      { name: 'Rent', planned: 0, actual: 0, checked: false },
      { name: 'Electricity & Maintenance', planned: 0, actual: 0, checked: false },
      { name: 'Groceries and Dmart', planned: 0, actual: 0, checked: false },
      { name: 'Entertainment (Movies)', planned: 0, actual: 0, checked: false },
      { name: 'Miscellaneous', planned: 0, actual: 0, checked: false },
      { name: 'Swiggy/Zomato', planned: 0, actual: 0, checked: false },
      { name: 'Personal care', planned: 0, actual: 0, checked: false },
      { name: 'Breakfast', planned: 0, actual: 0, checked: false },
      { name: 'Wifi', planned: 0, actual: 0, checked: false },
      { name: 'Mobile Recharge', planned: 0, actual: 0, checked: false },
      { name: 'Netflix, Amazon', planned: 0, actual: 0, checked: false }
    ],
    savings: [
      { name: 'Retirement account', planned: 600, actual: 600, checked: true },
      { name: 'Emergencies', planned: 800, actual: 800, checked: true },
      { name: 'Vacation to the US', planned: 350, actual: 350, checked: true },
      { name: 'Savings account', planned: 2820, actual: 2820, checked: true }
    ],
    debt: [
      { name: 'Car lease', planned: 420, actual: 420, checked: true },
      { name: 'Credit card', planned: 315, actual: 315, checked: true },
      { name: 'Business loan', planned: 120, actual: 120, checked: true }
    ]
  };
}

function saveData() {
  if (!currentUser) return;
  
  const monthKey = getCurrentMonthKey();
  const storageKey = getUserStorageKey(monthKey);
  localStorage.setItem(storageKey, JSON.stringify(data));
  
  const monthsListKey = getUserStorageKey('savedMonthsList');
  let savedMonths = localStorage.getItem(monthsListKey);
  savedMonths = savedMonths ? JSON.parse(savedMonths) : [];
  
  if (!savedMonths.includes(monthKey)) {
    savedMonths.push(monthKey);
    localStorage.setItem(monthsListKey, JSON.stringify(savedMonths));
  }
  
  localStorage.setItem(getUserStorageKey('currency'), currency);
}

function getSavedMonths() {
  if (!currentUser) return [];
  
  const monthsListKey = getUserStorageKey('savedMonthsList');
  const saved = localStorage.getItem(monthsListKey);
  return saved ? JSON.parse(saved) : [];
}

function viewPreviousMonths() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    showToast('No saved months yet!', 'info');
    return;
  }
  
  let html = '<div style="max-height: 500px; overflow-y: auto;">';
  html += '<h2 style="margin-bottom: 20px;">Saved Monthly Reports</h2>';
  
  savedMonths.sort().reverse().forEach(monthKey => {
    const parts = monthKey.split('_');
    const year = parts[1];
    const month = parts[2];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)];
    
    const storageKey = getUserStorageKey(monthKey);
    const monthData = JSON.parse(localStorage.getItem(storageKey));
    
    if (!monthData) return;
    
    const totalIncome = monthData.income.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalExpenses = monthData.expenses.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalBills = monthData.bills.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalSavings = monthData.savings.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalDebt = monthData.debt.reduce((sum, item) => sum + (item.actual || 0), 0);
    const balance = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
    
    html += `
      <div style="background: #f8f5ff; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
        <h3 style="margin-bottom: 10px;">${monthName} ${year}</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
          <div><strong>Income:</strong> ${currency}${totalIncome.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div><strong>Expenses:</strong> ${currency}${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div><strong>Bills:</strong> ${currency}${totalBills.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div><strong>Savings:</strong> ${currency}${totalSavings.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div><strong>Debt:</strong> ${currency}${totalDebt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div><strong>Balance:</strong> <span style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${currency}${balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
        </div>
        <div style="margin-top: 10px;">
          <button onclick="loadMonth('${monthKey}')" style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Load This Month</button>
          <button onclick="deleteMonth('${monthKey}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  showModal('Previous Months', html);
}

function viewYearlySummary() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    showToast('No saved months yet!', 'info');
    return;
  }
  
  const yearData = {};
  
  savedMonths.forEach(monthKey => {
    const parts = monthKey.split('_');
    const year = parts[1];
    
    if (!yearData[year]) {
      yearData[year] = {
        income: 0,
        expenses: 0,
        bills: 0,
        savings: 0,
        debt: 0,
        months: []
      };
    }
    
    const storageKey = getUserStorageKey(monthKey);
    const monthData = JSON.parse(localStorage.getItem(storageKey));
    
    if (!monthData) return;
    
    yearData[year].income += monthData.income.reduce((sum, item) => sum + (item.actual || 0), 0);
    yearData[year].expenses += monthData.expenses.reduce((sum, item) => sum + (item.actual || 0), 0);
    yearData[year].bills += monthData.bills.reduce((sum, item) => sum + (item.actual || 0), 0);
    yearData[year].savings += monthData.savings.reduce((sum, item) => sum + (item.actual || 0), 0);
    yearData[year].debt += monthData.debt.reduce((sum, item) => sum + (item.actual || 0), 0);
    yearData[year].months.push(monthKey);
  });
  
  let html = '<div style="max-height: 500px; overflow-y: auto;">';
  html += '<h2 style="margin-bottom: 20px;">Yearly Summary</h2>';
  
  Object.keys(yearData).sort().reverse().forEach(year => {
    const yearInfo = yearData[year];
    const balance = yearInfo.income - yearInfo.expenses - yearInfo.bills - yearInfo.savings - yearInfo.debt;
    
    html += `
      <div style="background: #f8f5ff; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 2px solid #8b5cf6;">
        <h2 style="margin-bottom: 15px; color: #8b5cf6;">${year} Summary (${yearInfo.months.length} months)</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Total Income</div>
            <div style="font-size: 20px; font-weight: bold; color: #10b981;">${currency}${yearInfo.income.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Total Expenses</div>
            <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${currency}${yearInfo.expenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Total Bills</div>
            <div style="font-size: 20px; font-weight: bold; color: #f97316;">${currency}${yearInfo.bills.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Total Savings</div>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${currency}${yearInfo.savings.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Total Debt</div>
            <div style="font-size: 20px; font-weight: bold; color: #ec4899;">${currency}${yearInfo.debt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 6px;">
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">Net Balance</div>
            <div style="font-size: 20px; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">${currency}${balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  showModal('Yearly Summary', html);
}

function loadMonth(monthKey) {
  const parts = monthKey.split('_');
  const year = parts[1];
  const month = parts[2];
  
  closeModal();
  
  setTimeout(() => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!startDateInput || !endDateInput) {
      showToast('Error loading month', 'error');
      return;
    }
    
    const newDate = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`;
    startDateInput.value = newDate;
    
    const endDateObj = new Date(year, parseInt(month) + 1, 0);
    endDateInput.value = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${endDateObj.getDate()}`;
    
    const storageKey = getUserStorageKey(monthKey);
    const monthData = localStorage.getItem(storageKey);
    
    if (monthData) {
      const parsedData = JSON.parse(monthData);
      data.income = parsedData.income || [];
      data.bills = parsedData.bills || [];
      data.expenses = parsedData.expenses || [];
      data.savings = parsedData.savings || [];
      data.debt = parsedData.debt || [];
      
      updateMonth();
      updateAll();
      
      showToast('Month loaded successfully!', 'success');
    } else {
      showToast('Error: Month data not found', 'error');
    }
  }, 100);
}

function deleteMonth(monthKey) {
  if (!confirm('Are you sure you want to delete this month? This cannot be undone!')) {
    return;
  }
  
  const storageKey = getUserStorageKey(monthKey);
  localStorage.removeItem(storageKey);
  
  const monthsListKey = getUserStorageKey('savedMonthsList');
  const savedMonths = getSavedMonths();
  const index = savedMonths.indexOf(monthKey);
  
  if (index > -1) {
    savedMonths.splice(index, 1);
    localStorage.setItem(monthsListKey, JSON.stringify(savedMonths));
  }
  
  showToast('Month deleted', 'success');
  viewPreviousMonths();
}

function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL your budget data? This cannot be undone!')) {
    return;
  }
  
  const savedMonths = getSavedMonths();
  savedMonths.forEach(monthKey => {
    const storageKey = getUserStorageKey(monthKey);
    localStorage.removeItem(storageKey);
  });
  
  localStorage.removeItem(getUserStorageKey('savedMonthsList'));
  localStorage.removeItem(getUserStorageKey('currency'));
  localStorage.removeItem(getUserStorageKey('goals'));
  localStorage.removeItem(getUserStorageKey('recurring'));
  
  showToast('All data cleared! Refreshing...', 'info');
  setTimeout(() => location.reload(), 1500);
}

function showModal(title, content) {
  const modal = document.createElement('div');
  modal.id = 'customModal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 12px; max-width: 900px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">${title}</h2>
        <button onclick="closeModal()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 16px;">✕ Close</button>
      </div>
      ${content}
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.remove();
  }
}

// ===== ITEM MANAGEMENT =====
function addNewItem(category) {
  const itemName = prompt('Enter new item name:');
  if (itemName && itemName.trim() !== '') {
    const newItem = {
      name: itemName.trim(),
      planned: 0,
      actual: 0,
      checked: false,
      category: getCategoryForItem(itemName.trim(), category),
      tags: []
    };
    data[category].push(newItem);
    updateAll();
    showToast(`Added: ${itemName}`, 'success');
  }
}

function editItemName(category, index) {
  const currentName = data[category][index].name;
  const newName = prompt('Edit item name:', currentName);
  if (newName && newName.trim() !== '') {
    data[category][index].name = newName.trim();
    updateAll();
    showToast('Item updated', 'success');
  }
}

function deleteItem(category, index) {
  if (confirm(`Are you sure you want to delete "${data[category][index].name}"?`)) {
    const itemName = data[category][index].name;
    data[category].splice(index, 1);
    updateAll();
    showToast(`Deleted: ${itemName}`, 'info');
  }
}

function setFilter(category, filter) {
  filterState[category] = filter;
  updateAll();
}

// ===== CALCULATION & FORMATTING =====
function formatCurrency(amount) {
  return currency + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateTotal(category, field) {
  return data[category].reduce((sum, item) => sum + (item[field] || 0), 0);
}

function updateMonth() {
  const startDateEl = document.getElementById('startDate');
  if (startDateEl && startDateEl.value) {
    const date = new Date(startDateEl.value);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthNameEl = document.getElementById('monthName');
    if (monthNameEl) {
      monthNameEl.textContent = monthNames[date.getMonth()];
    }
    
    loadMonthData();
  }
  saveData();
}

function updateAll() {
  const currencyEl = document.getElementById('currency');
  if (currencyEl) {
    currency = currencyEl.value;
  }
  
  const totalIncome = calculateTotal('income', 'actual');
  const totalExpenses = calculateTotal('expenses', 'actual');
  const totalBills = calculateTotal('bills', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  const totalDebt = calculateTotal('debt', 'actual');
  const leftAmount = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
  
  const summaryIncome = document.getElementById('summaryIncome');
  const summaryExpenses = document.getElementById('summaryExpenses');
  const summaryBills = document.getElementById('summaryBills');
  const summarySavings = document.getElementById('summarySavings');
  const summaryDebt = document.getElementById('summaryDebt');
  
  if (summaryIncome) summaryIncome.textContent = formatCurrency(totalIncome);
  if (summaryExpenses) summaryExpenses.textContent = formatCurrency(totalExpenses);
  if (summaryBills) summaryBills.textContent = formatCurrency(totalBills);
  if (summarySavings) summarySavings.textContent = formatCurrency(totalSavings);
  if (summaryDebt) summaryDebt.textContent = formatCurrency(totalDebt);
  
  // Update mobile summary cards
  const summaryIncomeMobile = document.getElementById('summaryIncomeMobile');
  const summaryExpensesMobile = document.getElementById('summaryExpensesMobile');
  const summaryBillsMobile = document.getElementById('summaryBillsMobile');
  const summarySavingsMobile = document.getElementById('summarySavingsMobile');
  const summaryDebtMobile = document.getElementById('summaryDebtMobile');
  const amountLeftMobile = document.getElementById('amountLeftMobile');
  
  if (summaryIncomeMobile) summaryIncomeMobile.textContent = formatCurrency(totalIncome);
  if (summaryExpensesMobile) summaryExpensesMobile.textContent = formatCurrency(totalExpenses);
  if (summaryBillsMobile) summaryBillsMobile.textContent = formatCurrency(totalBills);
  if (summarySavingsMobile) summarySavingsMobile.textContent = formatCurrency(totalSavings);
  if (summaryDebtMobile) summaryDebtMobile.textContent = formatCurrency(totalDebt);
  if (amountLeftMobile) amountLeftMobile.textContent = formatCurrency(leftAmount);
  
  const foIncomePlanned = document.getElementById('foIncomePlanned');
  const foIncomeActual = document.getElementById('foIncomeActual');
  const foExpensesPlanned = document.getElementById('foExpensesPlanned');
  const foExpensesActual = document.getElementById('foExpensesActual');
  const foBillsPlanned = document.getElementById('foBillsPlanned');
  const foBillsActual = document.getElementById('foBillsActual');
  const foSavingsPlanned = document.getElementById('foSavingsPlanned');
  const foSavingsActual = document.getElementById('foSavingsActual');
  const foDebtPlanned = document.getElementById('foDebtPlanned');
  const foDebtActual = document.getElementById('foDebtActual');
  const foLeftPlanned = document.getElementById('foLeftPlanned');
  const foLeftActual = document.getElementById('foLeftActual');
  const amountLeft = document.getElementById('amountLeft');
  
  if (foIncomePlanned) foIncomePlanned.textContent = formatCurrency(calculateTotal('income', 'planned'));
  if (foIncomeActual) foIncomeActual.textContent = formatCurrency(totalIncome);
  if (foExpensesPlanned) foExpensesPlanned.textContent = formatCurrency(calculateTotal('expenses', 'planned'));
  if (foExpensesActual) foExpensesActual.textContent = formatCurrency(totalExpenses);
  if (foBillsPlanned) foBillsPlanned.textContent = formatCurrency(calculateTotal('bills', 'planned'));
  if (foBillsActual) foBillsActual.textContent = formatCurrency(totalBills);
  if (foSavingsPlanned) foSavingsPlanned.textContent = formatCurrency(calculateTotal('savings', 'planned'));
  if (foSavingsActual) foSavingsActual.textContent = formatCurrency(totalSavings);
  if (foDebtPlanned) foDebtPlanned.textContent = formatCurrency(calculateTotal('debt', 'planned'));
  if (foDebtActual) foDebtActual.textContent = formatCurrency(totalDebt);
  if (foLeftPlanned) foLeftPlanned.textContent = formatCurrency(leftAmount);
  if (foLeftActual) foLeftActual.textContent = formatCurrency(leftAmount);
  if (amountLeft) amountLeft.textContent = formatCurrency(leftAmount);
  
  updateCashFlow(totalIncome, totalExpenses, totalBills, totalSavings, totalDebt);
  updatePieChart(totalIncome, totalExpenses, totalBills, totalSavings, totalDebt, leftAmount);
  renderTable('income', 'incomeTable', false);
  renderTable('bills', 'billsTable', true);
  renderTable('expenses', 'expensesTable', true);
  renderTable('savings', 'savingsTable', true);
  renderTable('debt', 'debtTable', true);
  
  updateTrendsChart();
  updateGoalsDisplay();
  update503020Display();
  updateSavingsRateDisplay();
  updateBudgetComparisonChart();
  
  saveData();
}

function updateCashFlow(totalIncome, totalExpenses, totalBills, totalSavings, totalDebt) {
  const cashFlowEl = document.getElementById('cashFlow');
  if (!cashFlowEl) return;
  
  const categories = [
    { name: 'Expenses', value: totalExpenses },
    { name: 'Bills', value: totalBills },
    { name: 'Savings', value: totalSavings },
    { name: 'Debt', value: totalDebt }
  ];
  
  let html = '';
  categories.forEach(cat => {
    const width = (cat.value / totalIncome * 100) || 0;
    html += `
      <div class="chart-item">
        <div class="chart-label">
          <span>${cat.name}</span>
          <span>${formatCurrency(cat.value)}</span>
        </div>
        <div class="chart-bars">
          <div class="chart-bar planned" style="width: ${width}%"></div>
          <div class="chart-bar actual" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  });
  cashFlowEl.innerHTML = html;
}

function updatePieChart(totalIncome, totalExpenses, totalBills, totalSavings, totalDebt, leftAmount) {
  const pieChartContainer = document.getElementById('pieChart');
  const pieChartMobileContainer = document.getElementById('pieChartMobile');
  
  const categories = [
    { name: 'Expenses', value: totalExpenses, color: '#f87171' },
    { name: 'Bills', value: totalBills, color: '#fb923c' },
    { name: 'Savings', value: totalSavings, color: '#34d399' },
    { name: 'Debt', value: totalDebt, color: '#f472b6' },
    { name: 'Balance', value: Math.max(0, leftAmount), color: '#60a5fa' }
  ];
  
  const total = categories.reduce((sum, cat) => sum + cat.value, 0);
  
  const generatePieChartHTML = () => {
    if (total === 0) {
      return '<div style="text-align: center; padding: 40px; color: #999;">No data to display</div>';
    }
    
    let currentAngle = 0;
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    let svgPaths = '';
    let legends = '';
    
    categories.forEach((cat) => {
      const percentage = (cat.value / total) * 100;
      if (percentage > 0) {
        const sliceAngle = (cat.value / total) * 360;
        const endAngle = currentAngle + sliceAngle;
        
        const startX = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
        const startY = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
        const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
        const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
        
        const largeArc = sliceAngle > 180 ? 1 : 0;
        
        svgPaths += `
          <path d="M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z"
            fill="${cat.color}" stroke="white" stroke-width="2" style="transition: all 0.3s;">
            <title>${cat.name}: ${formatCurrency(cat.value)} (${percentage.toFixed(1)}%)</title>
          </path>
        `;
        
        legends += `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 16px; height: 16px; background: ${cat.color}; border-radius: 3px;"></div>
            <div style="flex: 1; font-size: 12px;">
              <div style="font-weight: 600;">${cat.name}</div>
              <div style="color: #666;">${formatCurrency(cat.value)} (${percentage.toFixed(1)}%)</div>
            </div>
          </div>
        `;
        
        currentAngle = endAngle;
      }
    });
    
    return `
      <div style="display: flex; gap: 30px; align-items: center; justify-content: center;">
        <svg width="200" height="200" viewBox="0 0 200 200">
          ${svgPaths}
        </svg>
        <div style="flex: 1;">
          ${legends}
        </div>
      </div>
    `;
  };
  
  const chartHTML = generatePieChartHTML();
  
  if (pieChartContainer) {
    pieChartContainer.innerHTML = chartHTML;
  }
  
  if (pieChartMobileContainer) {
    pieChartMobileContainer.innerHTML = chartHTML;
  }
}

function renderTable(category, tableId, hasProgress) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;
  
  let items = data[category];
  
  if (hasProgress && filterState[category]) {
    if (filterState[category] === 'checked') {
      items = items.filter(item => item.checked);
    } else if (filterState[category] === 'unchecked') {
      items = items.filter(item => !item.checked);
    }
  }
  
  let html = items.map((item) => {
    const idx = data[category].indexOf(item);
    const progress = item.planned > 0 ? ((item.actual / item.planned) * 100).toFixed(2) + '%' : '100.00%';
    const checkbox = hasProgress ? `
      <div class="item-row">
        <input type="checkbox" ${item.checked ? 'checked' : ''} 
          onchange="data.${category}[${idx}].checked = this.checked; updateAll()">
        <span ondblclick="editItemName('${category}', ${idx})" style="cursor: pointer;" title="Double-click to edit">${item.name}</span>
        <button onclick="deleteItem('${category}', ${idx})" style="margin-left: 5px; background: #ef4444; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 10px;" title="Delete">×</button>
      </div>
    ` : `
      <div style="display: flex; align-items: center; gap: 5px;">
        <span ondblclick="editItemName('${category}', ${idx})" style="cursor: pointer; flex: 1;" title="Double-click to edit">${item.name}</span>
        <button onclick="deleteItem('${category}', ${idx})" style="background: #ef4444; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 10px;" title="Delete">×</button>
      </div>
    `;
    
    return `
      <tr>
        <td>${checkbox}</td>
        <td><input type="number" value="${item.planned}" 
          onchange="data.${category}[${idx}].planned = parseFloat(this.value) || 0; updateAll()"></td>
        <td><input type="number" value="${item.actual}" 
          onchange="data.${category}[${idx}].actual = parseFloat(this.value) || 0; updateAll()"></td>
        ${hasProgress ? `<td>${progress}</td>` : ''}
      </tr>
    `;
  }).join('');
  
  const totalPlanned = calculateTotal(category, 'planned');
  const totalActual = calculateTotal(category, 'actual');
  const totalProgress = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(2) + '%' : '100.00%';
  
  let filterButtons = '';
  if (hasProgress) {
    filterButtons = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 10px;">
          <button onclick="addNewItem('${category}')" style="margin: 0 10px 0 0; padding: 5px 15px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;" title="Add new item">+ Add New</button>
          <button onclick="setFilter('${category}', 'all')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'all' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'all' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">All</button>
          <button onclick="setFilter('${category}', 'checked')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'checked' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'checked' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Paid</button>
          <button onclick="setFilter('${category}', 'unchecked')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'unchecked' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'unchecked' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Unpaid</button>
        </td>
      </tr>
    `;
  } else {
    filterButtons = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 10px;">
          <button onclick="addNewItem('${category}')" style="padding: 5px 15px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;" title="Add new item">+ Add New</button>
        </td>
      </tr>
    `;
  }
  
  html = filterButtons + html + `
    <tr class="total-row">
      <td>TOTAL</td>
      <td>${formatCurrency(totalPlanned)}</td>
      <td>${formatCurrency(totalActual)}</td>
      ${hasProgress ? `<td>${totalProgress}</td>` : ''}
    </tr>
  `;
  
  tbody.innerHTML = html;
}
