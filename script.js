
/* ==========================================
   POCKETWISE - STUDENT MONEY MANAGER
   Complete application functionality
   ========================================== */

"use strict";


// ==========================================
// 1. CONFIGURATION AND DATA
// ==========================================

const STORAGE_KEYS = {
    transactions: "pocketwise_transactions_v1",
    goals: "pocketwise_goals_v1",
    initialized: "pocketwise_initialized_v1"
};

const CATEGORIES = {
    Food: {
        icon: "🍔",
        color: "#f59e72"
    },

    Travel: {
        icon: "🚌",
        color: "#6598ef"
    },

    Stationery: {
        icon: "📚",
        color: "#a68ae8"
    },

    Entertainment: {
        icon: "🎮",
        color: "#ed80b3"
    },

    Other: {
        icon: "📦",
        color: "#8eabb0"
    },

    Income: {
        icon: "💰",
        color: "#26b47e"
    }
};

const PAGE_INFO = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Here's an overview of your money."
    },

    transactions: {
        title: "Transactions",
        subtitle: "Every rupee received and spent, all in one place."
    },

    savings: {
        title: "Savings Goals",
        subtitle: "Turn your dreams into achievable goals."
    },

    statistics: {
        title: "Monthly Statistics",
        subtitle: "Understand your financial habits."
    },

    report: {
        title: "Spending Report",
        subtitle: "Discover exactly where your money goes."
    }
};


let transactions = [];
let goals = [];

let spendingChart = null;
let monthlyChart = null;
let monthlyCategoryChart = null;
let reportChart = null;

let toastTimeout = null;


// ==========================================
// 2. SAFE STORAGE HELPERS
// ==========================================

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        const parsed = JSON.parse(raw);

        return parsed;
    } catch (error) {
        console.error("Storage read error:", error);

        return fallback;
    }
}


function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch (error) {
        console.error("Storage write error:", error);

        showToast(
            "Unable to save data. Check your browser storage settings."
        );

        return false;
    }
}


// ==========================================
// 3. DEMO DATA
// ==========================================

function getDemoTransactions() {
    const now = new Date();

    const makeDate = (daysAgo) => {
        const date = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - daysAgo
        );

        return formatDateInput(date);
    };

    return [
        {
            id: "demo-1",
            name: "Monthly Pocket Money",
            type: "income",
            amount: 5000,
            category: "Income",
            date: makeDate(8)
        },

        {
            id: "demo-2",
            name: "College Canteen",
            type: "expense",
            amount: 200,
            category: "Food",
            date: makeDate(6)
        },

        {
            id: "demo-3",
            name: "Bus Fare",
            type: "expense",
            amount: 300,
            category: "Travel",
            date: makeDate(5)
        },

        {
            id: "demo-4",
            name: "Notebooks",
            type: "expense",
            amount: 150,
            category: "Stationery",
            date: makeDate(3)
        },

        {
            id: "demo-5",
            name: "Movie Tickets",
            type: "expense",
            amount: 250,
            category: "Entertainment",
            date: makeDate(2)
        },

        {
            id: "demo-6",
            name: "Snacks",
            type: "expense",
            amount: 120,
            category: "Food",
            date: makeDate(1)
        }
    ];
}


function getDemoGoals() {
    return [
        {
            id: "goal-demo-1",
            name: "New Headphones",
            target: 3000,
            saved: 1200,
            icon: "🎧"
        },

        {
            id: "goal-demo-2",
            name: "New Books",
            target: 1500,
            saved: 500,
            icon: "📚"
        }
    ];
}


function initializeData() {
    const alreadyInitialized =
        localStorage.getItem(STORAGE_KEYS.initialized) === "true";

    const savedTransactions = readStorage(
        STORAGE_KEYS.transactions,
        null
    );

    const savedGoals = readStorage(
        STORAGE_KEYS.goals,
        null
    );

    if (savedTransactions !== null) {
        transactions = Array.isArray(savedTransactions)
            ? savedTransactions
            : [];
    } else if (!alreadyInitialized) {
        transactions = getDemoTransactions();
    } else {
        transactions = [];
    }

    if (savedGoals !== null) {
        goals = Array.isArray(savedGoals)
            ? savedGoals
            : [];
    } else if (!alreadyInitialized) {
        goals = getDemoGoals();
    } else {
        goals = [];
    }

    if (!alreadyInitialized) {
        localStorage.setItem(
            STORAGE_KEYS.initialized,
            "true"
        );
    }

    saveTransactions();
    saveGoals();
}


