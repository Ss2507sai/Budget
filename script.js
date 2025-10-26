let currency = '₹';

// Load saved data from browser storage or use defaults
const savedData = localStorage.getItem('budgetData');
const data = savedData ? JSON.parse(savedData) : {
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

// Save data to browser storage
function saveData() {
  localStorage.setItem('budgetData', JSON.stringify(data));
  localStorage.setItem('budgetCurrency', currency);
  localStorage.setItem('budgetStartDate', document.getElementById('startDate').value);
  localStorage.setItem('budgetEndDate', document.getElementById('endDate').value);
  
  // Show save confirmation
  const saveIndicator = document.getElementById('saveIndicator');
  if (saveIndicator) {
    saveIndicator.style.display = 'block';
    setTimeout(() => {
      saveIndicator.style.display = 'none';
    }, 1000);
  }
}

// Clear all saved data
function clearAllData() {
  if (confirm('Are you sure you want to clear all saved data? This cannot be undone!')) {
    localStorage.removeItem('budgetData');
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
  const startDate = document.getElementById('startDate').value;
  if (startDate) {
    const date = new Date(startDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    document.getElementById('monthName').textContent = monthNames[date.getMonth()];
  }
  saveData();
}

function updateAll() {
  currency = document.getElementById('currency').value;
  
  const totalIncome = calculateTotal('income', 'actual');
  const totalExpenses = calculateTotal('expenses', 'actual');
  const totalBills = calculateTotal('bills', 'actual');
  const totalSavings = calculateTotal('savings', 'actual');
  const totalDebt = calculateTotal('debt', 'actual');
  const leftAmount = totalIncome - totalExpenses - totalBills - totalSavings - totalDebt;
  
  document.getElementById('summaryIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('summaryExpenses').textContent = formatCurrency(totalExpenses);
  document.getElementById('summaryBills').textContent = formatCurrency(totalBills);
  document.getElementById('summarySavings').textContent = formatCurrency(totalSavings);
  document.getElementById('summaryDebt').textContent = formatCurrency(totalDebt);
  
  document.getElementById('foIncomePlanned').textContent = formatCurrency(calculateTotal('income', 'planned'));
  document.getElementById('foIncomeActual').textContent = formatCurrency(totalIncome);
  document.getElementById('foExpensesPlanned').textContent = formatCurrency(calculateTotal('expenses', 'planned'));
  document.getElementById('foExpensesActual').textContent = formatCurrency(totalExpenses);
  document.getElementById('foBillsPlanned').textContent = formatCurrency(calculateTotal('bills', 'planned'));
  document.getElementById('foBillsActual').textContent = formatCurrency(totalBills);
  document.getElementById('foSavingsPlanned').textContent = formatCurrency(calculateTotal('savings', 'planned'));
  document.getElementById('foSavingsActual').textContent = formatCurrency(totalSavings);
  document.getElementById('foDebtPlanned').textContent = formatCurrency(calculateTotal('debt', 'planned'));
  document.getElementById('foDebtActual').textContent = formatCurrency(totalDebt);
  document.getElementById('foLeftPlanned').textContent = formatCurrency(leftAmount);
  document.getElementById('foLeftActual').textContent = formatCurrency(leftAmount);
  document.getElementById('amountLeft').textContent = formatCurrency(leftAmount);
  
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
  document.getElementById('cashFlow').innerHTML = html;
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
  
  categories.forEach((cat, index) => {
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
  let items = data[category];
  
  // Apply filter
  if (hasProgress && filterState[category]) {
    if (filterState[category] === 'checked') {
      items = items.filter(item => item.checked);
    } else if (filterState[category] === 'unchecked') {
      items = items.filter(item => !item.checked);
    }
  }
  
  let html = items.map((item, originalIdx) => {
    // Find original index
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
  
  // Add filter buttons and + button for categories with progress
  let filterButtons = '';
  if (hasProgress) {
    filterButtons = `
      <tr>
        <td colspan="${hasProgress ? 4 : 3}" style="text-align: center; padding: 10px;">
          <button onclick="addNewItem('${category}')" style="margin: 0 10px 0 0; padding: 5px 15px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;" title="Add new item">+ Add New</button>
          <button onclick="setFilter('${category}', 'all')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'all' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'all' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">All</button>
          <button onclick="setFilter('${category}', 'checked')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'checked' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'checked' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Paid</button>
          <button onclick="setFilter('${category}', 'unchecked')" style="margin: 0 5px; padding: 5px 10px; background: ${filterState[category] === 'unchecked' ? '#8b5cf6' : '#e9d5ff'}; color: ${filterState[category] === 'unchecked' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Unpaid</button>
        </td>
      </tr>
    `;
  } else {
    // For income (no progress column)
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

// Load saved dates on startup
if (savedStartDate) document.getElementById('startDate').value = savedStartDate;
if (savedEndDate) document.getElementById('endDate').value = savedEndDate;
if (savedCurrency) document.getElementById('currency').value = savedCurrency;

// Initialize
updateAll();
updateMonth();