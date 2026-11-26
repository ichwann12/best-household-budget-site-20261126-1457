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
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

const app = document.getElementById('app');
let state = loadState();

const NAV_ROUTES = { '#/': 1, '#/expenses': 1, '#/budget': 1, '#/goals': 1, '#/trends': 1, '#/report': 1 };
const TITLES = {
  '#/': 'Dasbor',
  '#/expenses': 'Catat Belanja',
  '#/budget': 'Anggaran vs Realisasi',
  '#/goals': 'Tabungan & Tujuan',
  '#/trends': 'Tren 6 Bulan',
  '#/report': 'Laporan Bulanan',
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
      drawTrend(canvas, months);
    }
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

function applyExpenseFilter() {
  const category = document.getElementById('filter-category').value;
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
      if (!fields.name || !Number.isFinite(target) || target < 10000 || !Number.isFinite(saved) || saved < 0) return;
      const palette = ['#0f766e', '#0284c7', '#ca8a04', '#db2777', '#7c3aed'];
      state.goals.push({
        id: 'g' + Date.now().toString(36),
        name: fields.name.trim(),
        detail: (fields.detail || 'Tujuan baru keluarga').trim(),
        target,
        saved,
        color: palette[state.goals.length % palette.length],
      });
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
  const button = event.target.closest('[data-action="delete-expense"]');
  if (!button) return;
  state.expenses = state.expenses.filter((e) => e.id !== button.dataset.id);
  saveState(state);
  render();
});

window.addEventListener('hashchange', render);
window.addEventListener('resize', () => drawCharts(location.hash || '#/'));
render();