function saveTransactions() {
    return writeStorage(
        STORAGE_KEYS.transactions,
        transactions
    );
}


function saveGoals() {
    return writeStorage(
        STORAGE_KEYS.goals,
        goals
    );
}


// ==========================================
// 4. GENERAL UTILITIES
// ==========================================

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


function formatMoney(amount) {
    const safeAmount = Number(amount) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(safeAmount);
}


function formatDateInput(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function currentMonth() {
    const now = new Date();

    return (
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0")
    );
}


function formatDisplayDate(dateString) {
    if (!dateString) {
        return "—";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function escapeHTML(value) {
    return String(value).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}


function getCategoryIcon(category) {
    return CATEGORIES[category]?.icon || "📦";
}


function getMonthTransactions(month) {
    return transactions.filter(
        transaction => transaction.date.startsWith(month)
    );
}


function getExpenses(list) {
    return list.filter(
        transaction => transaction.type === "expense"
    );
}


function getIncome(list) {
    return list.filter(
        transaction => transaction.type === "income"
    );
}


function sumAmounts(list) {
    let total = 0;

    for (const transaction of list) {
        total += Number(transaction.amount) || 0;
    }

    return total;
}


function getIncomeTotal(list = transactions) {
    return sumAmounts(getIncome(list));
}


function getExpenseTotal(list = transactions) {
    return sumAmounts(getExpenses(list));
}


function getBalance(list = transactions) {
    return getIncomeTotal(list) - getExpenseTotal(list);
}


function getCategoryTotals(expenseList) {
    const totals = {};

    for (const category of Object.keys(CATEGORIES)) {
        if (category !== "Income") {
            totals[category] = 0;
        }
    }

    for (const transaction of expenseList) {
        const category = totals[transaction.category] !== undefined
            ? transaction.category
            : "Other";

        totals[category] += Number(transaction.amount) || 0;
    }

    return totals;
}


function getCurrentPage() {
    const activePage = document.querySelector(".page.active");

    return activePage ? activePage.id : "dashboard";
}


// ==========================================
// 5. NOTIFICATIONS
// ==========================================

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// ==========================================
// 6. NAVIGATION
// ==========================================

function navigateTo(pageId) {
    const page = document.getElementById(pageId);

    if (!page || !PAGE_INFO[pageId]) {
        return;
    }

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    document.getElementById("page-title").textContent =
        PAGE_INFO[pageId].title;

    document.getElementById("page-subtitle").textContent =
        PAGE_INFO[pageId].subtitle;

    document.getElementById("breadcrumb-page").textContent =
        PAGE_INFO[pageId].title;

    renderCurrentPage();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function renderCurrentPage() {
    const page = getCurrentPage();

    if (page === "dashboard") {
        renderDashboard();
    }

    if (page === "transactions") {
        renderTransactionsPage();
    }

    if (page === "savings") {
        renderSavingsPage();
    }

    if (page === "statistics") {
        renderStatistics();
    }

    if (page === "report") {
        renderReport();
    }
}


// ==========================================
// 7. TRANSACTION MODAL
// ==========================================

function openTransactionModal(type = "expense") {
    const modal = document.getElementById("transaction-modal");

    const form = document.getElementById("transaction-form");

    form.reset();

    document.querySelector(
        `input[name="transaction-type"][value="${type}"]`
    ).checked = true;

    document.getElementById("transaction-date").value =
        formatDateInput(new Date());

    updateTransactionCategory();

    modal.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    setTimeout(() => {
        document.getElementById("transaction-name").focus();
    }, 50);
}


function closeTransactionModal() {
    document.getElementById(
        "transaction-modal"
    ).classList.add("hidden");

    document.body.style.overflow = "";
}


function getSelectedTransactionType() {
    return document.querySelector(
        'input[name="transaction-type"]:checked'
    ).value;
}


function updateTransactionCategory() {
    const type = getSelectedTransactionType();

    const category = document.getElementById(
        "transaction-category"
    );

    if (type === "income") {
        category.innerHTML = `
            <option value="Income">💰 Income</option>
        `;

        category.disabled = true;
    } else {
        category.disabled = false;

        category.innerHTML = `
            <option value="Food">🍔 Food</option>
            <option value="Travel">🚌 Travel</option>
            <option value="Stationery">📚 Stationery</option>
            <option value="Entertainment">🎮 Entertainment</option>
            <option value="Other">📦 Other</option>
        `;
    }
}


// ==========================================
// 8. ADD AND DELETE TRANSACTIONS
// ==========================================

function handleTransactionSubmit(event) {
    event.preventDefault();

    const name = document.getElementById(
        "transaction-name"
    ).value.trim();

    const amount = Number(
        document.getElementById("transaction-amount").value
    );

    const type = getSelectedTransactionType();

    const category = type === "income"
        ? "Income"
        : document.getElementById(
            "transaction-category"
        ).value;

    const date = document.getElementById(
        "transaction-date"
    ).value;

    if (!name) {
        showToast("Please enter a transaction name.");

        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000000
    ) {
        showToast("Please enter a valid amount.");

        return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showToast("Please select a valid date.");

        return;
    }

    const newTransaction = {
        id: createId(),
        name,
        type,
        amount,
        category,
        date
    };

    transactions.unshift(newTransaction);

    if (!saveTransactions()) {
        transactions.shift();

        return;
    }

    closeTransactionModal();

    refreshApplication();

    showToast(
        type === "income"
            ? "Pocket money added successfully! 💰"
            : "Expense added successfully! 💸"
    );
}


function deleteTransaction(id) {
    const transaction = transactions.find(
        item => item.id === id
    );

    if (!transaction) {
        return;
    }

    const confirmed = confirm(
        `Delete "${transaction.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    const previousTransactions = transactions;

    transactions = transactions.filter(
        item => item.id !== id
    );

    if (!saveTransactions()) {
        transactions = previousTransactions;

        return;
    }

    refreshApplication();

    showToast("Transaction deleted successfully.");
}


// ==========================================
// 9. DASHBOARD
// ==========================================

function renderDashboard() {
    const income = getIncomeTotal();

    const expenses = getExpenseTotal();

    const balance = income - expenses;

    const thisMonth = getMonthTransactions(currentMonth());

    const monthlySavings =
        getIncomeTotal(thisMonth) -
        getExpenseTotal(thisMonth);

    document.getElementById(
        "total-income"
    ).textContent = formatMoney(income);

    document.getElementById(
        "total-expenses"
    ).textContent = formatMoney(expenses);

    document.getElementById(
        "remaining-balance"
    ).textContent = formatMoney(balance);

    document.getElementById(
        "monthly-savings"
    ).textContent = formatMoney(monthlySavings);

    renderRecentTransactions();

    renderDashboardGoals();

    renderSpendingChart();
}


function renderRecentTransactions() {
    const container = document.getElementById(
        "recent-transactions"
    );

    const recent = [...transactions]
        .sort((a, b) => {
            return (
                b.date.localeCompare(a.date) ||
                String(b.id).localeCompare(String(a.id))
            );
        })
        .slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                No transactions yet.<br>
                Add your first transaction to get started!
            </div>
        `;

        return;
    }

    container.innerHTML = recent.map(transaction => {
        const isIncome = transaction.type === "income";

        return `
            <div class="transaction-item">

                <div class="transaction-icon">
                    ${getCategoryIcon(transaction.category)}
                </div>

                <div class="transaction-details">
                    <strong>${escapeHTML(transaction.name)}</strong>
                    <small>
                        ${escapeHTML(transaction.category)}
                        ·
                        ${formatDisplayDate(transaction.date)}
                    </small>
                </div>

                <div class="transaction-amount ${
                    isIncome ? "income-amount" : "expense-amount"
                }">
                    ${isIncome ? "+" : "−"}${formatMoney(transaction.amount)}
                </div>

            </div>
        `;
    }).join("");
}


// ==========================================
// 10. CHART HELPERS
// ==========================================

function chartAvailable() {
    return typeof Chart !== "undefined";
}


function makeDoughnutChart(canvasId, previousChart, labels, values, colors) {
    if (!chartAvailable()) {
        return null;
    }

    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        return null;
    }

    if (previousChart) {
        previousChart.destroy();
    }

    const hasValues = values.some(value => value > 0);

    return new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: hasValues ? labels : ["No expenses yet"],

            datasets: [{
                data: hasValues ? values : [1],

                backgroundColor: hasValues
                    ? colors
                    : ["#eeeaf6"],

                borderWidth: 3,

                borderColor: "#ffffff",

                hoverOffset: hasValues ? 7 : 0
            }]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            cutout: "68%",

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        padding: 17,

                        usePointStyle: true,

                        pointStyle: "circle",

                        font: {
                            size: 10
                        }
                    }
                },

                tooltip: {
                    enabled: hasValues,

                    callbacks: {
                        label: function (context) {
                            return (
                                " " +
                                context.label +
                                ": " +
                                formatMoney(context.raw)
                            );
                        }
                    }
                }
            }
        }
    });
}


