// ── Supabase config & global state ──
const SUPABASE_URL = 'https://aqedpqtwwtypmeubfdwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kMSeM1NUdAmRivC7657nNw_Y-tQnTXp';

let sb = null;
try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e) { console.error('Supabase init:', e); }

let currentUser = null;
let books = [];
let sessions = [];
let libraryTab = 'reading';
let heatmapSelectedDate = null;
const currentYear = new Date().getFullYear();