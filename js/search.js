// ── Book search (Open Library + Google Books fallback) ──

async function searchGoogleBooks(title, author) {
  let q = 'intitle:' + title;
  if (author) q += '+inauthor:' + author;
  const r = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(q) + '&maxResults=5&printType=books');
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.items?.length) return null;
  return d.items.map(x => {
    const i = x.volumeInfo;
    let c = i.imageLinks?.thumbnail || null;
    if (c) c = c.replace('http://', 'https://');
    return { coverUrl: c, totalPages: i.pageCount || null, title: i.title || null, author: i.authors?.[0] || null };
  });
}

async function searchOpenLibrary(title, author) {
  const p = new URLSearchParams({ q: title, limit: '5' });
  if (author) p.set('author', author);
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 5000);
  const r = await fetch('https://openlibrary.org/search.json?' + p, { signal: ctrl.signal });
  clearTimeout(tid);
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.docs?.length) return null;
  return d.docs.map(x => ({
    coverUrl: x.cover_i ? 'https://covers.openlibrary.org/b/id/' + x.cover_i + '-M.jpg' : null,
    totalPages: x.number_of_pages_median || null,
    title: x.title || null,
    author: x.author_name?.[0] || null,
  }));
}

async function searchBooks(title, author) {
  try {
    const r = await searchOpenLibrary(title, author);
    if (r?.length) return r;
  } catch(e) { console.log('Open Library failed:', e); }
  try {
    const r = await searchGoogleBooks(title, author);
    if (r?.length) return r;
  } catch(e) { console.log('Google Books failed:', e); }
  return [];
}