function renderSpendingChart() {
    const period = document.getElementById(
        "dashboard-period"
    ).value;

    const list = period === "all"
        ? transactions
        : getMonthTransactions(currentMonth());

    const expenses = getExpenses(list);

    const totals = getCategoryTotals(expenses);

    const labels = Object.keys(totals);

    const values = labels.map(
        category => totals[category]
    );

    const colors = labels.map(
        category => CATEGORIES[category].color
    );

    spendingChart = makeDoughnutChart(
        "spending-chart",
        spendingChart,
        labels,
        values,
        colors
    );

    document.getElementById("chart-empty").classList.toggle(
        "hidden",
        expenses.length > 0
    );
}


// ==========================================
// 11. TRANSACTION HISTORY AND FILTERS
// ==========================================

function getFilteredTransactions() {
    const search = document.getElementById(
        "search-transactions"
    ).value.trim().toLowerCase();

    const type = document.getElementById(
        "filter-type"
    ).value;

    const category = document.getElementById(
        "filter-category"
    ).value;

    const month = document.getElementById(
        "filter-month"
    ).value;

    return transactions
        .filter(transaction => {
            const matchesSearch =
                transaction.name.toLowerCase().includes(search);

            const matchesType =
                type === "all" ||
                transaction.type === type;

            const matchesCategory =
                category === "all" ||
                transaction.category === category;

            const matchesMonth =
                !month ||
                transaction.date.startsWith(month);

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth
            );
        })
        .sort((a, b) => {
            return b.date.localeCompare(a.date);
        });
}


