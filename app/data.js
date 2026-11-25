// Dompet Rumah — household budget data and state.
//
// One household, one month, real figures in rupiah. Everything the pages
// show comes from this file: income, the category budgets, every expense
// line, the savings goals and the six-month history. Edits the household
// makes in the browser (a new expense, a changed budget, a deposit into a
// goal) are saved to localStorage and reloaded on the next visit, so the
// numbers the family sees are always their own latest numbers.

const MONTH_LABEL = 'November 2026';
const HOUSEHOLD_NAME = 'Keluarga Pratama';
const CURRENCY = 'Rp';

const STORAGE_KEY = 'dompet-rumah-v1';

const seedState = {
  income: [
    { source: 'Gaji — Ayah (kantor)', amount: 7000000 },
    { source: 'Usaha sampingan — Ibu (katering)', amount: 1500000 },
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
    { id: 'g1', name: 'Dana Darurat', detail: '6 bulan biaya hidup, untuk keadaan tak terduga', target: 10000000, saved: 6400000, color: '#0f766e' },
    { id: 'g2', name: 'Liburan Keluarga ke Bali', detail: 'Berangkat Juni 2027, 4 orang', target: 5000000, saved: 2150000, color: '#0284c7' },
    { id: 'g3', name: 'Motor Baru', detail: 'Ganti motor lama yang sering mogok', target: 15000000, saved: 4800000, color: '#ca8a04' },
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
