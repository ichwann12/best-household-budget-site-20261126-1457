// Dompet Rumah — the pages.
//
// Six hash pages, each one a real tool the household uses, reached from
// the top navigation on every page:
//   #/           Dashboard — the month at a glance, with a month-end projection
//   #/expenses   Catat Belanja — every expense line, with an add form
//   #/budget     Anggaran — budget vs actual per category
//   #/goals      Tabungan — savings goals with deposits
//   #/trends     Tren — six months of income vs spending
//   #/report     Laporan — monthly summary per category, with CSV export
//
// Every figure is rendered from the live state (see data.js), so a new
// expense, a changed budget or a deposit redraws every page at once.


const NAV = [
  ['#/', 'Dasbor'],
  ['#/expenses', 'Catat Belanja'],
  ['#/budget', 'Anggaran'],
  ['#/goals', 'Tabungan'],
  ['#/trends', 'Tren'],
  ['#/report', 'Laporan'],
];

function incomeSection(state) {
  const sorted = [...state.income].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const rows = sorted.map((line) => `<tr>
    <td>${formatDate(line.date)}</td>
    <td>${escapeHtml(line.source)}</td>
    <td class="amount">${formatRupiah(line.amount)}</td>
    <td><button class="btn-small danger-outline" data-action="delete-income" data-id="${line.id}" aria-label="Hapus ${escapeHtml(line.source)}">Hapus</button></td>
  </tr>`).join('');
  return `<section class="card" aria-label="Pemasukan bulan ini">
    <h2>Pemasukan — ${MONTH_LABEL} <span class="total-pill">Total ${formatRupiah(totalIncome(state))}</span></h2>
    <p class="hint">Uang masuk bulan ini dari semua sumber. Tambah pemasukan baru di bawah — total pemasukan di dasbor, laporan, dan tren langsung mengikuti.</p>
    <div class="table-scroll"><table class="table"><thead><tr><th>Tanggal</th><th>Sumber</th><th>Jumlah</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Belum ada pemasukan yang dicatat.</td></tr>'}</tbody></table></div>
    <h2 class="sub">Tambah Pemasukan</h2>
    <form id="add-income" class="form-grid">
      <label>Sumber pemasukan <input name="source" required maxlength="60" placeholder="cth. Gaji, katering, freelance"></label>
      <label>Tanggal <input name="date" type="date" value="2026-11-26" required></label>
      <label>Jumlah (Rp) <input name="amount" type="number" min="1000" step="500" required placeholder="500000"></label>
      <button class="btn primary" type="submit">+ Tambah Pemasukan</button>
    </form>
    <p class="hint" id="income-status" role="status"></p>
  </section>`;
}