function renderTransactionsPage() {
    document.getElementById(
        "transaction-income"
    ).textContent = formatMoney(getIncomeTotal());

    document.getElementById(
        "transaction-expenses"
    ).textContent = formatMoney(getExpenseTotal());

    document.getElementById(
        "transaction-balance"
    ).textContent = formatMoney(getBalance());

    const filtered = getFilteredTransactions();

    document.getElementById(
        "transaction-count"
    ).textContent =
        `${filtered.length} of ${transactions.length} transaction(s)`;

    const tbody = document.getElementById(
        "transaction-table-body"
    );

    tbody.innerHTML = filtered.map(transaction => {
        const isIncome = transaction.type === "income";

        return `
            <tr>

                <td>
                    ${getCategoryIcon(transaction.category)}
                    ${escapeHTML(transaction.name)}
                </td>

                <td>${escapeHTML(transaction.category)}</td>

                <td>${formatDisplayDate(transaction.date)}</td>

                <td>
                    <span class="type-badge ${
                        isIncome ? "income-badge" : "expense-badge"
                    }">
                        ${isIncome ? "Income" : "Expense"}
                    </span>
                </td>

                <td class="${
                    isIncome ? "income-amount" : "expense-amount"
                }">
                    ${isIncome ? "+" : "−"}${formatMoney(transaction.amount)}
                </td>

                <td>
                    <button
                        class="delete-button"
                        data-delete-transaction="${escapeHTML(transaction.id)}"
                    >
                        Delete
                    </button>
                </td>

            </tr>
        `;
    }).join("");

    document.getElementById(
        "transaction-empty"
    ).classList.toggle(
        "hidden",
        filtered.length > 0
    );
}


// ==========================================
// 12. SAVINGS GOALS
// ==========================================

function renderSavingsPage() {
    renderGoals(
        document.getElementById("all-goals-list"),
        true
    );

    renderGoals(
        document.getElementById("dashboard-goals-list"),
        false
    );
}


function renderDashboardGoals() {
    renderGoals(
        document.getElementById("dashboard-goals-list"),
        false
    );
}


