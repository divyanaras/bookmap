// ── Utility functions ──
function today() {
  return fmtDate(new Date());
}

function fmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtDateNice(s) {
  const d = new Date(s + 'T00:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const w = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return w[d.getDay()] + ', ' + m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}