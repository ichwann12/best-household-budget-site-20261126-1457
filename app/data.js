// Dompet Rumah — household budget data and state.
//
// One household, one month, real figures in rupiah. Everything the pages
// show comes from this file: the income entries, the category budgets,
// every expense line, the savings goals and the six-month history. Edits
// the household makes in the browser (a new expense, a changed budget, a
// deposit into a goal, a new income entry, a monthly deposit per goal)
// are saved to localStorage and reloaded on the next visit, so the
// numbers the family sees are always their own latest numbers.

const MONTH_LABEL = 'November 2026';
const HOUSEHOLD_NAME = 'Keluarga Pratama';
const CURRENCY = 'Rp';

const STORAGE_KEY = 'dompet-rumah-v1';

const seedState = {
  // Pemasukan bukan satu angka tetap: daftar sumber uang masuk bulan ini,
  // masing-masing dengan tanggal dan jumlah. Total pemasukan di semua
  // halaman selalu dihitung dari daftar ini (lihat totalIncome).
  income: [
    { id: 'i01', date: '2026-11-01', source: 'Gaji — Ayah (kantor)', amount: 7000000 },
    { id: 'i02', date: '2026-11-03', source: 'Usaha sampingan — Ibu (katering)', amount: 1500000 },
    { id: 'i03', date: '2026-11-15', source: 'Freelance desain — Ayah', amount: 750000 },
  ],
  // budget = the plan for the month; spent is always computed from the
  // expense lines below, never typed in by hand.
  categories: [
    { id: 'housing', name: 'Rumah & Sewa', budget: 2500000, color: '#0f766e', icon: '⌂' },
    { id: 'groceries', name: 'Belanja Harian', budget: 1800000, color: '#65a30d', icon: '🧺' },
    { id: 'utilities', name: 'Listrik, Air & Internet', budget: 650000, color: '#0284c7', icon: '💡' },
    { id: 'transport', name: 'Transportasi', budget: 700000, color: '#7c3aed', icon: '🛵' },
    { id: 'dining', name: 'Makan di Luar', budget: 450000, color: '#ea580c', icon: '🍜' },
    { id: 'health', name: 'Kesehatan', budget: 400000, color: '#db2777', icon: '✚' },
    { id: 'education', name: 'Pendidikan Anak', budget: 500000, color: '#ca8a04', icon: '✎' },
    { id: 'entertainment', name: 'Hiburan', budget: 300000, color: '#0891b2', icon: '♪' },
    { id: 'other', name: 'Lain-lain', budget: 300000, color: '#64748b', icon: '•' },
  ],
  expenses: [
    { id: 'e01', date: '2026-11-01', category: 'housing', note: 'Sewa rumah bulan November', amount: 2500000 },
    { id: 'e02', date: '2026-11-02', category: 'groceries', note: 'Pasar tradisional — sayur & lauk', amount: 486000 },
    { id: 'e03', date: '2026-11-03', category: 'transport', note: 'Bensin motor (2x isi)', amount: 240000 },
    { id: 'e04', date: '2026-11-04', category: 'utilities', note: 'Token listrik PLN', amount: 312000 },
    { id: 'e05', date: '2026-11-05', category: 'dining', note: 'Makan malam keluarga di warteg', amount: 85000 },
    { id: 'e06', date: '2026-11-07', category: 'groceries', note: 'Supermarket — beras, minyak, telur', amount: 512500 },
    { id: 'e07', date: '2026-11-08', category: 'education', note: 'SPP sekolah anak', amount: 350000 },
    { id: 'e08', date: '2026-11-09', category: 'health', note: 'Apotek — vitamin & obat flu', amount: 250000 },
    { id: 'e09', date: '2026-11-10', category: 'transport', note: 'Ojek online ke kantor (mingguan)', amount: 150000 },
    { id: 'e10', date: '2026-11-11', category: 'dining', note: 'Jajan bakso & es teh', amount: 120000 },
    { id: 'e11', date: '2026-11-12', category: 'utilities', note: 'Tagihan air PDAM', amount: 185000 },
    { id: 'e12', date: '2026-11-14', category: 'groceries', note: 'Pasar — buah & daging ayam', amount: 298000 },
    { id: 'e13', date: '2026-11-15', category: 'entertainment', note: 'Langganan streaming film', amount: 99000 },
    { id: 'e14', date: '2026-11-16', category: 'dining', note: 'Nasi padang kantor', amount: 64000 },
    { id: 'e15', date: '2026-11-18', category: 'transport', note: 'Bensin motor', amount: 185000 },
    { id: 'e16', date: '2026-11-19', category: 'education', note: 'Buku & alat tulis anak', amount: 120000 },
    { id: 'e17', date: '2026-11-20', category: 'groceries', note: 'Pasar — mingguan', amount: 345500 },
    { id: 'e18', date: '2026-11-21', category: 'utilities', note: 'Internet rumah (WiFi)', amount: 120000 },
    { id: 'e19', date: '2026-11-22', category: 'dining', note: 'Makan siang keluarga di mall', amount: 145000 },
    { id: 'e20', date: '2026-11-23', category: 'entertainment', note: 'Nonton bioskop berdua', amount: 150000 },
    { id: 'e21', date: '2026-11-24', category: 'health', note: 'Periksa ke klinik', amount: 125000 },
    { id: 'e22', date: '2026-11-24', category: 'dining', note: 'Kopi & roti pagi', amount: 98000 },
    { id: 'e23', date: '2026-11-25', category: 'transport', note: 'Parkir & tol', amount: 96000 },
    { id: 'e24', date: '2026-11-25', category: 'other', note: 'Servis kipas angin', amount: 85000 },
    { id: 'e25', date: '2026-11-26', category: 'other', note: 'Pulsa & paket data', amount: 120000 },
  ],
  goals: [
    // monthly = setoran rutin tiap bulan untuk tujuan ini; dari angka
    // inilah halaman Tabungan memperkirakan kapan target tercapai.
    { id: 'g1', name: 'Dana Darurat', detail: '6 bulan biaya hidup, untuk keadaan tak terduga', target: 10000000, saved: 6400000, monthly: 900000, color: '#0f766e' },
    { id: 'g2', name: 'Liburan Keluarga ke Bali', detail: 'Berangkat Juni 2027, 4 orang', target: 5000000, saved: 2150000, monthly: 500000, color: '#0284c7' },
    { id: 'g3', name: 'Motor Baru', detail: 'Ganti motor lama yang sering mogok', target: 15000000, saved: 4800000, monthly: 600000, color: '#ca8a04' },
  ],
  // Six months of history for the trend page (income vs money actually spent).
  history: [
    { month: 'Jun 2026', income: 8500000, spent: 7050000 },
    { month: 'Jul 2026', income: 8500000, spent: 7480000 },
    { month: 'Agu 2026', income: 8800000, spent: 7120000 },
    { month: 'Sep 2026', income: 8500000, spent: 7620000 },
    { month: 'Okt 2026', income: 8500000, spent: 7350000 },
    { month: 'Nov 2026', income: 8500000, spent: 7241000 },
  ],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedState);
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.categories)) {
      return structuredClone(seedState);
    }
    // Migrasi data lama: pemasukan tanpa id/tanggal dan tujuan tanpa
    // setoran bulanan dilengkapkan dengan nilai wajar, supaya data yang
    // tersimpan sebelum fitur ini tetap bisa dipakai.
    if (!Array.isArray(parsed.income)) parsed.income = structuredClone(seedState.income);
    parsed.income = parsed.income.map((line, index) => ({
      id: line.id || 'i' + Date.now().toString(36) + index,
      date: typeof line.date === 'string' && line.date ? line.date : '2026-11-01',
      source: String(line.source || 'Pemasukan lain'),
      amount: Number(line.amount) || 0,
    }));
    if (Array.isArray(parsed.goals)) {
      for (const goal of parsed.goals) {
        if (!Number.isFinite(Number(goal.monthly)) || Number(goal.monthly) < 0) goal.monthly = 0;
        goal.monthly = Math.round(Number(goal.monthly));
      }
    }
    return parsed;
  } catch {
    return structuredClone(seedState);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full: the site keeps working in memory.
  }
}

