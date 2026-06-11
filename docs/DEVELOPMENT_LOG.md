# DEVELOPMENT LOG — RESONANCE

> Append an entry after every completed phase. Most recent entry first.

---

## [Phase 1 — Complete] Crouch / Stealth Mechanic

**Date:** 2026-06-11  
**Commit:** `3933d22`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/input.js`**: Added `_crouching` state; `isCrouching()` export; Shift/C keydown/keyup tracking; `#crouch-btn` touch event handlers (touchstart/touchend/touchcancel).

**`js/entities.js`**: `Player.move()` now accepts 5th param `crouching = false`; adjusts speed by `CROUCH_SPEED_MULT`. `PatrolEnemy` gains `stepAware` field, `alertTimer`/`alertTarget`, and `hearStep(srcX, srcY)` method that sets a 3.5s investigation mode. Investigation state takes priority over normal waypoint patrol.

**`js/waves.js`**: `RaySystem.burst()` accepts optional `countOverride` and `maxDistOverride` (nullish coalescing with existing defaults). Needed to emit fewer/shorter rays when crouching without adding a new method.

**`js/game.js`**: 
- Imports `RAY_COUNT_STEP`, `STEP_RAY_MAX`, and three CROUCH_* constants
- `update()` reads `Input.isCrouching()`; passes flag to `player.move()`
- Step burst: if crouching, emits `ceil(22 × 0.5) = 11` rays at `170 × 0.7 = 119px` max dist; step interval × 2.5
- `PatrolEnemy` step-hearing in `processRayEntities()`: only triggers `hearStep()` if `en.stepAware === true`
- `loadLevel()` now deep-copies grid with `def.grid.map(row => [...row])` — preparation for Phase 3 collapsibles
- `updateHUD()` call passes `crouching` boolean as 5th arg

**`js/renderer.js`**: `updateHUD()` signature gains `crouching = false`; toggles `.active` class on `#crouch-indicator`.

**`index.html`**: Added `#crouch-btn` button inside `#touch-controls`; added `#crouch-indicator` span in `#hud`.

**`css/style.css`**: `#crouch-btn` styled as 56px circle, bottom-center; `#crouch-indicator` dim by default, brightens to `rgba(200,220,255,0.7)` when `.active`.

**`js/levels.js`**: Level 6 "The Whisper" — 20×15 grid with symmetric upper/lower mazes connected by a fully open patrol corridor at row 7. Walls at rows 6 and 8 have only two crossing gaps (col 1 and col 18). `stepAware: true` patrol patrols col 2–17. Normal steps (170px) reach patrol from within the corridor; crouched steps (119px) do not at the patrol's waypoint extremes.

### Design decisions

- `stepAware` flag on individual `PatrolEnemy` instances (not level-wide flag) allows granular control — future levels can mix step-aware and step-deaf patrols.
- Level 6 crossing design: player must enter the patrol corridor through one of two narrow gaps; the patrol always passes within hearing range of normal steps but the crouched step range (119px) creates a safe zone when the patrol is 3+ columns away.

---

## [Phase 0 — Complete] Cleanup & Foundation

**Date:** 2026-06-11  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done
- Created `/docs/` directory with all 6 documentation files (this session).
- `js/constants.js` cleaned up:
  - Removed unused legacy wave constants: `STEP_WAVE_MAX`, `STEP_WAVE_SPEED`, `STEP_WAVE_ALPHA`, `PULSE_WAVE_MAX`, `PULSE_WAVE_SPEED`, `PULSE_WAVE_ALPHA`, `WAVE_RING_W`, `HAZARD_PULSE_MAX`, `HAZARD_PULSE_SPEED`
  - Added new cell type constants: `CELL.COLLAPSIBLE = 4`, `CELL.WATER = 5`
  - Added crouch mechanic constants: `CROUCH_SPEED_MULT`, `CROUCH_INTERVAL_MULT`, `CROUCH_RAY_MULT`, `CROUCH_DIST_MULT`
  - Added water zone constants: `WATER_SPEED_MULT`, `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`, `WATER_ENERGY_DRAIN`
  - Added collapse constants: `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS`
  - Added `ECHO_TRAIL_CAP = 500`

### Pending (still in Phase 0)
- `audio.js` SOUND_CONFIG — not yet added
- `waves.js` ECHO_TRAIL_CAP enforcement — not yet added
- Final commit + push

---

## [Pre-Phase 0] Prototype Complete (Prior Session)

**Date:** ~2026-06-10  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was built
Full working prototype from scratch:
- `index.html` — game shell, canvas, 5 overlay screens, HUD, touch controls
- `css/style.css` — responsive layout, 800×600 centered, mobile scaling
- `js/constants.js` — all game parameters
- `js/utils.js` — dist, normalize, clamp, lerp, tileCenter, segPtDist
- `js/audio.js` — Web Audio procedural synthesis (6 sound functions)
- `js/input.js` — keyboard (WASD/arrows/Space/Esc/P) + touch joystick
- `js/entities.js` — Player, PatrolEnemy, ChaserEnemy, Hazard
- `js/waves.js` — Ray class (DDA), RaySystem (burst, update, pool, echoTrails)
- `js/collision.js` — castRay (DDA grid traversal), resolveWalls, circlesOverlap
- `js/levels.js` — 5 hand-crafted levels (20×15 grids)
- `js/game.js` — G state machine, loadLevel, update, game loop, UI handlers
- `js/renderer.js` — draw pipeline, hearing attenuation, all visual elements
- `js/ui.js` — screen show/hide, hint/message setters

### Key design decisions made
- Replaced circular wave system with DDA ray-based propagation (physically plausible reflections)
- Walls are NEVER drawn — only ray impact glints reveal geometry
- Exit hidden until player ray passes within 28px (`revealedAt` guard)
- Ray speed slowed (340 → 160 px/s), trail persistence extended (1600 → 4200ms)
- Distance attenuation via `hearing(d)` smoothstep applied to ALL visual elements
- Per-segment distance calculation via `segPtDist` for hearing falloff

### Known issues at prototype completion
- echoTrails had no hard cap (just time-based pruning) — addressed in Phase 0
- Several legacy constants from old wave system cluttered constants.js — cleaned in Phase 0
- No crouch, water, collapsibles, crushers, doors, keys, sentries, or blind stalkers
- Only 5 of planned 10 levels