function renderGoals(container, showActions) {
    if (!goals.length) {
        container.innerHTML = `
            <div class="empty-message">
                No savings goals yet.<br>
                Create a goal and start saving!
            </div>
        `;

        return;
    }

    container.innerHTML = goals.map(goal => {
        const target = Number(goal.target) || 0;

        const saved = Number(goal.saved) || 0;

        const progress = target > 0
            ? Math.min((saved / target) * 100, 100)
            : 0;

        const completed = saved >= target;

        const remaining = Math.max(target - saved, 0);

        return `
            <article class="goal-card">

                <div class="goal-card-top">

                    <div class="goal-icon">
                        ${escapeHTML(goal.icon)}
                    </div>

                    <div>
                        <h4>${escapeHTML(goal.name)}</h4>
                        <p>
                            ${completed
                                ? "Goal completed! 🎉"
                                : "Keep saving to reach your dream."}
                        </p>
                    </div>

                    ${showActions ? `
                        <button
                            class="delete-button"
                            data-delete-goal="${escapeHTML(goal.id)}"
                        >
                            Delete
                        </button>
                    ` : ""}

                </div>


                <div class="goal-amounts">
                    <span>Saved: <strong>${formatMoney(saved)}</strong></span>
                    <span>Target: ${formatMoney(target)}</span>
                </div>


                <div
                    class="progress-track"
                    role="progressbar"
                    aria-valuenow="${Math.round(progress)}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="${escapeHTML(goal.name)} progress"
                >
                    <div
                        class="progress-fill"
                        style="width: ${progress}%"
                    ></div>
                </div>


                <div class="goal-footer">
                    <strong>${Math.round(progress)}% completed</strong>

                    <small>
                        ${completed
                            ? "Target reached!"
                            : `${formatMoney(remaining)} to go`}
                    </small>
                </div>


                ${showActions && !completed ? `
                    <form
                        class="goal-add-form"
                        data-goal-form="${escapeHTML(goal.id)}"
                    >
                        <input
                            type="number"
                            name="savingAmount"
                            min="0.01"
                            max="1000000000"
                            step="0.01"
                            placeholder="Amount to save (₹)"
                            aria-label="Amount to add to ${escapeHTML(goal.name)}"
                            required
                        >

                        <button
                            type="submit"
                            class="primary-button"
                        >
                            + Save
                        </button>
                    </form>
                ` : ""}

            </article>
        `;
    }).join("");
}


function handleGoalSubmit(event) {
    event.preventDefault();

    const name = document.getElementById(
        "goal-name"
    ).value.trim();

    const target = Number(
        document.getElementById("goal-target").value
    );

    const icon = document.getElementById(
        "goal-icon"
    ).value;

    if (!name) {
        showToast("Please enter a goal name.");

        return;
    }

    if (
        !Number.isFinite(target) ||
        target <= 0 ||
        target > 1000000000
    ) {
        showToast("Enter a valid target amount.");

        return;
    }

    const newGoal = {
        id: createId(),
        name,
        target,
        saved: 0,
        icon
    };

    goals.push(newGoal);

    if (!saveGoals()) {
        goals.pop();

        return;
    }

    document.getElementById("goal-form").reset();

    renderSavingsPage();

    showToast("Savings goal created successfully! 🎯");
}


function handleGoalSaving(event) {
    event.preventDefault();

    const form = event.target.closest("[data-goal-form]");

    if (!form) {
        return;
    }

    const id = form.dataset.goalForm;

    const amount = Number(
        new FormData(form).get("savingAmount")
    );

    const goal = goals.find(
        item => item.id === id
    );

    if (!goal) {
        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000000
    ) {
        showToast("Enter a valid savings amount.");

        return;
    }

    const previousSaved = goal.saved;

    goal.saved = Math.min(
        Number(goal.target),
        Number(goal.saved) + amount
    );

    if (!saveGoals()) {
        goal.saved = previousSaved;

        return;
    }

    renderSavingsPage();

    showToast(
        goal.saved >= goal.target
            ? "Congratulations! Goal achieved! 🎉"
            : "Your savings progress has been updated! 💜"
    );
}