function projectionPanel(state) {
  const rows = projectMonthEnd(state);
  const pace = dailyPaceByCategory(state);
  const days = latestExpenseDay(state);
  const left = daysLeftInMonth(state);
  const safe = safeDailySpend(state);
  const projectedTotal = projectedTotalSpent(state);
  const budgetTotal = totalBudget(state);
  const totalDiff = projectedTotal - budgetTotal;
  const overCount = rows.filter((r) => r.diff > 0).length;
  return `<section class="card projection" aria-label="Proyeksi akhir bulan">
    <h2>Proyeksi Akhir Bulan</h2>
    <p class="hint">Dihitung dari belanja 1–${days} Nov 2026: laju harian tiap kategori × 30 hari. Bukan ramalan — sekadar gambaran kalau pola belanja sekarang terus sampai akhir bulan.</p>
    <div class="projection-summary">
      <div class="proj-stat"><span class="stat-label">Sisa harian yang aman</span><strong class="stat-value ${safe < 0 ? 'negative' : ''}">${formatRupiah(safe)}<span class="per-day">/hari</span></strong><span class="stat-note">${left} hari tersisa di November</span></div>
      <div class="proj-stat"><span class="stat-label">Proyeksi total belanja</span><strong class="stat-value">${formatRupiah(projectedTotal)}</strong><span class="stat-note">anggaran ${formatRupiah(budgetTotal)} · ${totalDiff > 0 ? 'lebih ' + formatRupiah(totalDiff) : 'di bawah ' + formatRupiah(-totalDiff)}</span></div>
      <div class="proj-stat"><span class="stat-label">Kategori berisiko lewat</span><strong class="stat-value">${overCount} dari ${rows.length}</strong><span class="stat-note">proyeksi melebihi anggaran</span></div>
    </div>
    <div class="table-scroll"><table class="table projection-table"><thead><tr><th>Kategori</th><th>Realisasi</th><th>Laju/hari</th><th>Proyeksi 30 Nov</th><th>Anggaran</th><th>Selisih</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>
      <td><span class="dot" style="background:${r.category.color}"></span> ${r.category.name}</td>
      <td class="amount">${formatRupiah(r.spent)}</td>
      <td class="amount">${formatRupiah(pace[r.category.id])}</td>
      <td class="amount">${formatRupiah(r.projected)}</td>
      <td class="amount">${formatRupiah(r.budget)}</td>
      <td class="amount ${r.diff > 0 ? 'negative' : 'positive'}">${r.diff > 0 ? '+' : ''}${formatRupiah(r.diff)}</td>
    </tr>`).join('')}</tbody></table></div>
    <p class="hint">Catatan: Sewa rumah dibayar lunas tanggal 1, jadi proyeksi Rumah &amp; Sewa terlihat tinggi — itu biaya tetap yang sudah selesai, bukan belanja harian yang masih berjalan.</p>
  </section>`;
}

function nav(active) {
  return `<nav class="nav" aria-label="Navigasi utama">${NAV.map(([href, label]) =>
    `<a class="nav-link${href === active ? ' active' : ''}" href="${href}">${label}</a>`).join('')}</nav>`;
}

function statCards(state) {
  const income = totalIncome(state);
  const spent = totalSpent(state);
  const left = remaining(state);
  const rate = savingsRate(state);
  return `<section class="stats" aria-label="Ringkasan bulan ini">
    <div class="stat"><span class="stat-label">Pemasukan</span><strong class="stat-value">${formatRupiah(income)}</strong><span class="stat-note">${state.income.length} sumber · ${incomeSummary(state)}</span></div>
    <div class="stat"><span class="stat-label">Pengeluaran</span><strong class="stat-value">${formatRupiah(spent)}</strong><span class="stat-note">${state.expenses.length} catatan belanja</span></div>
    <div class="stat ${left < 0 ? 'danger' : ''}"><span class="stat-label">Sisa Uang</span><strong class="stat-value">${formatRupiah(left)}</strong><span class="stat-note">dari pemasukan ${formatShort(income)}</span></div>
    <div class="stat"><span class="stat-label">Tingkat Menabung</span><strong class="stat-value">${rate.toFixed(1).replace('.', ',')}%</strong><span class="stat-note">target keluarga: 15%</span></div>
  </section>`;
}

function categoryLegend(state, spent) {
  return state.categories
    .filter((category) => spent[category.id] > 0)
    .sort((a, b) => spent[b.id] - spent[a.id])
    .map((category) => {
      return `<li><span class="dot" style="background:${category.color}"></span><span class="legend-text"><span class="legend-name">${category.name}</span><span class="legend-amount">${formatRupiah(spent[category.id])}</span></span></li>`;
    }).join('');
}

function expenseRow(expense, state, withDelete) {
  const category = state.categories.find((c) => c.id === expense.category);
  return `<tr>
    <td>${formatDate(expense.date)}</td>
    <td>${expense.note}</td>
    <td><span class="chip" style="--chip:${category ? category.color : '#64748b'}">${category ? category.name : expense.category}</span></td>
    <td class="amount">${formatRupiah(expense.amount)}</td>
    ${withDelete ? `<td><button class="btn-small danger-outline" data-action="delete-expense" data-id="${expense.id}" aria-label="Hapus ${expense.note}">Hapus</button></td>` : ''}
  </tr>`;
}

function dashboard(state) {
  const spent = spentByCategory(state);
  const recent = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const over = state.categories.filter((c) => spent[c.id] > c.budget);
  return `
  <h1>Dasbor Anggaran — ${MONTH_LABEL}</h1>
  <p class="lede">Uang masuk, uang keluar, dan sisa untuk ditabung — dihitung dari catatan belanja keluarga.</p>
  ${statCards(state)}
  ${over.length ? `<p class="alert">⚠ Lewat anggaran: ${over.map((c) => `${c.name} (${formatRupiah(spent[c.id] - c.budget)} di atas batas)`).join(', ')}. Lihat <a href="#/budget">halaman Anggaran</a> untuk menyesuaikan.</p>` : ''}
  ${projectionPanel(state)}
  ${incomeSection(state)}
  <div class="grid-2">
    <section class="card">
      <h2>Belanja per Kategori</h2>
      <div class="donut-wrap"><canvas id="donut" role="img" aria-label="Diagram lingkaran belanja per kategori"></canvas></div>
      <ul class="legend">${categoryLegend(state, spent)}</ul>
    </section>
    <section class="card">
      <h2>Belanja Terakhir</h2>
      <table class="table"><thead><tr><th>Tanggal</th><th>Catatan</th><th>Kategori</th><th>Jumlah</th></tr></thead>
      <tbody>${recent.map((e) => expenseRow(e, state, false)).join('')}</tbody></table>
      <p class="card-foot"><a class="btn" href="#/expenses">Lihat semua ${state.expenses.length} catatan →</a></p>
      <h2 class="sub">Catat Belanja Cepat</h2>
      <form id="quick-add" class="form-inline">
        <label>Catatan <input name="note" required maxlength="80" placeholder="cth. Belanja sayur pasar"></label>
        <label>Jumlah (Rp) <input name="amount" type="number" min="1000" step="500" required placeholder="50000"></label>
        <label>Kategori <select name="category">${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
        <button class="btn primary" type="submit">+ Tambah</button>
      </form>
      <p class="hint" id="add-status" role="status"></p>
      <p class="hint">Tersimpan di perangkat ini dan langsung mengubah total, diagram, dan halaman Anggaran.</p>
    </section>
  </div>`;
}

function expensesPage(state) {
  const sorted = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return `
  <h1>Catat Belanja</h1>
  <p class="lede">Setiap rupiah yang keluar dicatat di sini. Tambah baris baru, saring per kategori, atau hapus catatan yang salah — total di bawah selalu mengikuti.</p>
  <section class="card">
    <h2>Tambah Pengeluaran Baru</h2>
    <form id="add-expense" class="form-grid">
      <label>Tanggal <input name="date" type="date" value="2026-11-26" required></label>
      <label>Catatan <input name="note" required maxlength="80" placeholder="cth. Beli beras 5 kg"></label>
      <label>Kategori <select name="category">${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
      <label>Jumlah (Rp) <input name="amount" type="number" min="1000" step="500" required placeholder="100000"></label>
      <button class="btn primary" type="submit">Simpan Pengeluaran</button>
    </form>
    <p class="hint" id="add-status" role="status"></p>
  </section>
  <section class="card">
    <h2>Semua Pengeluaran — ${MONTH_LABEL} <span class="total-pill">Total ${formatRupiah(totalSpent(state))}</span></h2>
    <div class="filter-row">
      <label>Saring kategori:
        <select id="filter-category">
          <option value="">Semua kategori</option>
          ${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </label>
      <label>Cari catatan:
        <input id="filter-search" type="search" placeholder="cth. pasar, bensin, SPP">
      </label>
      <button class="btn" id="reset-data" type="button">Kembalikan contoh awal</button>
    </div>
    <table class="table"><thead><tr><th>Tanggal</th><th>Catatan</th><th>Kategori</th><th>Jumlah</th><th></th></tr></thead>
    <tbody id="expense-rows">${sorted.map((e) => expenseRow(e, state, true)).join('')}</tbody></table>
    <p class="card-foot"><span id="expense-count">${sorted.length} catatan</span> · Total yang tampil: <strong id="expense-total">${formatRupiah(totalSpent(state))}</strong></p>
  </section>`;
}

function budgetPage(state) {
  const spent = spentByCategory(state);
  const rows = state.categories.map((category) => {
    const used = spent[category.id];
    const pct = category.budget > 0 ? (used / category.budget) * 100 : 0;
    const status = pct > 100 ? 'over' : pct === 100 ? 'ok' : pct > 85 ? 'near' : 'ok';
    const statusText = pct > 100 ? 'Lewat anggaran' : pct === 100 ? 'Tepat anggaran' : pct > 85 ? 'Hampir habis' : 'Aman';
    return `<article class="budget-row">
      <div class="budget-head"><span class="budget-icon" style="background:${category.color}">${category.icon}</span>
        <div><strong>${category.name}</strong><span class="budget-figures">${formatRupiah(used)} dari ${formatRupiah(category.budget)}</span></div>
        <span class="budget-status ${status}">${statusText} · ${pct.toFixed(0)}%</span></div>
      <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="Anggaran ${category.name}"><div class="bar-fill ${status}" style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="budget-edit"><label>Ubah anggaran (Rp) <input type="number" min="0" step="10000" value="${category.budget}" data-action="budget-input" data-id="${category.id}"></label>
      <span class="budget-left">${category.budget - used >= 0 ? 'Sisa ' + formatRupiah(category.budget - used) : 'Lebih ' + formatRupiah(used - category.budget)}</span></div>
    </article>`;
  }).join('');
  return `
  <h1>Anggaran vs Realisasi</h1>
  <p class="lede">Rencana belanja keluarga untuk ${MONTH_LABEL}: total anggaran <strong>${formatRupiah(totalBudget(state))}</strong> dari pemasukan <strong>${formatRupiah(totalIncome(state))}</strong>. Ubah angka anggaran di bawah — bilah dan status langsung mengikuti.</p>
  ${statCards(state)}
  <section class="card">
    <h2>Per Kategori</h2>
    ${rows}
  </section>
  <p class="hint">Realisasi dihitung dari catatan belanja, bukan diketik manual — jadi angka di sini tidak pernah berbeda dengan halaman Catat Belanja.</p>`;
}

function goalsPage(state) {
  const cards = state.goals.map((goal) => {
    const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
    const left = goal.target - goal.saved;
    const estimate = goalEstimate(goal);
    const estimateText = estimate.status === 'done'
      ? '🎉 Target tercapai — tidak perlu setoran lagi.'
      : estimate.status === 'ok'
        ? `Perkiraan tercapai: <strong>±${estimate.months} bulan</strong> (sekitar ${estimateMonthLabel(estimate.months)}) dengan setoran ${formatRupiah(goal.monthly)}/bulan.`
        : 'Isi setoran/bulan di bawah untuk melihat perkiraan kapan target tercapai.';
    return `<article class="card goal-card">
      <h2>${goal.name}</h2>
      <p class="goal-detail">${goal.detail}</p>
      <p class="goal-figures"><strong>${formatRupiah(goal.saved)}</strong> dari ${formatRupiah(goal.target)}</p>
      <div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="Tabungan ${goal.name}"><div class="bar-fill goal" style="width:${Math.min(pct, 100)}%;background:${goal.color}"></div></div>
      <p class="goal-pct">${pct.toFixed(0)}% tercapai · ${left > 0 ? 'kurang ' + formatRupiah(left) : 'target tercapai 🎉'}</p>
      <p class="goal-estimate">${estimateText}</p>
      <form class="form-inline goal-deposit" data-goal="${goal.id}">
        <label>Tambah tabungan (Rp) <input name="amount" type="number" min="1000" step="1000" required placeholder="100000"></label>
        <button class="btn primary" type="submit">+ Nabung</button>
      </form>
      <form class="form-inline goal-monthly">
        <label>Setoran/bulan (Rp) <input type="number" min="0" step="10000" value="${goal.monthly || 0}" data-action="monthly-input" data-id="${goal.id}" aria-label="Setoran bulanan untuk ${goal.name}"></label>
        <span class="hint">Diubah otomatis tersimpan; perkiraan di atas langsung mengikuti.</span>
      </form>
    </article>`;
  }).join('');
  const totalSaved = state.goals.reduce((sum, g) => sum + g.saved, 0);
  const totalTarget = state.goals.reduce((sum, g) => sum + g.target, 0);
  return `
  <h1>Tabungan &amp; Tujuan</h1>
  <p class="lede">Tiga tujuan keluarga: total sudah terkumpul <strong>${formatRupiah(totalSaved)}</strong> dari target <strong>${formatRupiah(totalTarget)}</strong>. Masukkan jumlah ke tiap tujuan — bilah kemajuan langsung bergerak.</p>
  <div class="grid-3">${cards}</div>
  <section class="card">
    <h2>Buat Tujuan Baru</h2>
    <form id="add-goal" class="form-grid">
      <label>Nama tujuan <input name="name" required maxlength="60" placeholder="cth. DP rumah"></label>
      <label>Target (Rp) <input name="target" type="number" min="10000" step="10000" required placeholder="20000000"></label>
      <label>Sudah terkumpul (Rp) <input name="saved" type="number" min="0" step="10000" value="0" required></label>
      <label>Setoran/bulan (Rp) <input name="monthly" type="number" min="0" step="10000" value="0" placeholder="cth. 500000"></label>
      <label>Keterangan <input name="detail" maxlength="100" placeholder="cth. Target akhir 2027"></label>
      <button class="btn primary" type="submit">Buat Tujuan</button>
    </form>
    <p class="hint">Sisa uang bulan ini ${formatRupiah(remaining(state))} — cukup untuk menambah tabungan tanpa mengganggu anggaran.</p>
  </section>`;
}

function reportPage(state) {
  const spent = spentByCategory(state);
  const income = totalIncome(state);
  const out = totalSpent(state);
  const left = remaining(state);
  const savedTotal = state.goals.reduce((sum, g) => sum + g.saved, 0);
  const rows = state.categories.map((category) => {
    const used = spent[category.id];
    const pct = category.budget > 0 ? (used / category.budget) * 100 : 0;
    const diff = used - category.budget;
    return `<tr>
      <td><span class="dot" style="background:${category.color}"></span> ${category.name}</td>
      <td class="amount">${formatRupiah(category.budget)}</td>
      <td class="amount">${formatRupiah(used)}</td>
      <td class="amount ${diff > 0 ? 'negative' : 'positive'}">${diff > 0 ? '+' : ''}${formatRupiah(diff)}</td>
      <td class="amount">${pct.toFixed(0)}%</td>
    </tr>`;
  }).join('');
  const totalPct = totalBudget(state) > 0 ? (out / totalBudget(state)) * 100 : 0;
  const compare = previousMonthComparison(state);
  const compareBlock = compare ? `
  <section class="card">
    <h2>Dibanding ${compare.month}</h2>
    <p>Bulan lalu keluarga menghabiskan <strong>${formatRupiah(compare.previousSpent)}</strong>; bulan ini sejauh ini <strong>${formatRupiah(compare.currentSpent)}</strong> — ${compare.diff <= 0 ? 'lebih hemat ' + formatRupiah(-compare.diff) : 'lebih boros ' + formatRupiah(compare.diff)} (${compare.pct.toFixed(1).replace('.', ',')}% dibanding bulan lalu). Sisa ${daysLeftInMonth(state)} hari lagi: menjaga laju di bawah ${formatRupiah(safeDailySpend(state))} per hari membuat bulan ini berakhir di bawah anggaran.</p>
  </section>` : '';
  return `
  <h1>Laporan Bulanan — ${MONTH_LABEL}</h1>
  <p class="lede">Ringkasan lengkap bulan ini untuk ${HOUSEHOLD_NAME}: pemasukan, pengeluaran per kategori, dan sisa untuk ditabung. Unduh catatan belanjanya sebagai CSV untuk arsip atau diolah di spreadsheet.</p>
  <section class="stats" aria-label="Ringkasan bulanan">
    <div class="stat"><span class="stat-label">Pemasukan</span><strong class="stat-value">${formatRupiah(income)}</strong><span class="stat-note">${state.income.length} sumber · ${incomeSummary(state)}</span></div>
    <div class="stat"><span class="stat-label">Pengeluaran</span><strong class="stat-value">${formatRupiah(out)}</strong><span class="stat-note">${state.expenses.length} catatan · ${totalPct.toFixed(0)}% dari anggaran</span></div>
    <div class="stat ${left < 0 ? 'danger' : ''}"><span class="stat-label">Sisa Uang</span><strong class="stat-value">${formatRupiah(left)}</strong><span class="stat-note">tersedia untuk ditabung</span></div>
    <div class="stat"><span class="stat-label">Total Tabungan</span><strong class="stat-value">${formatRupiah(savedTotal)}</strong><span class="stat-note">${state.goals.length} tujuan aktif</span></div>
  </section>
  ${incomeSection(state)}
  <section class="card">
    <h2>Per Kategori — Anggaran vs Realisasi</h2>
    <div class="table-scroll"><table class="table"><thead><tr><th>Kategori</th><th>Anggaran</th><th>Realisasi</th><th>Selisih</th><th>% Anggaran</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td><strong>Total</strong></td><td class="amount"><strong>${formatRupiah(totalBudget(state))}</strong></td><td class="amount"><strong>${formatRupiah(out)}</strong></td><td class="amount"><strong>${formatRupiah(out - totalBudget(state))}</strong></td><td class="amount"><strong>${totalPct.toFixed(0)}%</strong></td></tr></tfoot></table></div>
  </section>
  ${compareBlock}
  <section class="card">
    <h2>Unduh Catatan Belanja</h2>
    <p>Seluruh ${state.expenses.length} baris pengeluaran bulan ini — tanggal, catatan, kategori, dan jumlah — dalam satu berkas CSV yang bisa dibuka di spreadsheet mana pun. Berkas dibuat langsung di perangkat Anda, tanpa mengunggah apa pun.</p>
    <p><button class="btn primary" id="download-csv" type="button">⬇ Unduh CSV (${state.expenses.length} catatan)</button></p>
    <p class="hint" id="csv-status" role="status"></p>
  </section>`;
}

function trendsPage(state) {
  const months = state.history.map((m) => ({ ...m }));
  months[months.length - 1].spent = totalSpent(state);
  months[months.length - 1].income = totalIncome(state);
  const best = months.reduce((bestMonth, m) => (m.income - m.spent > bestMonth.income - bestMonth.spent ? m : bestMonth), months[0]);
  const avgSpent = months.reduce((sum, m) => sum + m.spent, 0) / months.length;
  const weeks = weeklyBreakdown(state);
  const weekRows = weeks.map((w) => `<tr>
    <td><strong>${w.label}</strong><br><span class="week-range">${w.range}</span></td>
    <td class="amount">${formatRupiah(w.total)}</td>
    <td class="amount">${formatRupiah(w.dailyAverage)}/hari</td>
    <td>${w.biggestCategory} (${formatRupiah(w.biggestCategoryAmount)})</td>
    <td>${w.topExpense ? `${w.topExpense.note} — ${formatRupiah(w.topExpense.amount)}` : '—'}</td>
    <td class="amount">${w.count} catatan</td>
  </tr>`).join('');
  const busiest = [...weeks].sort((a, b) => b.total - a.total)[0];
  const rows = months.map((m) => {
    const saved = m.income - m.spent;
    return `<tr><td>${m.month}</td><td class="amount">${formatRupiah(m.income)}</td><td class="amount">${formatRupiah(m.spent)}</td><td class="amount ${saved >= 0 ? 'positive' : 'negative'}">${saved >= 0 ? '+' : ''}${formatRupiah(saved)}</td><td class="amount">${((saved / m.income) * 100).toFixed(1).replace('.', ',')}%</td></tr>`;
  }).join('');
  return `
  <h1>Tren 6 Bulan Terakhir</h1>
  <p class="lede">Pemasukan keluarga bulan ini ${formatRupiah(totalIncome(state))} dari ${state.income.length} sumber; yang berubah adalah pengeluarannya. Bulan paling hemat: <strong>${best.month}</strong> (sisa ${formatRupiah(best.income - best.spent)}). Rata-rata belanja: <strong>${formatRupiah(avgSpent)}</strong> per bulan.</p>
  <section class="card">
    <h2>Pemasukan vs Pengeluaran — Jun–Nov 2026</h2>
    <div class="chart-wrap"><canvas id="trend" role="img" aria-label="Grafik batang pemasukan dan pengeluaran enam bulan terakhir"></canvas></div>
    <p class="hint">Batang oranye bulan November dihitung dari catatan belanja saat ini — tambah pengeluaran dan grafik ini ikut berubah. Pemasukan November dihitung dari daftar pemasukan, sama seperti di dasbor.</p>
  </section>
  <section class="card">
    <h2>Belanja Mingguan — November 2026</h2>
    <p class="hint">Minggu paling boros sejauh ini: <strong>${busiest.label} (${busiest.range})</strong> dengan total ${formatRupiah(busiest.total)}. Grafik di bawah membandingkan keempat minggu; tabelnya menunjukkan kategori terbesar dan pengeluaran terbesar tiap minggu.</p>
    <div class="chart-wrap"><canvas id="weekly" role="img" aria-label="Grafik batang belanja per minggu di bulan November"></canvas></div>
    <div class="table-scroll"><table class="table"><thead><tr><th>Minggu</th><th>Total Belanja</th><th>Rata-rata/Hari</th><th>Kategori Terbesar</th><th>Pengeluaran Terbesar</th><th>Catatan</th></tr></thead>
    <tbody>${weekRows}</tbody></table></div>
  </section>
  <section class="card">
    <h2>Rincian per Bulan</h2>
    <table class="table"><thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Sisa</th><th>Menabung</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </section>
  <section class="card tips">
    <h2>Yang Bisa Dilakukan Bulan Depan</h2>
    <ul>
      <li><strong>Turunkan Makan di Luar</strong> — sudah ${formatRupiah(512000)} dari anggaran ${formatRupiah(450000)}. Masak 2 kali seminggu lagi menghemat sekitar Rp 150.000.</li>
      <li><strong>Pertahankan Belanja Harian</strong> — Rp 1.642.000 dari Rp 1.800.000: belanja pasar mingguan terbukti lebih murah daripada supermarket harian.</li>
      <li><strong>Otomatiskan tabungan</strong> — pindahkan Rp 900.000 ke Dana Darurat tiap tanggal 1, sebelum uang sempat terpakai.</li>
    </ul>
  </section>`;
}
