// js/save.js — centralized localStorage persistence (Phases 15 + 24).
// All reads/writes are guarded so private-mode / disabled storage never throws.

const K = {
  progress: 'resonance_progress',       // highest 0-based level index reached (next to play)
  act1:     'resonance_act1_complete',
  act2:     'resonance_act2_complete',
  times:    'resonance_best_times',     // { "<idx>": ms }
  achieve:  'resonance_achievements',   // string[]
};

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function write(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignore */ } }
function remove(key)     { try { localStorage.removeItem(key); }   catch (e) { /* ignore */ } }
function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function writeJSON(key, val) { write(key, JSON.stringify(val)); }

// ─── Progress (furthest unlocked level index) ────────────────────────────────
export function getProgress() { const n = parseInt(read(K.progress, ''), 10); return isNaN(n) ? 0 : n; }
export function setProgress(idx) { write(K.progress, String(idx)); }
export function clearProgress() { remove(K.progress); }

// Level `idx` is unlocked once you have reached it. Level 0 is always unlocked.
export function isLevelUnlocked(idx) { return idx <= getProgress(); }

// ─── Best times (ms per level index) ─────────────────────────────────────────
export function getBestTimes() { return readJSON(K.times, {}); }
export function getBestTime(idx) { const t = getBestTimes()[idx]; return typeof t === 'number' ? t : null; }
export function recordTime(idx, ms) {
  const times = getBestTimes();
  if (times[idx] == null || ms < times[idx]) { times[idx] = Math.round(ms); writeJSON(K.times, times); return true; }
  return false;
}

// ─── Act completion flags ────────────────────────────────────────────────────
export function markAct(act) { write(act === 1 ? K.act1 : K.act2, '1'); }
export function isActComplete(act) { return read(act === 1 ? K.act1 : K.act2, '') === '1'; }

// ─── Achievements ────────────────────────────────────────────────────────────
export function getAchievements() { const a = readJSON(K.achieve, []); return Array.isArray(a) ? a : []; }
export function hasAchievement(id) { return getAchievements().includes(id); }
// Returns true only when this is a NEW unlock (so the caller can toast it once).
export function unlockAchievement(id) {
  const a = getAchievements();
  if (a.includes(id)) return false;
  a.push(id); writeJSON(K.achieve, a); return true;
}

export function resetAll() { for (const k of Object.values(K)) remove(k); }

// Format ms → "M:SS.mmm" style compact string for the level-select UI.
export function formatTime(ms) {
  if (ms == null) return '—';
  const total = Math.round(ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const ss = String(s).padStart(2, '0');
  const cc = String(cs).padStart(2, '0');
  return m > 0 ? `${m}:${ss}.${cc}` : `${s}.${cc}s`;
}
