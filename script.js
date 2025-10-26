let currency = '₹';
let currentMonth = '';
let currentYear = '';

// Get current month and year from date picker
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

// Load data for current month
function loadMonthData() {
  const monthKey = getCurrentMonthKey();
  const savedData = localStorage.getItem(monthKey);
  return savedData ? JSON.parse(savedData) : getDefaultData();
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

let data = getDefaultData();

// Load saved currency and dates
const savedCurrency = localStorage.getItem('budgetCurrency');
if (savedCurrency) currency = savedCurrency;

const savedStartDate = localStorage.getItem('budgetStartDate');
const savedEndDate = localStorage.getItem('budgetEndDate');

// Filter state
let filterState = {
  expenses: 'all',
  bills: 'all',
  savings: 'all',
  debt: 'all'
};

// Save data to browser storage for current month
function saveData() {
  const monthKey = getCurrentMonthKey();
  localStorage.setItem(monthKey, JSON.stringify(data));
  localStorage.setItem('budgetCurrency', currency);
  
  const startDateEl = document.getElementById('startDate');
  const endDateEl = document.getElementById('endDate');
  
  if (startDateEl) localStorage.setItem('budgetStartDate', startDateEl.value);
  if (endDateEl) localStorage.setItem('budgetEndDate', endDateEl.value);
  
  // Add to saved months list
  const savedMonths = getSavedMonths();
  if (!savedMonths.includes(monthKey)) {
    savedMonths.push(monthKey);
    localStorage.setItem('savedMonthsList', JSON.stringify(savedMonths));
  }
  
  // Show save confirmation
  const saveIndicator = document.getElementById('saveIndicator');
  if (saveIndicator) {
    saveIndicator.style.display = 'block';
    setTimeout(() => {
      saveIndicator.style.display = 'none';
    }, 1000);
  }
}

// Get list of all saved months
function getSavedMonths() {
  const saved = localStorage.getItem('savedMonthsList');
  return saved ? JSON.parse(saved) : [];
}

// View previous months
function viewPreviousMonths() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    alert('No saved months yet! Save your current month first by entering data and changing the date.');
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
    
    const monthData = JSON.parse(localStorage.getItem(monthKey));
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

// View yearly summary
function viewYearlySummary() {
  const savedMonths = getSavedMonths();
  
  if (savedMonths.length === 0) {
    alert('No saved months yet! Save some months first to see yearly summary.');
    return;
  }
  
  // Group by year
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
    
    const monthData = JSON.parse(localStorage.getItem(monthKey));
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

// Load a specific month
function loadMonth(monthKey) {
  const parts = monthKey.split('_');
  const year = parts[1];
  const month = parts[2];
  
  // Close modal first
  closeModal();
  
  // Wait for modal to close
  setTimeout(() => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!startDateInput || !endDateInput) {
      alert('Error: Could not find date inputs. Please refresh the page.');
      return;
    }
    
    // Update date picker
    const newDate = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`;
    startDateInput.value = newDate;
    
    // Calculate end date
    const endDateObj = new Date(year, parseInt(month) + 1, 0);
    endDateInput.value = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${endDateObj.getDate()}`;
    
    // Load data for this month
    const monthData = localStorage.getItem(monthKey);
    if (monthData) {
      const parsedData = JSON.parse(monthData);
      
      // Update data object
      data.income = parsedData.income || [];
      data.bills = parsedData.bills || [];
      data.expenses = parsedData.expenses || [];
      data.savings = parsedData.savings || [];
      data.debt = parsedData.debt || [];
      
      // Update displays
      updateMonth();
      updateAll();
      
      alert('Month loaded successfully!');
    } else {
      alert('Error: Month data not found.');
    }
  }, 100);
}

