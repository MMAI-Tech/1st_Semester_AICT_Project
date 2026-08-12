// Simple Expense Tracker
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let categoryChart = null;
let monthlyChart = null;
let reportChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('current-date').textContent = dateStr;
    document.getElementById('date').valueAsDate = now;
    
    // Add sample data if empty
    if (expenses.length === 0) {
        addSampleData();
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load dashboard
    loadDashboard();
});

function setupNavigation() {
    // Get all nav items
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Get page to show
            const pageId = this.getAttribute('data-page');
            
            // Update page title
            const pageTitle = this.querySelector('span').textContent;
            document.getElementById('page-title').textContent = pageTitle;
            
            // Show page
            showPage(pageId);
        });
    });
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const pageElement = document.getElementById(pageId + '-page');
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Load page data
        if (pageId === 'dashboard') {
            loadDashboard();
        } else if (pageId === 'reports') {
            loadReports();
        } else if (pageId === 'all-expenses') {
            loadAllExpenses();
        }
    }
}

function setupEventListeners() {
    // Add expense form
    document.getElementById('expense-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addExpense();
    });
    
    // Clear form
    document.getElementById('clear-form').addEventListener('click', function() {
        document.getElementById('expense-form').reset();
    });
    
    // Generate report
    document.getElementById('generate-report').addEventListener('click', function() {
        generateReport();
    });
    
    // Delete all expenses
    document.getElementById('delete-all').addEventListener('click', function() {
        if (confirm('Delete ALL expenses?')) {
            expenses = [];
            saveToLocal();
            loadDashboard();
            loadAllExpenses();
            alert('All expenses deleted!');
        }
    });
    
    // Search expenses
    document.getElementById('search-expense').addEventListener('input', function(e) {
        searchExpenses(e.target.value);
    });
    
    // Edit modal close
    document.getElementById('close-edit').addEventListener('click', function() {
        document.getElementById('editModal').style.display = 'none';
    });
    
    // Edit form
    document.getElementById('edit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateExpense();
    });
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('editModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function addExpense() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    if (!amount || !category || !date) {
        alert('Please fill all fields!');
        return;
    }
    
    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        date: date,
        description: description
    };
    
    expenses.push(expense);
    saveToLocal();
    
    // Reset form
    document.getElementById('expense-form').reset();
    
    // Show success
    alert('Expense added!');
    
    // Go to dashboard
    showPage('dashboard');
}

function editExpense(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;
    
    // Fill edit form
    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-date').value = expense.date;
    document.getElementById('edit-description').value = expense.description;
    
    // Fill category dropdown
    const select = document.getElementById('edit-category');
    select.innerHTML = '';
    
    const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Education', 'Healthcare', 'Other'];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === expense.category) option.selected = true;
        select.appendChild(option);
    });
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
}

function updateExpense() {
    const id = parseInt(document.getElementById('edit-id').value);
    const index = expenses.findIndex(exp => exp.id === id);
    
    if (index !== -1) {
        expenses[index] = {
            id: id,
            amount: parseFloat(document.getElementById('edit-amount').value),
            category: document.getElementById('edit-category').value,
            date: document.getElementById('edit-date').value,
            description: document.getElementById('edit-description').value
        };
        
        saveToLocal();
        
        // Hide modal
        document.getElementById('editModal').style.display = 'none';
        
        // Reload data
        loadDashboard();
        loadAllExpenses();
        
        alert('Expense updated!');
    }
}

