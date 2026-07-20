// js/achievements.js — achievement definitions + pure evaluation.
// Storage lives in save.js; run-context tracking lives in game.js.

// Glyphs use geometric marks (not emoji) to match the game's minimalist grammar.
export const ACHIEVEMENTS = [
  { id: 'first_death',      glyph: '✕', name: 'It Heard You',       desc: 'Die for the first time.' },
  { id: 'speedrun_1',       glyph: '»', name: 'Quick Echo',         desc: 'Finish Level 1 in under 20 seconds.' },
  { id: 'no_pulse_1',       glyph: '○', name: 'Blind Faith',        desc: 'Finish Level 1 without pulsing.' },
  { id: 'silent_runner',    glyph: '◌', name: 'The Silent',         desc: 'Clear Level 6 without alerting the patrol.' },
  { id: 'water_survivor',   glyph: '≈', name: 'Waterlogged',        desc: 'Clear Level 7 (Flooded).' },
  { id: 'act1_complete',    glyph: '◐', name: 'Darkness Survived',  desc: 'Complete Act I (Levels 1–10).' },
  { id: 'screamer_avoided', glyph: '⊘', name: 'Muffled',            desc: 'Clear Level 14 without triggering a Screamer.' },
  { id: 'stalker_proof',    glyph: '◉', name: 'Ghost',              desc: 'Clear Level 17 without the stalker hunting.' },
  { id: 'act2_complete',    glyph: '●', name: 'Into the Deep',      desc: 'Complete Act II (Levels 11–20).' },
  { id: 'all_levels',       glyph: '★', name: 'Complete Darkness',  desc: 'Complete all 20 levels.' },
];

export function getById(id) { return ACHIEVEMENTS.find(a => a.id === id) || null; }

// Pure: given an event + context, return the achievement ids that qualify.
// The caller unlocks each (deduped by save.js) and toasts genuinely-new ones.
// ctx = { event, levelIndex, elapsedMs, stats }
//   event: 'complete' | 'death' | 'win'
//   stats: { usedPulse, patrolAlerted, screamerTriggered, stalkerHunted }
export function evaluate(ctx) {
  const out = [];
  const { event, levelIndex, elapsedMs, stats = {} } = ctx;

  if (event === 'death') {
    out.push('first_death');
    return out;
  }

  if (event === 'complete') {
    if (levelIndex === 0 && elapsedMs < 20000) out.push('speedrun_1');
    if (levelIndex === 0 && !stats.usedPulse)  out.push('no_pulse_1');
    if (levelIndex === 5 && !stats.patrolAlerted)     out.push('silent_runner');
    if (levelIndex === 6)                             out.push('water_survivor');
    if (levelIndex === 9)                             out.push('act1_complete');
    if (levelIndex === 13 && !stats.screamerTriggered) out.push('screamer_avoided');
    if (levelIndex === 16 && !stats.stalkerHunted)     out.push('stalker_proof');
  }

  if (event === 'win') {
    out.push('act2_complete');
    out.push('all_levels');
  }

  return out;
}
