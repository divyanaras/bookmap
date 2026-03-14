// ── Modal system ──

function showModal(html) {
  document.getElementById('modal-root').innerHTML = '<div class="modal-overlay" onclick="if(event.target===this)hideModal()"><div class="modal">' + html + '</div></div>';
}

function hideModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ── Add Book Modal ──
let searchTimeout = null, searchResults = [];

function openAddBookModal() {
  let h = '<h2>add a book</h2>';
  h += '<div class="field"><label>title</label><input type="text" id="ab-t" placeholder="The Great Gatsby" oninput="onSearch()"></div>';
  h += '<div id="sr-box"></div>';
  h += '<div class="field"><label>author</label><input type="text" id="ab-a" placeholder="F. Scott Fitzgerald"></div>';
  h += '<div class="field"><label>total pages <span style="opacity:0.5">(optional)</span></label><input type="number" id="ab-p" placeholder="180" min="0"></div>';
  h += '<input type="hidden" id="ab-c"><div id="ab-cv" style="margin-bottom:12px"></div>';
  h += '<div class="modal-actions"><button type="button" class="btn btn-outline" onclick="hideModal()">cancel</button><button type="button" class="btn btn-primary" onclick="subAddBook()">start reading</button></div>';
  showModal(h);
}

function onSearch() {
  clearTimeout(searchTimeout);
  const t = document.getElementById('ab-t').value.trim();
  if (t.length < 3) { document.getElementById('sr-box').innerHTML = ''; return; }
  searchTimeout = setTimeout(async () => {
    document.getElementById('sr-box').innerHTML = '<div class="search-loading">searching...</div>';
    const r = await searchBooks(t);
    searchResults = r;
    let h = '';
    if (r.length) {
      h = '<div class="search-results">';
      r.forEach((x, i) => {
        h += '<div class="search-result" onclick="pickResult(' + i + ')">';
        if (x.coverUrl) h += '<img src="' + esc(x.coverUrl) + '">';
        h += '<div class="sr-info"><div class="sr-title">' + esc(x.title || '') + '</div><div class="sr-author">' + esc(x.author || '') + '</div>';
        if (x.totalPages) h += '<div class="sr-pages">' + x.totalPages + ' pages</div>';
        h += '</div></div>';
      });
      h += '</div>';
    } else {
      h = '<div class="search-loading">couldn\'t find it — fill in manually.</div>';
    }
    document.getElementById('sr-box').innerHTML = h;
  }, 500);
}

function pickResult(i) {
  const r = searchResults[i];
  if (!r) return;
  if (r.title) document.getElementById('ab-t').value = r.title;
  if (r.author) document.getElementById('ab-a').value = r.author;
  if (r.totalPages) document.getElementById('ab-p').value = r.totalPages;
  document.getElementById('ab-c').value = r.coverUrl || '';
  if (r.coverUrl) {
    document.getElementById('ab-cv').innerHTML = '<div style="display:flex;justify-content:center"><img src="' + esc(r.coverUrl) + '" style="width:80px;height:112px;border-radius:8px;object-fit:cover"></div>';
  }
  document.getElementById('sr-box').innerHTML = '';
}

async function subAddBook() {
  const t = document.getElementById('ab-t').value.trim();
  const a = document.getElementById('ab-a').value.trim();
  const p = parseInt(document.getElementById('ab-p').value) || 0;
  const c = document.getElementById('ab-c').value || null;
  if (!t || !a) { alert('title and author are required'); return; }
  await dbAddBook({ title: t, author: a, totalPages: p, coverUrl: c });
  hideModal();
  await loadAll();
}

// ── Log Session Modal ──
let selInt = 2;

