// Dompet Rumah — router and wiring.
//
// Hash routes, one page each (see views.js). After every render the page
// redraws its charts and wires its forms; every control below changes the
// live state, saves it, and re-renders, so the numbers on screen are
// always the numbers the household just entered.
//
//   #/           dashboard      #/goals   savings goals
//   #/expenses   expense log    #/trends  six-month trend
//   #/budget     budget vs actual
//   #/report     monthly report with CSV export
//   #/planner    weekly shopping list with a grocery budget
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

const app = document.getElementById('app');
let state = loadState();

const NAV_ROUTES = { '#/': 1, '#/expenses': 1, '#/budget': 1, '#/goals': 1, '#/trends': 1, '#/report': 1, '#/planner': 1 };
const TITLES = {
  '#/': 'Dasbor',
  '#/expenses': 'Catat Belanja',
  '#/budget': 'Anggaran vs Realisasi',
  '#/goals': 'Tabungan & Tujuan',
  '#/trends': 'Tren 6 Bulan',
  '#/report': 'Laporan Bulanan',
  '#/planner': 'Belanja Mingguan',
};

function drawCharts(route) {
  if (route === '#/') {
    const canvas = document.getElementById('donut');
    if (canvas) {
      const spent = spentByCategory(state);
      drawDonut(canvas, state.categories.map((c) => ({ value: spent[c.id], color: c.color })));
    }
  }
  if (route === '#/trends') {
    const canvas = document.getElementById('trend');
    if (canvas) {
      const months = state.history.map((m) => ({ ...m }));
      months[months.length - 1].spent = totalSpent(state);
      months[months.length - 1].income = totalIncome(state);
      drawTrend(canvas, months);
    }
    const weeklyCanvas = document.getElementById('weekly');
    if (weeklyCanvas) drawWeeklyBars(weeklyCanvas, weeklyBreakdown(state));
  }
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = NAV_ROUTES[hash] ? hash : '#/';
  const pages = {
    '#/': dashboard,
    '#/expenses': expensesPage,
    '#/budget': budgetPage,
    '#/goals': goalsPage,
    '#/trends': trendsPage,
    '#/report': reportPage,
    '#/planner': plannerPage,
  };
  document.title = `${TITLES[route]} | Dompet Rumah`;
  app.innerHTML = nav(route) + pages[route](state);
  wirePage(route);
  drawCharts(route);
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function readForm(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function addExpense(form) {
  const fields = readForm(form);
  const amount = Math.round(Number(fields.amount));
  if (!fields.note || !Number.isFinite(amount) || amount < 1000) return false;
  state.expenses.push({
    id: 'e' + Date.now().toString(36),
    date: fields.date || '2026-11-26',
    category: fields.category,
    note: fields.note.trim(),
    amount,
  });
  saveState(state);
  return true;
}

// Pemasukan baru: sumber, tanggal, jumlah. Masuk ke daftar pemasukan dan
// langsung mengubah total pemasukan di semua halaman. Jumlah di atas
// Rp 100 jt ditolak sebagai kemungkinan salah ketik — keluarga ini tidak
// pernah menerima sebesar itu dalam sekali masuk.
function addIncome(form) {
  const fields = readForm(form);
  const amount = Math.round(Number(fields.amount));
  if (!fields.source || !Number.isFinite(amount) || amount < 1000 || amount > 100000000) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date || '')) return false;
  state.income.push({
    id: 'i' + Date.now().toString(36),
    date: fields.date,
    source: fields.source.trim(),
    amount,
  });
  saveState(state);
  return true;
}

