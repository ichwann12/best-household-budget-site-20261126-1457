// Dompet Rumah — charts drawn by hand on <canvas>.
//
// No chart library: two small drawing routines, one donut for the
// category breakdown and one grouped bar chart for the six-month trend.
// Both read the live state, so adding an expense redraws them at once.
// They scale for sharp screens (devicePixelRatio) and keep their labels
// inside the canvas so nothing is clipped.


// "8,5" for Rp 8.500.000 — the chart axis already names the unit (jt).
function shortMillions(amount) {
  return (amount / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

function setupCanvas(canvas, cssWidth, cssHeight) {  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

// Donut: one slice per category that has spending, with the total spent
// written in the middle. Slices under 3% get no outside label, only a
// legend entry, so the drawing never crowds.
function drawDonut(canvas, slices) {
  const width = canvas.parentElement.clientWidth || 320;
  const size = Math.min(width, 200);
  const ctx = setupCanvas(canvas, size, size);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 12;
  const inner = outer - 38;
  let angle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);
  if (total <= 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada pengeluaran', cx, cy);
    return;
  }
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    // White separator between slices.
    ctx.strokeStyle = '#faf7f2';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += sweep;
  }
  // Punch the hole.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = '#1c1917';
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(formatShort(total), cx, cy - 2);
  ctx.fillStyle = '#78716c';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('belanja bulan ini', cx, cy + 16);
}

// Grouped bars: income (teal) beside spending (amber) for each month,
// with the value on top of every bar. November is the live month, so its
// spending bar is drawn from the current state, not the frozen history.
function drawTrend(canvas, months) {
  const wrapWidth = canvas.parentElement.clientWidth || 640;
  const width = Math.min(wrapWidth, 720);
  const height = 300;
  const ctx = setupCanvas(canvas, width, height);
  const padLeft = 56;
  const padRight = 12;
  const padTop = 26;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxValue = Math.max(...months.map((m) => Math.max(m.income, m.spent))) * 1.1;

  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.textAlign = 'right';
  // Gridlines every Rp 2 jt.
  for (let value = 0; value <= maxValue; value += 2000000) {
    const y = padTop + plotH - (value / maxValue) * plotH;
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.fillText(value === 0 ? '0' : 'Rp ' + value / 1000000 + ' jt', padLeft - 8, y + 4);
  }

  const slot = plotW / months.length;
  const barW = Math.min(34, slot / 3.2);
  months.forEach((month, i) => {
    const x0 = padLeft + i * slot + slot / 2;
    const incomeH = (month.income / maxValue) * plotH;
    const spentH = (month.spent / maxValue) * plotH;
    const yIncome = padTop + plotH - incomeH;
    const ySpent = padTop + plotH - spentH;
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(x0 - barW - 3, yIncome, barW, incomeH);
    ctx.fillStyle = i === months.length - 1 ? '#d97706' : '#f59e0b';
    ctx.fillRect(x0 + 3, ySpent, barW, spentH);
    // Values sit inside the top of their own bar in white, short ("8,5"
    // means Rp 8,5 jt — the axis already says the unit), so they never
    // collide with the taller bar beside them.
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shortMillions(month.income), x0 - barW / 2 - 3, yIncome + 15);
    ctx.fillText(shortMillions(month.spent), x0 + barW / 2 + 3, ySpent + 15);
    ctx.fillStyle = '#57534e';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(month.month, x0, height - 10);
  });

  // Legend.
  ctx.textAlign = 'left';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(padLeft, 6, 12, 12);
  ctx.fillStyle = '#44403c';
  ctx.fillText('Pemasukan', padLeft + 18, 16);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(padLeft + 110, 6, 12, 12);
  ctx.fillStyle = '#44403c';
  ctx.fillText('Pengeluaran', padLeft + 128, 16);
}