function deleteGoal(id) {
    const goal = goals.find(
        item => item.id === id
    );

    if (!goal) {
        return;
    }

    if (!confirm(`Delete the goal "${goal.name}"?`)) {
        return;
    }

    const previousGoals = goals;

    goals = goals.filter(
        item => item.id !== id
    );

    if (!saveGoals()) {
        goals = previousGoals;

        return;
    }

    renderSavingsPage();

    showToast("Savings goal deleted.");
}


// ==========================================
// 13. MONTHLY STATISTICS
// ==========================================

function renderStatistics() {
    const month = document.getElementById(
        "statistics-month"
    ).value || currentMonth();

    const list = getMonthTransactions(month);

    const income = getIncomeTotal(list);

    const expenses = getExpenseTotal(list);

    const savings = income - expenses;

    const rate = income > 0
        ? (savings / income) * 100
        : 0;

    document.getElementById(
        "stats-income"
    ).textContent = formatMoney(income);

    document.getElementById(
        "stats-expenses"
    ).textContent = formatMoney(expenses);

    document.getElementById(
        "stats-savings"
    ).textContent = formatMoney(savings);

    document.getElementById(
        "stats-rate"
    ).textContent = `${rate.toFixed(1)}%`;

    renderMonthlyChart(income, expenses);

    renderMonthlyCategoryChart(list);

    renderMonthlyInsights(list, income, expenses, savings);
}


