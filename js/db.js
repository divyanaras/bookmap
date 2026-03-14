// ── Database operations ──

async function loadAll() {
  if (!sb || !currentUser) { renderAll(); return; }
  try {
    const uid = currentUser.id;
    const [br, sr] = await Promise.all([
      sb.from('books').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('reading_sessions').select('*').eq('user_id', uid),
    ]);
    if (br.error) console.error('books error:', br.error);
    if (sr.error) console.error('sessions error:', sr.error);
    books = br.data || [];
    sessions = sr.data || [];
  } catch(e) {
    console.error('loadAll error:', e);
    books = [];
    sessions = [];
  }
  renderAll();
}

async function dbAddBook(data) {
  const { data: book, error } = await sb.from('books').insert({
    user_id: currentUser.id,
    title: data.title,
    author: data.author,
    total_pages: data.totalPages || 0,
    cover_url: data.coverUrl || null,
    status: 'reading',
    current_page: 0,
    start_date: today(),
  }).select().single();
  if (error) {
    console.error('addBook:', error);
    alert('couldn\'t add book: ' + (error.message || 'connection failed'));
    return null;
  }
  return book;
}

async function dbLogSession(bookId, pagesRead, date, intensity) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  const curPage = book.current_page || 0;
  const { error } = await sb.from('reading_sessions').insert({
    book_id: bookId,
    user_id: currentUser.id,
    date: date || today(),
    pages_read: pagesRead || 0,
    current_page: curPage,
    intensity: intensity || 2,
  });
  if (error) { alert(error.message); return; }
  await loadAll();
}

async function dbUpdatePage(bookId, page) {
  await sb.from('books').update({ current_page: page }).eq('id', bookId);
  const book = books.find(b => b.id === bookId);
  if (book) book.current_page = page;
}

async function dbFinishBook(bookId, note, quotes, finishMonth, rating) {
  let fd = today();
  if (finishMonth) {
    const ms = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const idx = ms.indexOf(finishMonth);
    if (idx >= 0) fd = `${currentYear}-${String(idx + 1).padStart(2, '0')}-01`;
  }
  const book = books.find(b => b.id === bookId);
  const mq = [...(book?.memorable_quotes || []), ...(quotes || [])];
  const update = {
    status: 'finished',
    current_page: book?.total_pages || book?.current_page || 0,
    finish_date: fd,
    finish_note: note || null,
    memorable_quotes: mq.length > 0 ? mq : [],
  };
  if (rating) update.rating = rating;
  await sb.from('books').update(update).eq('id', bookId);
  await loadAll();
}

async function dbAddQuote(bookId, quote) {
  const book = books.find(b => b.id === bookId);
  await sb.from('books').update({
    memorable_quotes: [...(book?.memorable_quotes || []), quote],
  }).eq('id', bookId);
  await loadAll();
}

async function dbDeleteBook(bookId) {
  await sb.from('books').delete().eq('id', bookId);
  await loadAll();
}