function openLogSessionModal(preId) {
  if (!books.length) { alert('no books added yet'); return; }
  const reading = books.filter(b => b.status === 'reading');
  const finished = books.filter(b => b.status === 'finished');
  const logDate = heatmapSelectedDate || today();

  let h = '<h2>log a session</h2>';
  h += '<div class="field"><label>book</label><select id="ls-b">';
  if (reading.length) {
    reading.forEach(b => { h += '<option value="' + b.id + '"' + (b.id === preId ? ' selected' : '') + '>' + esc(b.title) + '</option>'; });
  }
  if (finished.length) {
    h += '<optgroup label="finished">';
    finished.forEach(b => { h += '<option value="' + b.id + '"' + (b.id === preId ? ' selected' : '') + '>' + esc(b.title) + '</option>'; });
    h += '</optgroup>';
  }
  h += '</select></div>';
  h += '<div class="field"><label>intensity</label><div class="intensity-grid">';
  h += '<button type="button" class="intensity-btn" onclick="pickInt(this,1)"><div>light</div><div class="desc">skimming or a few pages</div></button>';
  h += '<button type="button" class="intensity-btn active" onclick="pickInt(this,2)"><div>moderate</div><div class="desc">a solid session</div></button>';
  h += '<button type="button" class="intensity-btn" onclick="pickInt(this,3)"><div>intense</div><div class="desc">deep focus, couldn\'t stop</div></button>';
  h += '</div></div>';
  h += '<div class="field"><label>date</label><input type="date" id="ls-d" value="' + logDate + '"></div>';
  h += '<div class="modal-actions"><button type="button" class="btn btn-outline" onclick="hideModal()">cancel</button><button type="button" class="btn btn-primary" onclick="subLog()">log session</button></div>';
  showModal(h);
}

let selRating = 0;

function pickRating(val) {
  selRating = val;
  document.querySelectorAll('#fn-rating .rating-star').forEach(s => {
    s.classList.toggle('active', +s.dataset.val <= val);
  });
}

