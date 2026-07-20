// Screen management: title, pause, dead, win
// Each screen is a div inside #overlay

export function init() {
  // Wire up all button clicks via data-action attributes
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      document.dispatchEvent(new CustomEvent('ui:action', { detail: action }));
    });
  });
}

export function show(screenId) {
  const overlay = document.getElementById('overlay');
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('visible'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('visible');
  const hasScreen = !!target;
  overlay.classList.toggle('active', hasScreen);
}

export function hide() {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('visible'));
  document.getElementById('overlay').classList.remove('active');
}

export function setLevelName(name) {
  const el = document.getElementById('level-name-display');
  if (el) el.textContent = name;
}

export function setDeathMessage(msg) {
  const el = document.getElementById('death-msg');
  if (el) el.textContent = msg;
}

export function setHint(text) {
  const el = document.getElementById('hint-text');
  if (el) el.textContent = text;
}

export function showContinueButton(levelNum) {
  const btn = document.getElementById('continue-btn');
  if (btn) {
    btn.textContent = `Continue — Level ${levelNum}`;
    btn.style.display = '';
  }
}

export function hideContinueButton() {
  const btn = document.getElementById('continue-btn');
  if (btn) btn.style.display = 'none';
}

export function setQualityLabel(mode) {
  const btn = document.getElementById('quality-btn');
  if (btn) btn.textContent = `Quality: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
}

// ─── Level select (Phase 24) ─────────────────────────────────────────────────
// levels: [{ name }], unlockedMax: highest unlocked index, bestTimes: {idx: ms},
// fmt: (ms|null)=>string. Clicking an unlocked cell dispatches "play-level:<idx>".
export function buildLevelSelect(levels, unlockedMax, bestTimes, fmt) {
  const grid = document.getElementById('levelselect-grid');
  if (!grid) return;
  grid.innerHTML = '';
  levels.forEach((lvl, idx) => {
    const unlocked = idx <= unlockedMax;
    const cell = document.createElement('button');
    cell.className = 'ls-cell' + (unlocked ? '' : ' locked');
    cell.disabled = !unlocked;
    const time = bestTimes[idx];
    cell.innerHTML = unlocked
      ? `<span class="ls-num">${idx + 1}</span>` +
        `<span class="ls-name">${lvl.name}</span>` +
        `<span class="ls-time">${time != null ? fmt(time) : '—'}</span>`
      : `<span class="ls-num">${idx + 1}</span><span class="ls-lock">◊</span>`;
    if (unlocked) {
      cell.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('ui:action', { detail: `play-level:${idx}` }));
      });
    }
    grid.appendChild(cell);
  });
}

// ─── Achievement gallery (pause menu) ────────────────────────────────────────
export function buildAchievementGallery(achievements, earnedIds) {
  const wrap = document.getElementById('achievement-gallery');
  if (!wrap) return;
  const earned = new Set(earnedIds);
  wrap.innerHTML = '';
  for (const a of achievements) {
    const has = earned.has(a.id);
    const cell = document.createElement('div');
    cell.className = 'ach-cell' + (has ? ' earned' : '');
    cell.title = has ? `${a.name} — ${a.desc}` : '???';
    cell.innerHTML = `<span class="ach-glyph">${a.glyph}</span>`;
    wrap.appendChild(cell);
  }
}

// ─── Achievement toast (queue; ~2.5s each) ───────────────────────────────────
const _toastQueue = [];
let _toastActive = false;
export function showAchievementToast(names) {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) _toastQueue.push(n);
  if (!_toastActive) _nextToast();
}
function _nextToast() {
  const el = document.getElementById('achievement-toast');
  if (!el || _toastQueue.length === 0) { _toastActive = false; return; }
  _toastActive = true;
  const name = _toastQueue.shift();
  el.textContent = `Achievement — ${name}`;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(_nextToast, 400); // let the fade-out finish before the next
  }, 2500);
}