function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  return structuredClone(seedState);
}

// ---- Derived figures: every total on the site comes from these. ----

function totalIncome(state) {
  return state.income.reduce((sum, line) => sum + line.amount, 0);
}

function spentByCategory(state) {
  const spent = {};
  for (const category of state.categories) spent[category.id] = 0;
  for (const expense of state.expenses) {
    if (expense.category in spent) spent[expense.category] += expense.amount;
  }
  return spent;
}

function totalSpent(state) {
  return state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function totalBudget(state) {
  return state.categories.reduce((sum, category) => sum + category.budget, 0);
}

function remaining(state) {
  return totalIncome(state) - totalSpent(state);
}

function savingsRate(state) {
  const income = totalIncome(state);
  return income > 0 ? (remaining(state) / income) * 100 : 0;
}

// ---- Proyeksi akhir bulan: dari belanja yang tercatat sampai hari ini. ----

// November 2026 punya 30 hari. "Hari ini" untuk proyeksi adalah tanggal
// pengeluaran terakhir yang tercatat (26 Nov pada data contoh), jadi
// proyeksi selalu mengikuti catatan terbaru, bukan tanggal kalender.
const DAYS_IN_MONTH = 30;

function latestExpenseDay(state) {
  let day = 1;
  for (const expense of state.expenses) {
    const d = Number(expense.date.slice(8, 10));
    if (Number.isFinite(d) && d > day) day = d;
  }
  return day;
}

function daysLeftInMonth(state) {
  return Math.max(0, DAYS_IN_MONTH - latestExpenseDay(state));
}

// Proyeksi tiap kategori ke akhir bulan: laju harian sejauh ini x 30 hari.
function projectMonthEnd(state) {
  const spent = spentByCategory(state);
  const days = latestExpenseDay(state);
  return state.categories.map((category) => {
    const used = spent[category.id];
    const projected = days > 0 ? (used / days) * DAYS_IN_MONTH : used;
    return {
      category,
      spent: used,
      budget: category.budget,
      projected: Math.round(projected),
      diff: Math.round(projected) - category.budget,
    };
  });
}

function projectedTotalSpent(state) {
  return projectMonthEnd(state).reduce((sum, row) => sum + row.projected, 0);
}

// Sisa anggaran yang aman dibelanjakan per hari sampai akhir bulan:
// (total anggaran - sudah dibelanjakan) / hari tersisa. Bisa negatif kalau
// anggaran bulan ini sudah terlampaui — itu sinyal, bukan kesalahan hitung.
function safeDailySpend(state) {
  const left = daysLeftInMonth(state);
  if (left <= 0) return totalBudget(state) - totalSpent(state);
  return (totalBudget(state) - totalSpent(state)) / left;
}

function formatRupiah(amount) {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function formatShort(amount) {
  if (amount >= 1000000) return 'Rp ' + (amount / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt';
  if (amount >= 1000) return 'Rp ' + Math.round(amount / 1000) + ' rb';
  return 'Rp ' + Math.round(amount);
}

function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${names[month - 1]} ${year}`;
}

// Perbandingan dengan bulan lalu (Oktober 2026, dari history): berapa
// pengeluaran bulan ini dibanding bulan sebelumnya, dan selisihnya.
function previousMonthComparison(state) {
  const previous = state.history[state.history.length - 2];
  if (!previous) return null;
  const current = totalSpent(state);
  return {
    month: previous.month,
    previousSpent: previous.spent,
    currentSpent: current,
    diff: current - previous.spent,
    pct: previous.spent > 0 ? ((current - previous.spent) / previous.spent) * 100 : 0,
  };
}

// Laju belanja harian tiap kategori sejauh ini — dipakai tabel proyeksi
// supaya keluarga melihat berapa rupiah per hari yang "membakar" anggaran.
function dailyPaceByCategory(state) {
  const spent = spentByCategory(state);
  const days = latestExpenseDay(state);
  const pace = {};
  for (const category of state.categories) {
    pace[category.id] = days > 0 ? spent[category.id] / days : 0;
  }
  return pace;
}
// Ringkasan singkat sumber pemasukan untuk kartu statistik, misal
// "Gaji Rp 7 jt + katering Rp 1,5 jt + freelance Rp 750 rb" — selalu
// dihitung dari daftar pemasukan, bukan teks yang ditulis tangan.
function incomeSummary(state) {
  if (!state.income.length) return 'belum ada pemasukan tercatat';
  return state.income
    .map((line) => {
      const short = line.source.split('—')[0].trim().toLowerCase();
      return `${short} ${formatShort(line.amount)}`;
    })
    .join(' + ');
}

// ---- Belanja mingguan: pengeluaran November dikelompokkan per minggu. ----

// Minggu 1 = tanggal 1–7, Minggu 2 = 8–14, Minggu 3 = 15–21,
// Minggu 4 = 22–30. Tiap minggu mencatat total, kategori terbesar, dan
// satu pengeluaran terbesar — dipakai tabel dan grafik di halaman Tren.
function weeklyBreakdown(state) {
  const weeks = [1, 2, 3, 4].map((n) => ({
    week: n,
    label: 'Minggu ' + n,
    range: ['1–7 Nov', '8–14 Nov', '15–21 Nov', '22–30 Nov'][n - 1],
    total: 0,
    expenses: [],
    byCategory: {},
  }));
  for (const expense of state.expenses) {
    const day = Number(expense.date.slice(8, 10));
    if (!Number.isFinite(day) || day < 1 || day > 30) continue;
    const bucket = weeks[Math.min(3, Math.floor((day - 1) / 7))];
    bucket.total += expense.amount;
    bucket.expenses.push(expense);
    bucket.byCategory[expense.category] = (bucket.byCategory[expense.category] || 0) + expense.amount;
  }
  return weeks.map((week) => {
    const biggest = Object.entries(week.byCategory)
      .sort((a, b) => b[1] - a[1])[0];
    const biggestCategory = biggest
      ? state.categories.find((c) => c.id === biggest[0])
      : null;
    const top = [...week.expenses].sort((a, b) => b.amount - a.amount)[0] || null;
    // Rata-rata belanja harian minggu itu, supaya keluarga bisa
    // membandingkan minggu yang panjang (Minggu 4 = 9 hari) dengan yang
    // lain secara adil.
    const daysInWeek = week.week === 4 ? 9 : 7;
    return {
      week: week.week,
      label: week.label,
      range: week.range,
      total: week.total,
      count: week.expenses.length,
      dailyAverage: week.total / daysInWeek,
      biggestCategory: biggestCategory ? biggestCategory.name : '—',
      biggestCategoryAmount: biggest ? biggest[1] : 0,
      topExpense: top ? { note: top.note, amount: top.amount, date: top.date } : null,
    };
  });
}

// ---- Perkiraan tercapai untuk tiap tujuan tabungan. ----

// months = ceil((target - saved) / setoran bulanan). Kalau target sudah
// tercapai hasilnya 'done'; kalau belum ada setoran bulanan, 'unknown'
// supaya halaman tidak menampilkan angka yang dibuat-buat.
function goalEstimate(goal) {
  const left = goal.target - goal.saved;
  if (left <= 0) return { status: 'done', months: 0, left: 0 };
  const monthly = Number(goal.monthly) || 0;
  if (monthly <= 0) return { status: 'unknown', months: null, left };
  return { status: 'ok', months: Math.ceil(left / monthly), left };
}

// Nama bulan saat perkiraan tercapai, dihitung dari November 2026:
// misal 3 bulan lagi = "Feb 2027".
function estimateMonthLabel(months) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const baseMonth = 10; // November (0-based)
  const baseYear = 2026;
  const total = baseMonth + months;
  return `${names[total % 12]} ${baseYear + Math.floor(total / 12)}`;
}

// CSV export for the monthly report page: one row per expense, newest
// first, notes quoted so commas and quotes inside a note stay intact.
function buildExpensesCsv(state) {
  const header = 'Tanggal,Catatan,Kategori,Jumlah (Rp)';
  const lines = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .map((expense) => {
      const category = state.categories.find((c) => c.id === expense.category);
      const note = '"' + String(expense.note).replace(/"/g, '""') + '"';
      return [expense.date, note, category ? category.name : expense.category, expense.amount].join(',');
    });
  return [header, ...lines].join('\n');
}