function deleteExpense(id) {
    if (confirm('Delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveToLocal();
        
        // Reload
        loadDashboard();
        loadAllExpenses();
        
        alert('Expense deleted!');
    }
}

function loadDashboard() {
    // Calculate totals
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // This month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const monthly = expenses
        .filter(exp => {
            const d = new Date(exp.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Top category
    const cats = {};
    expenses.forEach(exp => {
        cats[exp.category] = (cats[exp.category] || 0) + exp.amount;
    });
    
    let topCat = '-';
    let max = 0;
    for (const [cat, amt] of Object.entries(cats)) {
        if (amt > max) {
            max = amt;
            topCat = cat;
        }
    }
    
    // Daily average
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30 = expenses.filter(exp => new Date(exp.date) >= thirtyDaysAgo);
    const dailyAvg = last30.length > 0 ? last30.reduce((sum, exp) => sum + exp.amount, 0) / 30 : 0;
    
    // Update display
    document.getElementById('total-expense').textContent = 'PKR ' + total.toFixed(2);
    document.getElementById('month-expense').textContent = 'PKR ' + monthly.toFixed(2);
    document.getElementById('top-category').textContent = topCat;
    document.getElementById('daily-average').textContent = 'PKR ' + dailyAvg.toFixed(2);
    document.getElementById('footer-total').textContent = expenses.length;
    
    // Load recent expenses
    loadRecentExpenses();
    
    // Create charts
    createCategoryChart();
    createMonthlyChart();
}

function loadRecentExpenses() {
    const list = document.getElementById('recent-expenses-list');
    list.innerHTML = '';
    
    // Get last 5 expenses
    const recent = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recent.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(exp.date)}</td>
            <td>${exp.category}</td>
            <td>${exp.description || '-'}</td>
            <td>PKR ${exp.amount.toFixed(2)}</td>
        `;
        list.appendChild(row);
    });
}

function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Group by category
    const catData = {};
    expenses.forEach(exp => {
        catData[exp.category] = (catData[exp.category] || 0) + exp.amount;
    });
    
    const labels = Object.keys(catData);
    const data = Object.values(catData);
    
    // Colors
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#8BC34A'];
    
    // Destroy old chart
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Last 6 months data
    const monthlyData = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleString('default', { month: 'short' });
        monthlyData[month] = 0;
    }
    
    // Calculate
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        
        if (year === now.getFullYear() && monthlyData[month] !== undefined) {
            monthlyData[month] += exp.amount;
        }
    });
    
    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);
    
    // Destroy old chart
    if (monthlyChart) monthlyChart.destroy();
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount (PKR)',
                data: data,
                backgroundColor: 'rgba(33, 150, 243, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadReports() {
    // Fill category filter
    const select = document.getElementById('report-category');
    const cats = [...new Set(expenses.map(exp => exp.category))];
    
    select.innerHTML = '<option value="all">All Categories</option>';
    cats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
    
    // Generate initial report
    generateReport();
}

function generateReport() {
    const period = document.getElementById('report-period').value;
    const category = document.getElementById('report-category').value;
    
    // Filter expenses
    let filtered = expenses;
    
    if (category !== 'all') {
        filtered = filtered.filter(exp => exp.category === category);
    }
    
    const now = new Date();
    if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(exp => new Date(exp.date) >= weekAgo);
    } else if (period === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(exp => new Date(exp.date) >= monthAgo);
    }
    
    // Calculate summary
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    const avg = filtered.length > 0 ? total / filtered.length : 0;
    const highest = filtered.length > 0 ? Math.max(...filtered.map(exp => exp.amount)) : 0;
    
    // Update display
    document.getElementById('report-total').textContent = 'PKR ' + total.toFixed(2);
    document.getElementById('report-average').textContent = 'PKR ' + avg.toFixed(2);
    document.getElementById('report-highest').textContent = 'PKR ' + highest.toFixed(2);
    document.getElementById('report-count').textContent = filtered.length;
    
    // Load report table
    loadReportTable(filtered);
    
    // Create report chart
    createReportChart(filtered);
}

function loadReportTable(filteredExpenses) {
    const table = document.getElementById('report-data');
    table.innerHTML = '';
    
    // Sort by date
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(exp.date)}</td>
            <td>${exp.category}</td>
            <td>${exp.description || '-'}</td>
            <td>PKR ${exp.amount.toFixed(2)}</td>
        `;
        table.appendChild(row);
    });
}

function createReportChart(filteredExpenses) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    // Group by date
    const dateData = {};
    filteredExpenses.forEach(exp => {
        dateData[exp.date] = (dateData[exp.date] || 0) + exp.amount;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dateData).sort();
    const labels = sortedDates.map(date => formatDate(date));
    const data = sortedDates.map(date => dateData[date]);
    
    // Destroy old chart
    if (reportChart) reportChart.destroy();
    
    reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses (PKR)',
                data: data,
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadAllExpenses() {
    const list = document.getElementById('all-expenses-list');
    list.innerHTML = '';
    
    // Sort by date
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(exp.date)}</td>
            <td>${exp.category}</td>
            <td>${exp.description || '-'}</td>
            <td>PKR ${exp.amount.toFixed(2)}</td>
            <td>
                <button class="btn-action edit-btn" onclick="editExpense(${exp.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete-btn" onclick="deleteExpense(${exp.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(row);
    });
    
    // Update count
    document.getElementById('total-records').textContent = expenses.length;
}

function searchExpenses(term) {
    const rows = document.querySelectorAll('#all-expenses-list tr');
    const searchTerm = term.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function addSampleData() {
    const sample = [
        { id: 1, amount: 1500, category: 'Food', date: '2025-01-10', description: 'Lunch with friends' },
        { id: 2, amount: 500, category: 'Transport', date: '2025-01-12', description: 'Fuel for bike' },
        { id: 3, amount: 2500, category: 'Shopping', date: '2025-01-15', description: 'New clothes' },
        { id: 4, amount: 1000, category: 'Entertainment', date: '2025-01-18', description: 'Movie tickets' },
        { id: 5, amount: 3000, category: 'Education', date: '2025-01-20', description: 'Books purchase' },
        { id: 6, amount: 2000, category: 'Food', date: '2025-01-22', description: 'Grocery shopping' }
    ];
    
    expenses = sample;
    saveToLocal();
}

function saveToLocal() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}