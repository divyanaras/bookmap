// ── Auth screen logic ──

function renderPreviewHeatmap() {
  const el = document.getElementById('preview-heatmap');
  const el2 = document.getElementById('preview-year');
  if (el2) el2.textContent = currentYear;
  if (!el) return;
  let h = '';
  const levels = [0,0,0,0,0,0,1,1,1,2,2,3,4];
  for (let i = 0; i < 91; i++) {
    const l = levels[Math.floor(Math.random() * levels.length)];
    h += '<div class="preview-cell h' + l + '"></div>';
  }
  el.innerHTML = h;
}

function showAuthForm(mode) {
  document.getElementById('form-signup').classList.toggle('hidden', mode !== 'signup');
  document.getElementById('form-signin').classList.toggle('hidden', mode !== 'signin');
  document.getElementById('nav-new').classList.toggle('active', mode === 'signup');
  document.getElementById('nav-old').classList.toggle('active', mode === 'signin');
  const emailId = mode === 'signup' ? 'signup-email' : 'signin-email';
  setTimeout(() => document.getElementById(emailId)?.focus(), 100);
}

async function handleAuth(e, mode) {
  e.preventDefault();
  if (!sb) {
    document.getElementById(mode + '-error').textContent = 'Supabase not connected. Check your URL and anon key.';
    return;
  }
  const email = document.getElementById(mode + '-email').value.trim();
  const password = document.getElementById(mode + '-password').value;
  const errEl = document.getElementById(mode + '-error');
  const btn = document.getElementById(mode + '-btn');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'one sec...';
  const forgotEl = document.getElementById(mode + '-forgot');
  const forgotMsg = document.getElementById(mode + '-forgot-msg');
  if (forgotEl) forgotEl.classList.add('hidden');
  if (forgotMsg) forgotMsg.textContent = '';

  try {
    const result = mode === 'signup'
      ? await sb.auth.signUp({ email, password })
      : await sb.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;

    if (mode === 'signup' && result.data?.user && result.data.user.identities?.length === 0) {
      errEl.textContent = 'hey, you\'re already a user — try signing in instead';
      if (forgotEl) forgotEl.classList.remove('hidden');
      return;
    }

    // Show confirmation message for signup
    if (mode === 'signup' && result.data?.user && !result.data?.session) {
      errEl.style.color = 'var(--green)';
      errEl.textContent = 'check your email for a confirmation link before signing in!';
      return;
    }
  } catch (err) {
    const msg = (err.message || '').toLowerCase();
    if (mode === 'signin' && (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong'))) {
      errEl.textContent = 'can\'t find these creds in my db — check your email/password?';
      if (forgotEl) forgotEl.classList.remove('hidden');
    } else if (mode === 'signin' && msg.includes('email not confirmed')) {
      errEl.textContent = 'check your email and click the confirmation link first!';
    } else if (mode === 'signup' && msg.includes('already')) {
      errEl.textContent = 'hey, you\'re already a user — try signing in instead';
      if (forgotEl) forgotEl.classList.remove('hidden');
    } else if (msg.includes('email') && msg.includes('valid')) {
      errEl.textContent = 'that doesn\'t look like a valid email';
    } else if (msg.includes('password') && (msg.includes('short') || msg.includes('length') || msg.includes('6'))) {
      errEl.textContent = 'password needs to be at least 6 characters';
    } else {
      errEl.textContent = err.message || 'something went wrong';
    }
    return;
  } finally {
    btn.disabled = false;
    btn.textContent = mode === 'signup' ? "let's go \u2192" : 'let me in \u2192';
  }
}

async function forgotPassword(mode) {
  const email = document.getElementById(mode + '-email').value.trim();
  const msgEl = document.getElementById(mode + '-forgot-msg');
  if (!email) {
    msgEl.textContent = 'enter your email above first';
    msgEl.style.color = 'var(--muted-foreground)';
    return;
  }
  if (!sb) return;
  msgEl.textContent = 'sending...';
  msgEl.style.color = 'var(--muted-foreground)';
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://divyanaras.github.io/bookmap/'
  });
  if (error) {
    msgEl.textContent = 'couldn\'t send reset email — ' + error.message;
    msgEl.style.color = 'hsl(0, 70%, 55%)';
  } else {
    msgEl.textContent = 'reset link sent! check your inbox';
    msgEl.style.color = 'var(--green)';
  }
}

async function handleSignOut() {
  if (sb) await sb.auth.signOut();
}

function showAuth() {
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('app-screen').style.display = 'none';
  renderPreviewHeatmap();
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  document.getElementById('header-year').textContent = currentYear;
  document.getElementById('theme-btn').innerHTML = document.documentElement.classList.contains('dark') ? '&#9790;' : '&#9788;';
  loadAll();
}