// Barang belanja baru: nama, kategori, perkiraan harga. Masuk ke daftar
// rencana belanja mingguan; harga di bawah Rp 500 ditolak sebagai
// kemungkinan salah ketik, di atas Rp 5 jt ditolak karena bukan belanja
// mingguan rumah tangga biasa. Kategori yang tidak dikenal jatuh ke
// "Lainnya" supaya daftar pilihan di halaman tetap rapi.
function addShopping(form) {
  const fields = readForm(form);
  const price = Math.round(Number(fields.price));
  if (!fields.name || !Number.isFinite(price) || price < 500 || price > 5000000) return false;
  const category = SHOPPING_CATEGORIES.includes(fields.category) ? fields.category : 'Lainnya';
  if (!Array.isArray(state.shopping)) state.shopping = [];
  state.shopping.push({
    id: 's' + Date.now().toString(36),
    name: fields.name.trim(),
    category,
    price,
    bought: false,
    added: '2026-11-26',
  });
  saveState(state);
  return true;
}

function applyExpenseFilter() {  const category = document.getElementById('filter-category').value;
  const query = document.getElementById('filter-search').value.trim().toLowerCase();
  const rows = document.getElementById('expense-rows');
  const filtered = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .filter((e) => (!category || e.category === category) && (!query || e.note.toLowerCase().includes(query)));
  rows.innerHTML = filtered.map((e) => {
    const cat = state.categories.find((c) => c.id === e.category);
    return `<tr><td>${formatDate(e.date)}</td><td>${escapeHtml(e.note)}</td><td><span class="chip" style="--chip:${cat ? cat.color : '#64748b'}">${cat ? cat.name : e.category}</span></td><td class="amount">${formatRupiah(e.amount)}</td><td><button class="btn-small danger-outline" data-action="delete-expense" data-id="${e.id}">Hapus</button></td></tr>`;
  }).join('') || '<tr><td colspan="5">Tidak ada catatan yang cocok dengan saringan.</td></tr>';
  document.getElementById('expense-count').textContent = `${filtered.length} catatan`;
  document.getElementById('expense-total').textContent = formatRupiah(filtered.reduce((s, e) => s + e.amount, 0));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function wirePage(route) {
  // Add-expense forms (dashboard quick-add and the expenses page).
  for (const form of app.querySelectorAll('#quick-add, #add-expense')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (addExpense(form)) {
        render();
        const status = document.getElementById('add-status');
        if (status) status.textContent = '✓ Pengeluaran tersimpan — total dan diagram sudah diperbarui.';
      }
    });
  }

  // Add-income forms (dashboard and report page share the same section).
  const incomeForm = document.getElementById('add-income');
  if (incomeForm) {
    incomeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = document.getElementById('income-status');
      if (addIncome(incomeForm)) {
        render();
        const fresh = document.getElementById('income-status');
        if (fresh) fresh.textContent = '✓ Pemasukan tersimpan — total pemasukan di semua halaman sudah diperbarui.';
      } else if (status) {
        status.textContent = '⚠ Periksa lagi isian Anda: sumber wajib diisi dan jumlah antara Rp 1.000 sampai Rp 100.000.000.';
      }
    });
  }

  // Expenses page: filters and reset.
  const filterCategory = document.getElementById('filter-category');
  if (filterCategory) {
    filterCategory.addEventListener('change', applyExpenseFilter);
    document.getElementById('filter-search').addEventListener('input', applyExpenseFilter);
    document.getElementById('reset-data').addEventListener('click', () => {
      state = resetState();
      saveState(state);
      render();
    });
  }

  // Budget page: editing a budget amount updates its bar and status live.
  for (const input of app.querySelectorAll('[data-action="budget-input"]')) {
    input.addEventListener('change', () => {
      const category = state.categories.find((c) => c.id === input.dataset.id);
      if (!category) return;
      const value = Math.round(Number(input.value));
      if (Number.isFinite(value) && value >= 0) {
        category.budget = value;
        saveState(state);
        render();
      }
    });
  }

  // Goals page: deposits and the new-goal form.
  for (const form of app.querySelectorAll('.goal-deposit')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const goal = state.goals.find((g) => g.id === form.dataset.goal);
      const amount = Math.round(Number(readForm(form).amount));
      if (goal && Number.isFinite(amount) && amount >= 1000) {
        goal.saved += amount;
        saveState(state);
        render();
      }
    });
  }
  const goalForm = document.getElementById('add-goal');
  if (goalForm) {
    goalForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const fields = readForm(goalForm);
      const target = Math.round(Number(fields.target));
      const saved = Math.round(Number(fields.saved));
      const monthly = Math.round(Number(fields.monthly));
      if (!fields.name || !Number.isFinite(target) || target < 10000 || !Number.isFinite(saved) || saved < 0) return;
      const palette = ['#0f766e', '#0284c7', '#ca8a04', '#db2777', '#7c3aed'];
      state.goals.push({
        id: 'g' + Date.now().toString(36),
        name: fields.name.trim(),
        detail: (fields.detail || 'Tujuan baru keluarga').trim(),
        target,
        saved,
        monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : 0,
        color: palette[state.goals.length % palette.length],
      });
      saveState(state);
      render();
    });
  }

  // Goals page: editing the monthly deposit updates the "Perkiraan
  // tercapai" line live — the input saves on change, then re-renders.
  for (const input of app.querySelectorAll('[data-action="monthly-input"]')) {
    input.addEventListener('change', () => {
      const goal = state.goals.find((g) => g.id === input.dataset.id);
      if (!goal) return;
      const value = Math.round(Number(input.value));
      if (Number.isFinite(value) && value >= 0) {
        goal.monthly = value;
        saveState(state);
        render();
      }
    });
  }

  // Planner page: the add-item form and the bought checkboxes. Checking
  // an item saves it and re-renders, so the budget card and the progress
  // bar follow the list immediately.
  const shoppingForm = document.getElementById('add-shopping');
  if (shoppingForm) {
    shoppingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = document.getElementById('shopping-status');
      if (addShopping(shoppingForm)) {
        render();
        const fresh = document.getElementById('shopping-status');
        if (fresh) fresh.textContent = '✓ Barang ditambahkan ke daftar belanja minggu ini.';
      } else if (status) {
        status.textContent = '⚠ Periksa lagi isian Anda: nama wajib diisi dan harga antara Rp 500 sampai Rp 5.000.000.';
      }
    });
  }
  for (const box of app.querySelectorAll('[data-action="shop-toggle"]')) {
    box.addEventListener('change', () => {
      const item = state.shopping.find((s) => s.id === box.dataset.id);
      if (!item) return;
      item.bought = box.checked;
      saveState(state);
      render();
    });
  }

  // Report page: the CSV is built in the browser from the live state and
  // downloaded as a file — no network, nothing leaves the device.
  const csvButton = document.getElementById('download-csv');
  if (csvButton) {
    csvButton.addEventListener('click', () => {
      const csv = buildExpensesCsv(state);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dompet-rumah-november-2026.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const status = document.getElementById('csv-status');
      if (status) status.textContent = `✓ Berkas CSV dibuat — ${state.expenses.length} catatan, ${csv.split('\n').length} baris.`;
    });
  }
}

// Delete buttons, delegated once on #app so filtered rows work too and a
// re-render never stacks another listener on the same element.
app.addEventListener('click', (event) => {
  const expenseButton = event.target.closest('[data-action="delete-expense"]');
  if (expenseButton) {
    state.expenses = state.expenses.filter((e) => e.id !== expenseButton.dataset.id);
    saveState(state);
    render();
    return;
  }
  const incomeButton = event.target.closest('[data-action="delete-income"]');
  if (incomeButton) {
    state.income = state.income.filter((line) => line.id !== incomeButton.dataset.id);
    saveState(state);
    render();
    return;
  }
  const shoppingButton = event.target.closest('[data-action="delete-shopping"]');
  if (shoppingButton) {
    state.shopping = state.shopping.filter((item) => item.id !== shoppingButton.dataset.id);
    saveState(state);
    render();
  }
});

window.addEventListener('hashchange', render);
window.addEventListener('resize', () => drawCharts(location.hash || '#/'));
render();