function pickInt(el, v) {
  selInt = v;
  el.parentElement.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

async function subLog() {
  const b = document.getElementById('ls-b').value;
  const d = document.getElementById('ls-d').value;
  hideModal();
  await dbLogSession(b, 0, d, selInt);
  selInt = 2;
}

// ── Finish Book Modal ──
function openFinishModal(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const cm = months[new Date().getMonth()];

  let h = '<h2>you finished it.</h2><p class="modal-sub">nice work on <strong>' + esc(book.title) + '</strong>. anything you want to remember about this one?</p>';
  h += '<div class="field"><label>month finished</label><select id="fn-m">';
  months.forEach(m => { h += '<option value="' + m + '"' + (m === cm ? ' selected' : '') + '>' + m + '</option>'; });
  h += '</select></div>';
  h += '<div class="field"><label>rating <span style="opacity:0.5">(optional)</span></label><div class="rating-row" id="fn-rating">';
  for (let i = 1; i <= 5; i++) {
    h += '<button type="button" class="rating-star" onclick="pickRating(' + i + ')" data-val="' + i + '">&#9733;</button>';
  }
  h += '</div></div>';
  h += '<div class="field"><label>how I liked it in a line <span style="opacity:0.5">(optional)</span></label><textarea id="fn-n" placeholder="one line — what did you think?" rows="3"></textarea></div>';
  /* h += '<div class="field"><label>memorable quotes <span style="opacity:0.5">(optional)</span></label><textarea id="fn-q" placeholder="one quote per line. the lines that stopped you." rows="4"></textarea></div>'; */
  h += '<div class="modal-actions"><button type="button" class="btn btn-outline" onclick="hideModal()">cancel</button><button type="button" class="btn btn-primary" onclick="subFinish(\'' + bookId + '\')">mark as finished</button></div>';
  showModal(h);
}

async function subFinish(id) {
  const n = document.getElementById('fn-n').value.trim();
  const rating = selRating || null;
  const m = document.getElementById('fn-m').value;
  hideModal();
  selRating = 0;
  await dbFinishBook(id, n || null, [], m, rating);
}

// ── Year Reads Modal ──
function openYearReadsModal() {
  const fin = books.filter(b => b.status === 'finished');
  let h = '<h2>' + currentYear + ' reads</h2>';
  if (!fin.length) {
    h += '<div class="empty-state">no finished books yet.</div>';
  } else {
    fin.forEach(b => {
      h += '<div class="finished-book-card"><div class="book-top">';
      h += b.cover_url ? '<img class="book-cover" src="' + esc(b.cover_url) + '">' : '<div class="book-cover-ph"><span>' + esc(b.title) + '</span></div>';
      h += '<div class="book-info"><div class="book-title">' + esc(b.title) + '</div><div class="book-author">' + esc(b.author) + '</div>';
      h += '<div class="finished-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>finished</div>';
      h += '</div></div>';
      if (b.finish_note) h += '<div class="finish-note-box"><div class="finish-note-label">how I liked it in a line</div><div class="finish-note-text">' + esc(b.finish_note) + '</div></div>';
      if (b.memorable_quotes?.length) b.memorable_quotes.forEach(q => { h += '<div class="quote-box">"' + esc(q) + '"</div>'; });
      h += '</div>';
    });
  }
  h += '<div class="modal-actions"><button type="button" class="btn btn-outline" onclick="hideModal()">close</button></div>';
  showModal(h);
}

// ── Screenshot Modal ──
function openScreenshotModal() {
  const recent = [...books].sort((a, b) => {
    const ad = sessions.filter(s => s.book_id === a.id).map(s => s.date).sort().pop() || a.start_date;
    const bd = sessions.filter(s => s.book_id === b.id).map(s => s.date).sort().pop() || b.start_date;
    return bd.localeCompare(ad);
  }).slice(0, 5);

  let h = '<h2>Bookmap ' + currentYear + '</h2>';
  const days = buildHeatmapData(currentYear);
  const weeks = groupByWeek(days);

  if (weeks.length) {
    const ml = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mp = [];
    let lm = -1;
    weeks.forEach((w, i) => {
      for (const d of w) {
        if (!d.date) continue;
        const m = new Date(d.date + 'T00:00:00').getMonth();
        if (m !== lm) { mp.push({ l: ml[m], c: i }); lm = m; }
        break;
      }
    });
    const dl = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    h += '<div style="overflow-x:auto;margin-bottom:20px"><div style="display:inline-flex;flex-direction:column;gap:1px;min-width:max-content">';
    h += '<div class="heatmap-months">';
    weeks.forEach((_, i) => { const m = mp.find(x => x.c === i); h += '<div class="heatmap-month">' + (m ? m.l : '') + '</div>'; });
    h += '</div>';
    h += '<div class="heatmap-grid"><div class="heatmap-days">';
    dl.forEach(l => { h += '<div class="heatmap-day-label">' + l + '</div>'; });
    h += '</div>';
    h += '<div class="heatmap-cols">';
    weeks.forEach(w => {
      h += '<div class="heatmap-col">';
      w.forEach(d => { h += '<div class="hm ' + (!d.date ? 'he' : 'h' + d.level) + '"></div>'; });
      h += '</div>';
    });
    h += '</div></div></div></div>';
    h += '<div class="heatmap-legend"><span>less</span><div class="legend-cell h0"></div><div class="legend-cell h1"></div><div class="legend-cell h2"></div><div class="legend-cell h3"></div><div class="legend-cell h4"></div><span>more</span></div>';
  }

  if (recent.length) {
    h += '<p class="ss-label">latest reads</p>';
    recent.forEach((b, i) => {
      h += '<div class="ss-book">';
      h += b.cover_url ? '<img src="' + esc(b.cover_url) + '">' : '<div class="ss-cover-ph"><span>' + esc(b.title) + '</span></div>';
      h += '<div class="book-info"><div class="book-title">' + esc(b.title) + '</div><div class="book-author">' + esc(b.author) + '</div>';
      const pct = b.total_pages > 0 ? Math.round(((b.current_page || 0) / b.total_pages) * 100) : (b.current_page || 0);
      if (b.status === 'finished') {
        h += '<div class="finished-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>finished</div>';
      } else {
        h += '<div style="margin-top:8px"><div class="progress-bar"><div class="progress-bar-fill" style="width:' + pct + '%;background:var(--amber-500)"></div></div>';
        h += '<div class="progress-label" style="font-size:10px;color:var(--muted-foreground);margin-top:3px">' + (b.total_pages > 0 ? 'p. ' + (b.current_page || 0) + ' of ' + b.total_pages : pct + '%') + '</div></div>';
      }
      h += '</div></div>';
      if (b.finish_note) h += '<div class="finish-note-box"><div class="finish-note-label">how I liked it in a line</div><div class="finish-note-text">' + esc(b.finish_note) + '</div></div>';
      if (i < recent.length - 1) h += '<hr class="ss-divider">';
    });
  }

  h += '<div class="modal-actions"><button type="button" class="btn btn-outline" onclick="hideModal()">close</button></div>';
  showModal(h);
}