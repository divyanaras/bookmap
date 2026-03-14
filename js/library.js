// ── Book Library rendering ──

function renderBookLibrary() {
  const el = document.getElementById('book-library');
  const reading = books.filter(b => b.status === 'reading');
  const finished = books.filter(b => b.status === 'finished');
  document.getElementById('btn-log').disabled = books.length === 0;
  document.getElementById('btn-ss').disabled = books.length === 0;

  if (!books.length) {
    el.innerHTML = '<div class="empty-state">no books so far? get started by adding one real quick!</div>';
    return;
  }

  let h = '<div class="filter-chips">';
  h += '<button type="button" class="chip' + (libraryTab === 'reading' ? ' active' : '') + '" onclick="setTab(\'reading\')">reading<span class="cnt">' + reading.length + '</span></button>';
  h += '<button type="button" class="chip' + (libraryTab === 'finished' ? ' active' : '') + '" onclick="setTab(\'finished\')">finished<span class="cnt">' + finished.length + '</span></button>';
  h += '</div>';

  const list = libraryTab === 'reading' ? reading : finished;
  if (!list.length) {
    h += '<div class="empty-state">' + (libraryTab === 'reading' ? 'nothing in progress. what\'s next?' : 'no finished books yet. you\'ll get there.') + '</div>';
  } else {
    list.forEach(b => { h += renderBookCard(b); });
  }

  if (finished.length > 0) {
    h += '<button type="button" class="year-reads-btn" onclick="openYearReadsModal()">';
    h += '<span class="yr-icon">&#10003;</span>';
    h += '<span class="yr-label">' + currentYear + ' reads</span>';
    h += '<span class="yr-count">' + finished.length + ' book' + (finished.length !== 1 ? 's' : '') + '</span>';
    h += '</button>';
  }
  el.innerHTML = h;
}

function renderBookCard(book) {
  const isReading = book.status === 'reading';
  const hasPages = book.total_pages > 0;
  const page = book.current_page || 0;
  const pct = hasPages ? Math.round((page / book.total_pages) * 100) : page;
  const cover = book.cover_url
    ? '<img class="book-cover" src="' + esc(book.cover_url) + '">'
    : '<div class="book-cover-ph"><span>' + esc(book.title) + '</span></div>';

  let h = '<div class="book-card"><div class="book-top">' + cover + '<div class="book-info"><div class="book-head"><div style="min-width:0"><div class="book-title">' + esc(book.title) + '</div><div class="book-author">' + esc(book.author) + '</div></div>';
  h += '<button type="button" class="delete-btn" onclick="confirmDelete(event,\'' + book.id + '\',\'' + esc(book.title).replace(/'/g, "\\'") + '\')">&#128465;</button></div>';

  h += '<div class="progress-area"><div class="progress-meta">';
  if (hasPages) h += '<span>p. ' + page + ' of ' + book.total_pages + '</span>';
  else h += '<span>' + pct + '% done</span>';
  h += '<span>' + pct + '%</span></div>';

  if (isReading) {
    h += '<div class="slider-row"><input type="range" min="0" max="' + (hasPages ? book.total_pages : 100) + '" value="' + page + '" style="--slider-pct:' + pct + '%" oninput="onSlide(this,\'' + book.id + '\')" onchange="onSlideEnd(this,\'' + book.id + '\')"></div>';
    if (pct >= 100) {
      h += '<button type="button" class="btn btn-sm btn-primary" style="margin-top:8px;width:100%" onclick="openFinishModal(\'' + book.id + '\')">mark as finished</button>';
    }
  } else {
    h += '<div class="progress-bar"><div class="progress-bar-fill ' + (book.status === 'finished' ? 'finished' : 'other') + '" style="width:' + pct + '%"></div></div>';
  }
  h += '</div>';

  if (book.status === 'finished') {
    h += '<div class="finished-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>finished';
    if (book.rating) {
      h += '<span style="margin-left:8px;color:var(--amber-500)">';
      for (let i = 0; i < book.rating; i++) h += '&#9733;';
      h += '</span>';
    }
    h += '</div>';
  }

  h += '</div></div>';

  if (book.status === 'finished') {
    if (book.finish_note) {
      h += '<div class="finish-note-box"><div class="finish-note-label">how I liked it in a line</div><div class="finish-note-text">' + esc(book.finish_note) + '</div></div>';
    }
    /*
    if (book.memorable_quotes?.length) {
      book.memorable_quotes.forEach(q => { h += '<div class="quote-box">"' + esc(q) + '"</div>'; });
    }
    */
  }
  h += '</div>';
  return h;
}

function setTab(t) {
  libraryTab = t;
  renderBookLibrary();
}

// ── Slider & quote interactions ──
let slideTimer = null;

function onSlide(el, id) {
  const v = +el.value;
  const b = books.find(x => x.id === id);
  const p = b?.total_pages > 0 ? Math.round((v / b.total_pages) * 100) : v;
  // Color the track from 0 to current position
  el.style.setProperty('--slider-pct', p + '%');
  const meta = el.closest('.progress-area').querySelector('.progress-meta');
  if (meta) {
    const s = meta.querySelectorAll('span');
    if (b?.total_pages > 0) s[0].textContent = 'p. ' + v + ' of ' + b.total_pages;
    else s[0].textContent = p + '% done';
    s[1].textContent = p + '%';
  }
}

function onSlideEnd(el, id) {
  const v = +el.value;
  const b = books.find(x => x.id === id);
  if (!b) return;
  clearTimeout(slideTimer);
  slideTimer = setTimeout(async () => {
    await dbUpdatePage(id, v);
    b.current_page = v;
    const p = b.total_pages > 0 ? Math.round((v / b.total_pages) * 100) : v;
    if (p >= 100) openFinishModal(id);
    else openLogSessionModal(id);
  }, 300);
}

/*
// ── Quote prompt (disabled for now) ──
function showQuotePrompt(bookId) {
  const c = document.getElementById('qp-' + bookId);
  if (!c) return;
  c.innerHTML = '<div class="quote-prompt"><input id="qi-' + bookId + '" placeholder="anything memorable?" onkeydown="if(event.key===\'Enter\')saveQuote(\'' + bookId + '\');if(event.key===\'Escape\')dismissQuote(\'' + bookId + '\')"><button onclick="saveQuote(\'' + bookId + '\')">save</button><button onclick="dismissQuote(\'' + bookId + '\')">&#10005;</button></div>';
  setTimeout(() => { document.getElementById('qi-' + bookId)?.focus(); }, 50);
}

function saveQuote(bookId) {
  const i = document.getElementById('qi-' + bookId);
  const q = i?.value?.trim();
  if (q) dbAddQuote(bookId, q);
  dismissQuote(bookId);
}

function dismissQuote(bookId) {
  const c = document.getElementById('qp-' + bookId);
  if (c) c.innerHTML = '';
}
*/

// ── Delete confirmation ──
let deleteTimers = {};

function confirmDelete(evt, id, title) {
  const btn = evt.target.closest('.delete-btn');
  if (btn.classList.contains('confirm')) {
    dbDeleteBook(id);
  } else {
    btn.classList.add('confirm');
    btn.innerHTML = '&#10007;';
    clearTimeout(deleteTimers[id]);
    deleteTimers[id] = setTimeout(() => {
      btn.classList.remove('confirm');
      btn.innerHTML = '&#128465;';
    }, 3000);
  }
}