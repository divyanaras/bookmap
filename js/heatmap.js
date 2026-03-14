// ── Heatmap (current calendar year) ──

function buildHeatmapData(year) {
  const start = new Date(year, 0, 1);
  const ey = new Date(year, 11, 31);
  const now = new Date();
  const end = ey < now ? ey : now;

  // Build intensity lookup from sessions
  const ibd = {};
  for (const s of sessions) {
    ibd[s.date] = (ibd[s.date] || 0) + (s.intensity || 2);
  }

  const days = [];
  const d = new Date(start);
  while (d <= end) {
    const ds = fmtDate(d);
    const v = ibd[ds] || 0;
    let l = 0;
    if (v >= 4) l = 4;
    else if (v === 3) l = 3;
    else if (v === 2) l = 2;
    else if (v >= 1) l = 1;
    days.push({ date: ds, level: l, val: v });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function groupByWeek(days) {
  if (!days.length) return [];
  const weeks = [];
  let week = [];
  // Pad start to align with day-of-week
  const dow = new Date(days[0].date + 'T00:00:00').getDay();
  for (let i = 0; i < dow; i++) week.push({ date: '', level: 0, val: 0 });
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push(week);
  return weeks;
}

function renderHeatmap() {
  const el = document.getElementById('heatmap-container');
  const days = buildHeatmapData(currentYear);
  const weeks = groupByWeek(days);
  const td = today();

  if (!weeks.length) {
    el.innerHTML = '<div class="heatmap-empty">no reading data for ' + currentYear + ' yet.</div>';
    return;
  }

  // Build month labels
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

  let h = '<div class="heatmap-wrap"><div style="display:inline-flex;flex-direction:column;gap:1px;min-width:max-content;padding-bottom:4px">';
  h += '<div class="heatmap-months">';
  weeks.forEach((_, i) => {
    const m = mp.find(x => x.c === i);
    h += '<div class="heatmap-month">' + (m ? m.l : '') + '</div>';
  });
  h += '</div>';
  h += '<div class="heatmap-grid"><div class="heatmap-days">';
  dl.forEach(l => { h += '<div class="heatmap-day-label">' + l + '</div>'; });
  h += '</div>';
  h += '<div class="heatmap-cols">';
  weeks.forEach(w => {
    h += '<div class="heatmap-col">';
    w.forEach(d => {
      const e = !d.date;
      const cls = e ? 'he' : 'h' + d.level;
      const ex = d.date === td ? ' now' : '';
      const sl = d.date === heatmapSelectedDate ? ' sel' : '';
      const oc = e ? '' : ' onclick="selHM(\'' + d.date + '\')"';
      const title = d.date ? fmtDateNice(d.date) + ': intensity ' + d.val : '';
      h += '<div class="hm ' + cls + ex + sl + '" title="' + title + '"' + oc + '></div>';
    });
    h += '</div>';
  });
  h += '</div></div></div></div>';

  // Legend
  h += '<div class="heatmap-legend"><span>less</span>';
  h += '<div class="legend-cell h0"></div><div class="legend-cell h1"></div><div class="legend-cell h2"></div><div class="legend-cell h3"></div><div class="legend-cell h4"></div>';
  h += '<span>more</span></div>';

  // Selected date detail
  if (heatmapSelectedDate) {
    const ds = [];
    for (const b of books) {
      for (const s of sessions) {
        if (s.book_id === b.id && s.date === heatmapSelectedDate) {
          ds.push({ t: b.title, i: ['', 'light', 'moderate', 'intense'][s.intensity || 2] });
        }
      }
    }
    h += '<div class="day-detail"><div class="day-detail-date">' + fmtDateNice(heatmapSelectedDate) + '</div>';
    if (!ds.length) h += '<div style="font-size:12px;color:var(--muted-foreground)">no sessions</div>';
    else ds.forEach(s => { h += '<div class="day-detail-row"><span>' + esc(s.t) + '</span><span class="int">' + s.i + '</span></div>'; });
    h += '</div>';
  }

  el.innerHTML = h;
}

function selHM(d) {
  heatmapSelectedDate = heatmapSelectedDate === d ? null : d;
  renderHeatmap();
}