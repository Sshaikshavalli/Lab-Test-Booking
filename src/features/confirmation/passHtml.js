import { formatLongDate, formatDateTime } from '../../utils/dateUtils';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Standalone, printable booking pass (used for "Download pass"). */
export function buildPassHtml(b) {
  const rows = b.items.map((i) => `<tr><td>${esc(i.name)}<br><small>${esc(i.code)} · ${esc(i.sampleType)}</small></td><td class="r">₹${i.price.toLocaleString('en-IN')}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Booking pass ${esc(b.reference)}</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;color:#071226;margin:0;padding:32px;background:#f3f1ff}
.pass{max-width:640px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e1ff}
.top{background:#5b3fe0;color:#fff;padding:24px 28px}.top small{opacity:.8;letter-spacing:.14em;text-transform:uppercase}
.ref{font:600 30px ui-monospace,monospace;margin:6px 0 0}
.body{padding:24px 28px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 24px}
.grid b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#66748f;font-weight:600}
table{width:100%;border-collapse:collapse;margin-top:18px}td{padding:10px 0;border-top:1px solid #e5e1ff;vertical-align:top}.r{text-align:right;white-space:nowrap}
small{color:#66748f}.total td{font-weight:700;font-size:17px}.note{margin-top:18px;font-size:12px;color:#66748f}
</style></head><body><div class="pass">
<div class="top"><small>Lab Test Booking · Booking pass</small><p class="ref">${esc(b.reference)}</p><div>${esc(b.status)}</div></div>
<div class="body"><div class="grid">
<div><b>Patient</b>${esc(b.patient.fullName)}</div><div><b>Mobile</b>+91 ${esc(b.patient.mobile)}</div>
<div><b>Date</b>${esc(formatLongDate(b.date))}</div><div><b>Time slot</b>${esc(b.slotLabel)}</div>
<div><b>Laboratory</b>${esc(b.labName)}<br><small>Bengaluru</small></div>
<div><b>Collection</b>${b.collection === 'home' ? 'Home collection<br><small>' + esc(b.address) + '</small>' : 'Visit lab'}</div></div>
<table>${rows}${b.collectionFee ? `<tr><td>Home collection fee</td><td class="r">₹${b.collectionFee.toLocaleString('en-IN')}</td></tr>` : ''}<tr class="total"><td>Total payable</td><td class="r">₹${b.total.toLocaleString('en-IN')}</td></tr></table>
<p class="note">Booked on ${esc(formatDateTime(b.createdAt))}. Please carry a photo ID and show this pass at the laboratory. Follow any fasting instructions given for your tests.</p>
</div></div></body></html>`;
}

export function downloadPass(b) {
  const blob = new Blob([buildPassHtml(b)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `booking-pass-${b.reference}.html`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