function renderMonthlyChart(income, expenses) {
    if (!chartAvailable()) {
        return;
    }

    const canvas = document.getElementById(
        "monthly-chart"
    );

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: ["Income", "Expenses"],

            datasets: [{
                label: "Amount",

                data: [income, expenses],

                backgroundColor: ["#7555df", "#ed80a0"],

                borderRadius: 8,

                maxBarThickness: 75
            }]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: context => formatMoney(context.raw)
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: value => "₹" + value
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


function renderMonthlyCategoryChart(list) {
    const totals = getCategoryTotals(getExpenses(list));

    const labels = Object.keys(totals);

    const values = labels.map(
        category => totals[category]
    );

    const colors = labels.map(
        category => CATEGORIES[category].color
    );

    monthlyCategoryChart = makeDoughnutChart(
        "monthly-category-chart",
        monthlyCategoryChart,
        labels,
        values,
        colors
    );
}


function renderMonthlyInsights(list, income, expenses, savings) {
    const container = document.getElementById(
        "monthly-insights"
    );

    const expenseList = getExpenses(list);

    const totals = getCategoryTotals(expenseList);

    const category = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .find(entry => entry[1] > 0);

    let insights = [];

    if (list.length === 0) {
        insights.push({
            icon: "📝",
            title: "No activity recorded",
            text: "Add transactions for this month to receive personalized insights."
        });
    } else {
        insights.push({
            icon: "💰",
            title: "Monthly balance",
            text: savings >= 0
                ? `You have ${formatMoney(savings)} remaining from this month's recorded income and expenses.`
                : `Your expenses exceed this month's income by ${formatMoney(Math.abs(savings))}.`
        });

        if (income > 0) {
            const rate = (savings / income) * 100;

            insights.push({
                icon: "📈",
                title: "Savings rate",
                text: `Your monthly savings rate is ${rate.toFixed(1)}% based on recorded income.`
            });
        }

        if (category) {
            insights.push({
                icon: "🏆",
                title: "Top spending category",
                text: `${category[0]} is your highest-spending category this month at ${formatMoney(category[1])}.`
            });
        }

        if (expenses === 0) {
            insights.push({
                icon: "🌟",
                title: "No expenses recorded",
                text: "You have not recorded any expenses for this month."
            });
        }
    }

    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div>
                <strong>${escapeHTML(insight.title)}</strong>
                <p>${escapeHTML(insight.text)}</p>
            </div>
        </div>
    `).join("");
}


// ==========================================
// 14. WHERE DID MY MONEY GO REPORT
// ==========================================

function getReportTransactions() {
    const period = document.getElementById(
        "report-period"
    ).value;

    const month = document.getElementById(
        "report-month"
    ).value || currentMonth();

    const list = period === "all"
        ? transactions
        : getMonthTransactions(month);

    return getExpenses(list);
}


function renderReport() {
    const expenses = getReportTransactions();

    const total = getExpenseTotal(expenses);

    const totals = getCategoryTotals(expenses);

    const entries = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    const biggest = entries.find(
        entry => entry[1] > 0
    );

    document.getElementById(
        "report-total"
    ).textContent = formatMoney(total);

    document.getElementById(
        "report-biggest"
    ).textContent = biggest
        ? biggest[0]
        : "—";

    document.getElementById(
        "report-count"
    ).textContent = String(expenses.length);

    renderReportChart(totals);

    renderCategoryBreakdown(totals, total);

    renderReportInsights(expenses, totals, total);
}


function renderReportChart(totals) {
    const labels = Object.keys(totals);

    const values = labels.map(
        category => totals[category]
    );

    const colors = labels.map(
        category => CATEGORIES[category].color
    );

    reportChart = makeDoughnutChart(
        "report-chart",
        reportChart,
        labels,
        values,
        colors
    );
}


function renderCategoryBreakdown(totals, total) {
    const container = document.getElementById(
        "report-category-list"
    );

    const entries = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    container.innerHTML = entries.map(([category, amount]) => {
        const percentage = total > 0
            ? (amount / total) * 100
            : 0;

        return `
            <div class="category-row">

                <div class="category-row-top">

                    <span class="category-row-name">
                        ${getCategoryIcon(category)}
                        ${escapeHTML(category)}
                    </span>

                    <span class="category-row-value">
                        ${formatMoney(amount)}

                        <small>
                            ${percentage.toFixed(1)}%
                        </small>
                    </span>

                </div>

                <div class="category-track">
                    <div
                        class="category-fill"
                        style="
                            width: ${percentage}%;
                            background: ${CATEGORIES[category].color};
                        "
                    ></div>
                </div>

            </div>
        `;
    }).join("");
}


function renderReportInsights(expenses, totals, total) {
    const container = document.getElementById(
        "report-insights"
    );

    const entries = Object.entries(totals)
        .filter(entry => entry[1] > 0)
        .sort((a, b) => b[1] - a[1]);

    const insights = [];

    if (expenses.length === 0) {
        insights.push({
            icon: "📝",
            title: "No expenses recorded",
            text: "Add expense transactions to discover your spending patterns."
        });
    } else {
        const biggest = entries[0];

        const percentage = total > 0
            ? (biggest[1] / total) * 100
            : 0;

        insights.push({
            icon: "🏆",
            title: "Your biggest spending category",
            text: `You spend the most on ${biggest[0]}: ${formatMoney(biggest[1])}, or ${percentage.toFixed(1)}% of your recorded expenses.`
        });

        if (percentage >= 40) {
            insights.push({
                icon: "💡",
                title: "A chance to save more",
                text: `${biggest[0]} accounts for a large share of your spending. Reviewing these expenses could help you find opportunities to save.`
            });
        } else {
            insights.push({
                icon: "🌟",
                title: "Keep tracking your habits",
                text: "Review your categories regularly to understand your spending and identify possible savings."
            });
        }

        const food = totals.Food || 0;

        if (food > 0) {
            insights.push({
                icon: "🍔",
                title: "Food spending",
                text: `You spent ${formatMoney(food)} on food. Planning snacks and meals may help you manage this category.`
            });
        }

        const entertainment = totals.Entertainment || 0;

        if (entertainment > 0) {
            insights.push({
                icon: "🎮",
                title: "Entertainment spending",
                text: `You spent ${formatMoney(entertainment)} on entertainment. Consider setting a monthly entertainment budget.`
            });
        }
    }

    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>

            <div>
                <strong>${escapeHTML(insight.title)}</strong>
                <p>${escapeHTML(insight.text)}</p>
            </div>
        </div>
    `).join("");
}


// ==========================================
// 15. EXPORT REPORT TO CSV
// ==========================================

function downloadReport() {
    const expenses = getReportTransactions();

    if (expenses.length === 0) {
        showToast("There are no expenses to export.");

        return;
    }

    const rows = [
        ["Transaction Name", "Category", "Date", "Amount (INR)"]
    ];

    for (const transaction of expenses) {
        rows.push([
            transaction.name,
            transaction.category,
            transaction.date,
            transaction.amount
        ]);
    }

    const csv = rows.map(row => {
        return row.map(value => {
            let text = String(value);

            // Reduce the risk of spreadsheet formula injection.
            if (/^[\s]*[=+\-@\t\r]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "PocketWise-Spending-Report.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast("Your spending report has been downloaded! 📥");
}


// ==========================================
// 16. REFRESH APPLICATION
// ==========================================

function refreshApplication() {
    renderDashboard();

    renderTransactionsPage();

    renderSavingsPage();

    renderStatistics();

    renderReport();
}


// ==========================================
// 17. EVENT LISTENERS
// ==========================================

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.page);
        });
    });

    document.querySelectorAll("[data-goto]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.goto);
        });
    });
}