// Delete a month
function deleteMonth(monthKey) {
  if (confirm('Are you sure you want to delete this month? This cannot be undone!')) {
    localStorage.removeItem(monthKey);
    
    // Remove from saved months list
    const savedMonths = getSavedMonths();
    const index = savedMonths.indexOf(monthKey);
    if (index > -1) {
      savedMonths.splice(index, 1);
      localStorage.setItem('savedMonthsList', JSON.stringify(savedMonths));
    }
    
    viewPreviousMonths(); // Refresh the view
  }
}

// Show modal
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

// Close modal
function closeModal() {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.remove();
  }
}

// Clear all saved data
function clearAllData() {
  if (confirm('Are you sure you want to clear ALL data including all saved months? This cannot be undone!')) {
    const savedMonths = getSavedMonths();
    savedMonths.forEach(monthKey => {
      localStorage.removeItem(monthKey);
    });
    
    localStorage.removeItem('savedMonthsList');
    localStorage.removeItem('budgetCurrency');
    localStorage.removeItem('budgetStartDate');
    localStorage.removeItem('budgetEndDate');
    alert('All data cleared! Refreshing page...');
    location.reload();
  }
}

// Add new item
function addNewItem(category) {
  const itemName = prompt('Enter new item name:');
  if (itemName && itemName.trim() !== '') {
    const newItem = {
      name: itemName.trim(),
      planned: 0,
      actual: 0,
      checked: false
    };
    data[category].push(newItem);
    updateAll();
  }
}

// Edit item name
function editItemName(category, index) {
  const currentName = data[category][index].name;
  const newName = prompt('Edit item name:', currentName);
  if (newName && newName.trim() !== '') {
    data[category][index].name = newName.trim();
    updateAll();
  }
}

// Delete item
function deleteItem(category, index) {
  if (confirm(`Are you sure you want to delete "${data[category][index].name}"?`)) {
    data[category].splice(index, 1);
    updateAll();
  }
}

// Set filter for a category
function setFilter(category, filter) {
  filterState[category] = filter;
  updateAll();
}

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
    
    // Load data for this month if it exists
    const monthKey = getCurrentMonthKey();
    const existingData = localStorage.getItem(monthKey);
    if (existingData) {
      const monthData = JSON.parse(existingData);
      data.income = monthData.income || data.income;
      data.bills = monthData.bills || data.bills;
      data.expenses = monthData.expenses || data.expenses;
      data.savings = monthData.savings || data.savings;
      data.debt = monthData.debt || data.debt;
    }
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
  
  // Update summary cards
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
  
  // Update financial overview
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
  if (!pieChartContainer) return;
  
  const categories = [
    { name: 'Expenses', value: totalExpenses, color: '#f87171' },
    { name: 'Bills', value: totalBills, color: '#fb923c' },
    { name: 'Savings', value: totalSavings, color: '#34d399' },
    { name: 'Debt', value: totalDebt, color: '#f472b6' },
    { name: 'Balance', value: Math.max(0, leftAmount), color: '#60a5fa' }
  ];
  
  const total = categories.reduce((sum, cat) => sum + cat.value, 0);
  
  if (total === 0) {
    pieChartContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No data to display</div>';
    return;
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
          fill="${cat.color}" stroke="white" stroke-width="2">
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
  
  pieChartContainer.innerHTML = `
    <div style="display: flex; gap: 30px; align-items: center; justify-content: center;">
      <svg width="200" height="200" viewBox="0 0 200 200">
        ${svgPaths}
      </svg>
      <div style="flex: 1;">
        ${legends}
      </div>
    </div>
  `;
}

function renderTable(category, tableId, hasProgress) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;
  
  let items = data[category];
  
  // Apply filter
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Load month data
  data = loadMonthData();
  
  // Load saved dates on startup
  const startDateEl = document.getElementById('startDate');
  const endDateEl = document.getElementById('endDate');
  const currencyEl = document.getElementById('currency');
  
  if (savedStartDate && startDateEl) startDateEl.value = savedStartDate;
  if (savedEndDate && endDateEl) endDateEl.value = savedEndDate;
  if (savedCurrency && currencyEl) currencyEl.value = savedCurrency;
  
  // Initialize
  updateMonth();
  updateAll();
});