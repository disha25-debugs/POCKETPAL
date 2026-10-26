(() => {
  "use strict";

  const STORAGE_KEY = "pocketpal_student_manager_v2";
  const categories = {
    expense: ["Food", "Travel", "Stationery", "Entertainment", "Shopping", "Health", "Bills", "Other"],
    income: ["Gift", "Part-time work", "Allowance top-up", "Refund", "Other"]
  };
  const icons = { Food: "☕", Travel: "🚌", Stationery: "✎", Entertainment: "♫", Shopping: "🛍", Health: "♡", Bills: "▤", Other: "✦", Gift: "🎁", "Part-time work": "✧", "Allowance top-up": "₹", Refund: "↩" };
  const titles = { dashboard: "Your dashboard", transactions: "Transactions", savings: "Savings goals", reports: "Spending report", settings: "Settings" };
  const $ = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);
  const currentMonth = () => today().slice(0, 7);
  const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount) || 0);
  const makeId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.transactions) && Array.isArray(saved.goals)) {
        return { allowance: Math.max(0, Number(saved.allowance) || 0), transactions: saved.transactions, goals: saved.goals };
      }
    } catch (error) { console.warn("Saved data could not be read.", error); }
    return { allowance: 0, transactions: [], goals: [] };
  }
  let data = loadData();
  let toastTimer;

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (error) { showToast("Could not save data in this browser. Check storage settings."); }
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2800);
  }
  function isCurrentMonth(date) { return String(date || "").slice(0, 7) === currentMonth(); }
  function transactionTotals(month = currentMonth()) {
    const items = data.transactions.filter(t => String(t.date || "").slice(0, 7) === month);
    const expenses = items.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const income = items.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { items, expenses, income };
  }
  function balanceForMonth(month = currentMonth()) {
    const totals = transactionTotals(month);
    return Number(data.allowance || 0) + totals.income - totals.expenses;
  }

  function setPage(page) {
    if (!titles[page]) return;
    document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.id === `page-${page}`));
    document.querySelectorAll(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    $("pageTitle").textContent = titles[page];
    if (page === "transactions") renderTransactions();
    if (page === "savings") renderGoals();
    if (page === "reports") renderReport();
    if (page === "settings") $("allowanceAmount").value = data.allowance;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => setPage(button.dataset.go)));

  function renderDashboard() {
    const totals = transactionTotals();
    $("statAllowance").textContent = money(data.allowance);
    $("statExpenses").textContent = money(totals.expenses);
    $("statIncome").textContent = money(totals.income);
    $("statBalance").textContent = money(balanceForMonth());
    const recent = [...data.transactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
    $("recentTransactions").innerHTML = recent.length ? recent.map(t => transactionRow(t, false)).join("") : emptyList("No transactions yet. Add your first expense or income.");
    const goals = data.goals.slice(0, 3);
    $("dashboardGoals").innerHTML = goals.length ? goals.map(goalMini).join("") : '<div class="empty-list">No savings goals yet. Make one for something you want!</div>';
  }

  function transactionRow(t, actions = true) {
    const type = t.type === "income" ? "income" : "expense";
    const sign = type === "income" ? "+" : "−";
    const icon = icons[t.category] || "✦";
    const actionHTML = actions ? `<div class="row-actions"><button class="small-action" data-edit-transaction="${escapeHTML(t.id)}">Edit</button><button class="small-action" data-delete-transaction="${escapeHTML(t.id)}">Delete</button></div>` : "";
    return `<div class="transaction-row">
      <div class="transaction-icon ${type}">${icon}</div>
      <div class="transaction-info"><strong>${escapeHTML(t.description)}</strong><small>${escapeHTML(t.category)} · ${escapeHTML(t.date || "")}</small></div>
      <div class="transaction-right"><div class="transaction-amount ${type}">${sign}${money(t.amount)}</div>${actionHTML}</div>
    </div>`;
  }
  function emptyList(message) { return `<div class="empty-list">${escapeHTML(message)}</div>`; }

  function fillCategoryOptions(selected = "Food") {
    const type = $("type").value;
    $("category").innerHTML = categories[type].map(c => `<option value="${escapeHTML(c)}"${c === selected ? " selected" : ""}>${escapeHTML(c)}</option>`).join("");
  }
  function showTransactionForm(transaction = null) {
    $("transactionForm").classList.remove("hidden");
    $("transactionFormTitle").textContent = transaction ? "Edit transaction" : "Add a transaction";
    $("transactionFormEyebrow").textContent = transaction ? "UPDATE ENTRY" : "NEW ENTRY";
    $("transactionId").value = transaction?.id || "";
    $("description").value = transaction?.description || "";
    $("amount").value = transaction?.amount ?? "";
    $("type").value = transaction?.type || "expense";
    fillCategoryOptions(transaction?.category || (transaction?.type === "income" ? "Gift" : "Food"));
    $("date").value = transaction?.date || today();
    $("saveTransaction").textContent = transaction ? "Update transaction" : "Save transaction";
    $("transactionForm").scrollIntoView({ behavior: "smooth", block: "center" });
    $("description").focus();
  }
  function hideTransactionForm() { $("transactionForm").classList.add("hidden"); $("transactionForm").reset(); $("transactionId").value = ""; }
  $("topAddButton").addEventListener("click", () => { setPage("transactions"); showTransactionForm(); });
  $("showTransactionForm").addEventListener("click", () => showTransactionForm());
  $("cancelTransaction").addEventListener("click", hideTransactionForm);
  $("cancelTransaction2").addEventListener("click", hideTransactionForm);
  $("type").addEventListener("change", () => fillCategoryOptions());

  $("transactionForm").addEventListener("submit", event => {
    event.preventDefault();
    const id = $("transactionId").value;
    const amount = Number($("amount").value);
    const description = $("description").value.trim();
    if (!description || !Number.isFinite(amount) || amount <= 0) { showToast("Enter a description and an amount greater than zero."); return; }
    const transaction = { id: id || makeId(), description, amount, type: $("type").value, category: $("category").value, date: $("date").value };
    if (!transaction.date) { showToast("Please select a date."); return; }
    if (id) {
      const index = data.transactions.findIndex(t => t.id === id);
      if (index >= 0) data.transactions[index] = transaction;
      showToast("Transaction updated successfully.");
    } else {
      data.transactions.push(transaction);
      showToast("Transaction added successfully.");
    }
    saveData(); hideTransactionForm(); renderAll();
  });

  function renderTransactions() {
    const selectedMonth = $("monthFilter").value || "all";
    const query = $("transactionSearch").value.trim().toLowerCase();
    const type = $("typeFilter").value;
    const list = [...data.transactions].filter(t => {
      const matchesMonth = selectedMonth === "all" || String(t.date || "").slice(0, 7) === selectedMonth;
      const matchesType = type === "all" || t.type === type;
      const matchesQuery = `${t.description} ${t.category} ${t.date}`.toLowerCase().includes(query);
      return matchesMonth && matchesType && matchesQuery;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("allTransactions").innerHTML = list.length ? list.map(t => transactionRow(t, true)).join("") : emptyList("No transactions match these filters.");
  }
  ["transactionSearch", "typeFilter", "monthFilter"].forEach(id => $(id).addEventListener(id === "transactionSearch" ? "input" : "change", renderTransactions));
  document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-transaction]");
    const remove = event.target.closest("[data-delete-transaction]");
    if (edit) {
      const t = data.transactions.find(item => item.id === edit.dataset.editTransaction);
      if (t) { setPage("transactions"); showTransactionForm(t); }
    }
    if (remove) {
      const id = remove.dataset.deleteTransaction;
      const t = data.transactions.find(item => item.id === id);
      if (t && window.confirm(`Delete "${t.description}"?`)) {
        data.transactions = data.transactions.filter(item => item.id !== id);
        saveData(); renderAll(); showToast("Transaction deleted.");
      }
    }
  });

  function goalMini(goal) {
    const target = Math.max(0, Number(goal.target) || 0);
    const saved = Math.max(0, Number(goal.saved) || 0);
    const percent = target ? Math.min(100, Math.round(saved / target * 100)) : 0;
    return `<div class="goal-mini"><div class="goal-line"><span>${escapeHTML(goal.name)}</span><span>${percent}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="goal-subline"><span>${money(saved)} saved</span><span>Target ${money(target)}</span></div></div>`;
  }
  function renderGoals() {
    $("goalsList").innerHTML = data.goals.map(goal => {
      const target = Math.max(0, Number(goal.target) || 0), saved = Math.max(0, Number(goal.saved) || 0);
      const percent = target ? Math.min(100, Math.round(saved / target * 100)) : 0;
      const complete = target > 0 && saved >= target;
      return `<article class="goal-card"><div class="goal-card-top"><div class="goal-symbol">◎</div><button class="small-action" data-delete-goal="${escapeHTML(goal.id)}">Delete</button></div><h3>${escapeHTML(goal.name)}</h3><p class="muted">${complete ? "Goal reached — amazing work!" : `${money(Math.max(0, target - saved))} left to reach your goal`}</p><div class="goal-progress-text">${percent}%</div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="goal-subline"><span>${money(saved)} saved</span><span>Target ${money(target)}</span></div><div class="goal-card-actions"><button class="button button-soft" data-edit-goal="${escapeHTML(goal.id)}">Edit goal</button></div></article>`;
    }).join("");
    $("noGoals").classList.toggle("hidden", data.goals.length > 0);
  }
  function showGoalForm(goal = null) {
    $("goalForm").classList.remove("hidden");
    $("goalFormTitle").textContent = goal ? "Edit savings goal" : "Create a savings goal";
    $("goalId").value = goal?.id || "";
    $("goalName").value = goal?.name || "";
    $("goalTarget").value = goal?.target ?? "";
    $("goalSaved").value = goal?.saved ?? 0;
    $("goalForm").scrollIntoView({ behavior: "smooth", block: "center" });
    $("goalName").focus();
  }
  function hideGoalForm() { $("goalForm").classList.add("hidden"); $("goalForm").reset(); $("goalId").value = ""; $("goalSaved").value = "0"; }
  $("showGoalForm").addEventListener("click", () => showGoalForm());
  $("cancelGoal").addEventListener("click", hideGoalForm);
  $("cancelGoal2").addEventListener("click", hideGoalForm);
  $("goalForm").addEventListener("submit", event => {
    event.preventDefault();
    const id = $("goalId").value, name = $("goalName").value.trim(), target = Number($("goalTarget").value), saved = Number($("goalSaved").value);
    if (!name || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) { showToast("Please enter a valid goal and amounts."); return; }
    const goal = { id: id || makeId(), name, target, saved };
    if (id) {
      const index = data.goals.findIndex(g => g.id === id);
      if (index >= 0) data.goals[index] = goal;
      showToast("Savings goal updated.");
    } else { data.goals.push(goal); showToast("Savings goal created."); }
    saveData(); hideGoalForm(); renderAll();
  });
  document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-goal]");
    const remove = event.target.closest("[data-delete-goal]");
    if (edit) { const goal = data.goals.find(g => g.id === edit.dataset.editGoal); if (goal) showGoalForm(goal); }
    if (remove) {
      const goal = data.goals.find(g => g.id === remove.dataset.deleteGoal);
      if (goal && window.confirm(`Delete savings goal "${goal.name}"?`)) {
        data.goals = data.goals.filter(g => g.id !== goal.id); saveData(); renderAll(); showToast("Savings goal deleted.");
      }
    }
  });

  function monthOptions() {
    const months = new Set([currentMonth(), ...data.transactions.map(t => String(t.date || "").slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m))]);
    return [...months].sort().reverse();
  }
  function monthLabel(month) {
    const [year, mon] = month.split("-").map(Number);
    return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  function refreshMonthSelects() {
    const options = monthOptions();
    const transactionOld = $("monthFilter").value || "all";
    const reportOld = $("reportMonth").value || currentMonth();
    $("monthFilter").innerHTML = `<option value="all">All months</option>` + options.map(m => `<option value="${m}">${escapeHTML(monthLabel(m))}</option>`).join("");
    $("monthFilter").value = options.includes(transactionOld) || transactionOld === "all" ? transactionOld : "all";
    $("reportMonth").innerHTML = options.map(m => `<option value="${m}">${escapeHTML(monthLabel(m))}</option>`).join("");
    $("reportMonth").value = options.includes(reportOld) ? reportOld : currentMonth();
  }
  function renderReport() {
    const month = $("reportMonth").value || currentMonth();
    const totals = transactionTotals(month);
    $("reportSummary").innerHTML = `<small>Total expenses in ${escapeHTML(monthLabel(month))}</small><strong>${money(totals.expenses)}</strong>`;
    const byCategory = {};
    totals.items.filter(t => t.type === "expense").forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0); });
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    $("categoryReport").innerHTML = entries.length ? entries.map(([category, amount]) => {
      const percent = totals.expenses ? Math.round(amount / totals.expenses * 100) : 0;
      return `<div class="category-item"><div class="category-item-top"><strong>${icons[category] || "✦"} &nbsp;${escapeHTML(category)}</strong><span>${money(amount)} · ${percent}%</span></div><div class="category-track"><div class="category-fill" style="width:${percent}%"></div></div></div>`;
    }).join("") : emptyList("No expenses recorded for this month yet.");
    $("reportTransactions").innerHTML = totals.items.length ? [...totals.items].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(t => transactionRow(t, false)).join("") : emptyList("No transactions recorded for this month.");
  }
  $("reportMonth").addEventListener("change", renderReport);

  $("allowanceForm").addEventListener("submit", event => {
    event.preventDefault();
    const amount = Number($("allowanceAmount").value);
    if (!Number.isFinite(amount) || amount < 0) { showToast("Enter a valid pocket money amount."); return; }
    data.allowance = amount;
    saveData(); renderAll();
    $("allowanceSaved").classList.remove("hidden");
    showToast("Monthly pocket money updated!");
    setTimeout(() => $("allowanceSaved").classList.add("hidden"), 3000);
  });

  $("resetData").addEventListener("click", async () => {
    const dialog = $("confirmDialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      const result = await new Promise(resolve => dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true }));
      if (result !== "confirm") return;
    } else if (!window.confirm("Reset all saved data? This cannot be undone.")) return;
    data = { allowance: 0, transactions: [], goals: [] };
    saveData(); hideTransactionForm(); hideGoalForm(); renderAll(); $("allowanceAmount").value = "0";
    showToast("All saved data has been reset.");
  });

  function renderAll() {
    refreshMonthSelects();
    renderDashboard();
    renderTransactions();
    renderGoals();
    renderReport();
    $("allowanceAmount").value = data.allowance;
  }

  $("todayLabel").textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  $("date").value = today();
  renderAll();
})();