function setupTransactionEvents() {
    document.getElementById(
        "open-transaction"
    ).addEventListener("click", () => {
        openTransactionModal("expense");
    });

    document.getElementById(
        "transaction-add-button"
    ).addEventListener("click", () => {
        openTransactionModal("expense");
    });

    document.getElementById(
        "quick-expense"
    ).addEventListener("click", () => {
        openTransactionModal("expense");
    });

    document.getElementById(
        "quick-income"
    ).addEventListener("click", () => {
        openTransactionModal("income");
    });

    document.getElementById(
        "close-modal"
    ).addEventListener("click", closeTransactionModal);

    document.getElementById(
        "cancel-transaction"
    ).addEventListener("click", closeTransactionModal);

    document.getElementById(
        "modal-backdrop"
    ).addEventListener("click", closeTransactionModal);

    document.getElementById(
        "transaction-form"
    ).addEventListener("submit", handleTransactionSubmit);

    document.querySelectorAll(
        'input[name="transaction-type"]'
    ).forEach(input => {
        input.addEventListener(
            "change",
            updateTransactionCategory
        );
    });

    document.getElementById(
        "transaction-table-body"
    ).addEventListener("click", event => {
        const button = event.target.closest(
            "[data-delete-transaction]"
        );

        if (button) {
            deleteTransaction(
                button.dataset.deleteTransaction
            );
        }
    });
}


function setupFilterEvents() {
    [
        "search-transactions",
        "filter-type",
        "filter-category",
        "filter-month"
    ].forEach(id => {
        const element = document.getElementById(id);

        element.addEventListener("input", () => {
            renderTransactionsPage();
        });

        element.addEventListener("change", () => {
            renderTransactionsPage();
        });
    });

    document.getElementById(
        "dashboard-period"
    ).addEventListener("change", renderSpendingChart);
}


function setupSavingsEvents() {
    document.getElementById(
        "goal-form"
    ).addEventListener("submit", handleGoalSubmit);

    document.getElementById(
        "all-goals-list"
    ).addEventListener("submit", handleGoalSaving);

    document.getElementById(
        "all-goals-list"
    ).addEventListener("click", event => {
        const button = event.target.closest(
            "[data-delete-goal]"
        );

        if (button) {
            deleteGoal(button.dataset.deleteGoal);
        }
    });
}


function setupStatisticsEvents() {
    document.getElementById(
        "statistics-month"
    ).addEventListener("change", renderStatistics);
}


function setupReportEvents() {
    document.getElementById(
        "report-period"
    ).addEventListener("change", () => {
        const selectedPeriod = document.getElementById(
            "report-period"
        ).value;

        document.getElementById(
            "report-month"
        ).disabled = selectedPeriod === "all";

        renderReport();
    });

    document.getElementById(
        "report-month"
    ).addEventListener("change", renderReport);

    document.getElementById(
        "download-report"
    ).addEventListener("click", downloadReport);
}


function setupKeyboardEvents() {
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeTransactionModal();
        }
    });
}


// ==========================================
// 18. APPLICATION STARTUP
// ==========================================

function initializeApplication() {
    initializeData();

    const today = new Date();

    document.getElementById(
        "today-date"
    ).textContent = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    document.getElementById(
        "footer-year"
    ).textContent = today.getFullYear();

    document.getElementById(
        "transaction-date"
    ).value = formatDateInput(today);

    document.getElementById(
        "statistics-month"
    ).value = currentMonth();

    document.getElementById(
        "report-month"
    ).value = currentMonth();

    document.getElementById(
        "filter-month"
    ).value = "";

    setupNavigation();

    setupTransactionEvents();

    setupFilterEvents();

    setupSavingsEvents();

    setupStatisticsEvents();

    setupReportEvents();

    setupKeyboardEvents();

    refreshApplication();

    if (!chartAvailable()) {
        showToast(
            "Charts require an internet connection to load."
        );
    }
}


// Start the application after the HTML is ready.
document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);
