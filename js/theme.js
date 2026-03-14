// ── Theme toggle ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  html.classList.toggle('dark', !isDark);
  html.classList.toggle('light', isDark);
  document.getElementById('theme-btn').innerHTML = isDark ? '&#9788;' : '&#9790;';
  localStorage.setItem('bookmap-theme', isDark ? 'light' : 'dark');
}

(function initTheme() {
  const saved = localStorage.getItem('bookmap-theme');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
})();