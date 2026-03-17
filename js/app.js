// ── Onboarding & Welcome Back & Init ──

let onboardingDismissed = false;

function renderOnboardingGuideContent() {
  let h = '<div class="onboarding-guide">';
  h += '<button type="button" class="ob-dismiss" onclick="dismissOnboarding()">&times;</button>';
  h += '<div class="ob-hey">heyya!</div>';
  h += '<div class="ob-body">';
  h += 'glad max to meet w another reader fren. here\'s all you need to do to track your reads if you\'re borderline mathematical about reading just like me.';
  h += '<div style="margin-top:10px">';
  h += '<div class="ob-step"><span class="ob-num">1/</span> add the current book(s) you\'re reading</div>';
  h += '<div class="ob-step"><span class="ob-num">2/</span> move the sliders to match your current progress</div>';
  h += '<div class="ob-step"><span class="ob-num">3/</span> add some books you\'ve finished as well incase you wanna maintain a 2026 list \u2014 all you need to do is move the sliders to 100% after adding</div>';
  h += '<div class="ob-step"><span class="ob-num">4/</span> log your progress bindass and your tile automatically gets filled. do that for any day of this year so far</div>';
  h += '<div class="ob-step"><span class="ob-num">5/</span> add some lines you remember from the book/say how you liked it in a line (that\'s my favorite part of reading btw)</div>';
  h += '<div class="ob-step"><span class="ob-num">6/</span> view your reads so far and share a screenshot of it to your other friends if you like</div>';
  h += '</div></div>';
  h += '<div class="ob-cheers">that\'s it. that\'s just it. cheers!<br>- divya</div>';
  h += '</div>';
  return h;
}

function renderOnboardingGuide() {
  const el = document.getElementById('onboarding-guide');
  const reopenBtn = document.getElementById('ob-reopen-btn');
  if (!el) return;

  if (books.length === 0 && sessions.length === 0 && !onboardingDismissed) {
    el.innerHTML = renderOnboardingGuideContent();
    if (reopenBtn) reopenBtn.style.display = 'none';
    return;
  }

  el.innerHTML = '';
  if (reopenBtn) reopenBtn.style.display = '';
}

function dismissOnboarding() {
  onboardingDismissed = true;
  const el = document.getElementById('onboarding-guide');
  const reopenBtn = document.getElementById('ob-reopen-btn');
  if (el) el.innerHTML = '';
  if (reopenBtn) reopenBtn.style.display = '';
}

function reopenOnboarding() {
  const el = document.getElementById('onboarding-guide');
  const reopenBtn = document.getElementById('ob-reopen-btn');
  if (el) el.innerHTML = renderOnboardingGuideContent();
  if (reopenBtn) reopenBtn.style.display = 'none';
}

function renderWelcomeBack() {
  const el = document.getElementById('welcome-back');
  if (!el) return;

  const readingBooks = books.filter(b => b.status === 'reading');
  if (!readingBooks.length || !sessions.length) { el.innerHTML = ''; return; }

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sortedSessions[0]?.date;
  if (!lastDate) { el.innerHTML = ''; return; }

  const last = new Date(lastDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) { el.innerHTML = ''; return; }

  const bookSessionMap = {};
  for (const s of sortedSessions) {
    if (!bookSessionMap[s.book_id]) bookSessionMap[s.book_id] = s.date;
  }
  let activeBook = null;
  for (const b of readingBooks) {
    if (bookSessionMap[b.id]) { activeBook = b; break; }
  }
  if (!activeBook) activeBook = readingBooks[0];

  const daysText = diffDays === 1 ? '1 day' : diffDays + ' days';
  const pageInfo = activeBook.total_pages > 0
    ? 'page ' + (activeBook.current_page || 0) + ' of ' + activeBook.title
    : activeBook.title;

  let h = '<div class="welcome-back">';
  h += '<button type="button" class="wb-dismiss" onclick="this.closest(\'.welcome-back\').remove()">&times;</button>';
  h += '<p>okay welcome back. it\'s been ' + daysText + '. you were on ' + pageInfo + '.</p>';
  h += '<p><button type="button" class="wb-cta" onclick="this.closest(\'.welcome-back\').remove()">pick up where you left off &rarr;</button></p>';
  h += '</div>';
  el.innerHTML = h;
}

function renderAll() {
  try { renderOnboardingGuide(); } catch(e) { console.error('onboarding error:', e); }
  renderWelcomeBack();
  renderHeatmap();
  renderBookLibrary();
}

// ── Password reset handler ──
let isPasswordReset = false;

function checkForRecoveryToken() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('type') === 'recovery';
}

function showPasswordResetForm() {
  isPasswordReset = true;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'none';
  const modal = document.getElementById('modal-root');
  let h = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">';
  h += '<div style="max-width:340px;width:100%">';
  h += '<h2 style="font-size:24px;font-weight:700;margin-bottom:8px">reset your password</h2>';
  h += '<p style="font-size:13px;color:var(--muted-foreground);margin-bottom:20px">enter your new password below.</p>';
  h += '<div class="field"><input type="password" id="reset-pw" placeholder="new password (min 6 chars)" minlength="6"></div>';
  h += '<div class="field"><input type="password" id="reset-pw2" placeholder="confirm password" minlength="6"></div>';
  h += '<div id="reset-error" style="font-size:12px;color:hsl(0,70%,55%);margin-bottom:8px"></div>';
  h += '<button type="button" class="btn btn-primary btn-block" onclick="submitPasswordReset()">update password</button>';
  h += '</div></div>';
  modal.innerHTML = h;
}

async function submitPasswordReset() {
  const pw = document.getElementById('reset-pw').value;
  const pw2 = document.getElementById('reset-pw2').value;
  const errEl = document.getElementById('reset-error');
  if (pw.length < 6) { errEl.textContent = 'password needs at least 6 characters'; return; }
  if (pw !== pw2) { errEl.textContent = 'passwords don\'t match'; return; }
  errEl.textContent = '';
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) { errEl.textContent = error.message; return; }
  document.getElementById('modal-root').innerHTML = '';
  isPasswordReset = false;
  // Clear recovery token and show auth screen
  window.location.hash = '';
  showAuth();
}

// ── Auth state listener ──
if (sb) {
  sb.auth.onAuthStateChange((event, session) => {
    if (isPasswordReset) return;
    if (session?.user) { currentUser = session.user; showApp(); }
    else { currentUser = null; showAuth(); }
  });
}

// ── Init ──
(async () => {
  if (!sb) { showAuth(); return; }

  // Check if user clicked recovery link
  if (checkForRecoveryToken()) {
    showPasswordResetForm();
    return;
  }

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) { currentUser = session.user; showApp(); }
    else { showAuth(); }
  } catch(e) {
    console.error('Init:', e);
    showAuth();
  }
})();