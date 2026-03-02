# How Bookmap Works

A breakdown of the architecture, setup, and every feature — for anyone who wants to understand, fork, or extend this project.

---

## Architecture

```
index.html (single file)
├── <style>       CSS variables for light/dark themes, all component styles
├── <body>        Two screens: auth + app (toggled via JS)
└── <script>      All logic — auth, database, heatmap, UI rendering, search
```

There is no build step. The entire app is one HTML file that loads the Supabase client library from a CDN. Everything else — styles, markup, logic — is inline.

### Why a single file?

- Zero setup for end users: just open the URL
- Easy to fork: download one file, swap in your Supabase credentials, deploy anywhere
- No dependency management, no version conflicts, no build failures

---

## Supabase Setup (for your own instance)

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project. The free tier includes 50K monthly active users and 500MB of database storage.

### 2. Run the database schema

Open the **SQL Editor** in your Supabase dashboard and run:

```sql
-- Books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  total_pages INT DEFAULT 0,
  cover_url TEXT,
  status TEXT CHECK (status IN ('reading', 'finished', 'dnf')) DEFAULT 'reading',
  current_page INT DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  finish_date DATE,
  finish_note TEXT,
  memorable_quotes TEXT[] DEFAULT '{}',
  dnf_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading sessions table
CREATE TABLE reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  pages_read INT DEFAULT 0,
  current_page INT DEFAULT 0,
  intensity SMALLINT CHECK (intensity IN (1, 2, 3)) DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (each user sees only their own data)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_crud_own" ON books
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_crud_own" ON reading_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

You should see "Success. No rows returned." — that's expected.

### 3. Disable email confirmation (recommended for testing)

Go to **Authentication > Settings > Email** and turn off "Confirm email." This lets new users sign up and immediately use the app without checking their inbox.

### 4. Get your credentials

Go to **Settings > API** and copy:
- **Project URL** — looks like `https://xxxxx.supabase.co`
- **anon / public key** — a long JWT string starting with `eyJ...`

### 5. Add credentials to the file

Open `index.html` and update these two lines near the top of the `<script>` block:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...your-anon-key';
```

---

## Data Model

### Books

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Links to Supabase auth user |
| `title` | TEXT | Book title |
| `author` | TEXT | Author name |
| `total_pages` | INT | Total page count (0 if unknown) |
| `cover_url` | TEXT | URL to cover image from Open Library or Google Books |
| `status` | TEXT | One of: `reading`, `finished`, `dnf` |
| `current_page` | INT | Current reading position |
| `start_date` | DATE | When the user started reading |
| `finish_date` | DATE | When marked as finished |
| `finish_note` | TEXT | One-line review |
| `memorable_quotes` | TEXT[] | Array of saved quotes |

### Reading Sessions

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `book_id` | UUID | Which book this session is for |
| `user_id` | UUID | Who logged it |
| `date` | DATE | When the session happened |
| `intensity` | SMALLINT | 1 = light, 2 = moderate, 3 = intense |
| `current_page` | INT | Page position at time of logging |

---

## Features in Detail

### Reading Heatmap

The heatmap is a GitHub-contributions-style grid covering Jan 1 to today.

**How intensity maps to color levels:**
- Sessions are grouped by date
- Daily intensity values are summed across all sessions that day
- Total maps to a level: 0 (none), 1 (light), 2 (moderate), 3 (solid), 4+ (intense)
- Each level gets a progressively warmer amber/orange color

**Interaction:**
- Hover shows date and intensity
- Click a tile to see session details (which books, what intensity)
- Today's tile has a subtle pulse animation
- Selecting a date on the heatmap pre-fills the date when you open "log session"

### Book Search

When adding a book, the app searches two APIs with fallback:

1. **Open Library** (primary) — `openlibrary.org/search.json`
2. **Google Books** (fallback) — `googleapis.com/books/v1/volumes`

Both return title, author, page count, and cover image. The user picks from results or fills in manually.

### Progress Slider

Each "reading" book has a draggable slider:
- Dragging updates the page count display in real time
- Releasing saves the new position to the database
- After releasing, a quote prompt appears: "anything memorable?"
- Dragging to 100% triggers the finish dialog instead

### Finish Dialog

When a book is completed (slider to max or manual finish):
- Asks for the month finished (defaults to current month)
- Optional one-line review ("how I liked it in a line")
- Optional memorable quotes (one per line)
- Book moves to the "finished" tab with a green checkmark

### Delete Confirmation

Two-tap delete pattern:
1. First tap: trash icon turns red, warning text appears
2. Second tap within 3 seconds: book is deleted
3. After 3 seconds without second tap: resets to normal state

### Screenshot Preview

Shows a modal with:
- The full heatmap (without interaction)
- Up to 5 most recently active books with covers and progress

Designed to be screenshotted and shared.

---

## Theming

Two themes using CSS custom properties:

| Property | Light | Dark |
|----------|-------|------|
| `--background` | Warm cream `hsl(45, 30%, 96%)` | Deep brown `hsl(25, 15%, 10%)` |
| `--foreground` | Near-black `hsl(30, 10%, 15%)` | Warm white `hsl(40, 20%, 92%)` |
| `--card` | Slightly darker cream | Slightly lighter brown |
| `--muted` | Tan | Dark brown |
| `--primary` | Burnt orange | Warm orange |
| `--border` | Light tan | Dark brown |

Theme preference is saved to `localStorage` and restored on load. A moon/sun toggle button sits fixed in the top-right corner.

A subtle grain texture overlay (`body::after`) adds an analog, textured feel.

---

## Deployment

### GitHub Pages (recommended)

1. Push to a GitHub repo with the file named `index.html`
2. Go to repo **Settings > Pages**
3. Set source to "Deploy from a branch" > `main` > `/ (root)`
4. Your site will be live at `https://username.github.io/repo-name/`

### Any static host

Since it's a single HTML file, it works on Netlify, Vercel, Cloudflare Pages, or any web server. Just serve `index.html`.

### Local

Double-click `bookmap.html` to open in your browser. It works locally — the Supabase calls go directly to the cloud.

---

## Security

- **Row Level Security (RLS)** ensures each user can only read and write their own data
- The Supabase anon key is safe to expose in client-side code — it only grants access that RLS policies allow
- No server-side code, no secrets beyond the anon key
- Auth is handled entirely by Supabase (email + password, bcrypt hashed)

---

## Future Ideas

- Bookshelf and TBR sidebar sections
- Export heatmap as image (html2canvas)
- Shareable read-only profile links
- Reading streaks and stats
- Google Books API key for higher rate limits
