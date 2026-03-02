# Bookmap 2026

A minimal, personal reading tracker. Log what you read, see your year on a heatmap, and keep notes on the books that matter.

Single HTML file. No build step. Works anywhere.

## Live

**[https://divyanaras.github.io/bookmap2026-/](https://divyanaras.github.io/bookmap2026-/)**

## What it does

- **Reading heatmap** — GitHub-style grid showing your reading activity across the year. Click any tile to see what you read that day.
- **Book library** — Add books by searching Open Library or Google Books. Track progress with a slider. Filter between reading and finished.
- **Session logging** — Log reading sessions with intensity levels (light / moderate / intense) to build your heatmap.
- **Finish tracking** — When you complete a book, save a one-line review and memorable quotes.
- **Screenshot preview** — Generate a shareable snapshot of your heatmap and recent reads.
- **Light and dark mode** — Warm earth-tone palette in both themes. Persists across sessions.

## Tech

- **Single HTML file** — everything lives in `index.html`. No frameworks, no bundler, no dependencies beyond one CDN script.
- **Supabase** — handles auth (email/password) and stores all data in PostgreSQL with row-level security. Each user only sees their own books.
- **Vanilla JS** — no React, no build tools. DOM manipulation and template strings.
- **Open Library + Google Books APIs** — auto-fetches cover art and page counts when you add a book.

## Setup

Want to run your own instance? See [HOW-IT-WORKS.md](HOW-IT-WORKS.md) for the full setup guide including the database schema.

## Screenshots

| Dark mode | Light mode |
|-----------|------------|
| Warm amber heatmap, dark card backgrounds | Same layout, cream/parchment tones |

## Credits

Built by [@divyanaras](https://github.com/divyanaras). Design inspired by the BookMap feature on [divyanaras.com](https://divyanaras.com).
