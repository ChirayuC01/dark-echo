# KNOWN ISSUES — RESONANCE

> Track bugs, tech debt, design concerns, and future improvements here.  
> Format: **[Status]** Issue — Notes

---

## Active Bugs

_None currently confirmed._

---

## Tech Debt

### TD-001 — echoTrails no hard cap
**Status:** 🔄 Addressing in Phase 0  
**Severity:** Medium  
**File:** `js/waves.js` `RaySystem.update()`  
**Description:** echoTrails array is pruned by time (`RAY_TRAIL_MS = 4200ms`) but has no absolute cap. During heavy pulse spam or complex levels, the array can grow to thousands of entries before the time window clears, causing GC pressure and potential frame drops.  
**Fix:** Enforce `ECHO_TRAIL_CAP = 500`; trim oldest entries when cap is exceeded after time-based prune.

---

### TD-002 — Backward-compat shim classes in waves.js
**Status:** ⬜ Low priority  
**Severity:** Low  
**File:** `js/waves.js` lines 201–217  
**Description:** `Wave` and `WaveManager` shim classes at the bottom of waves.js are unused. They were kept for backward compat during the circular→ray migration but nothing imports them.  
**Fix:** Delete both classes after confirming no remaining imports. Search: `import.*Wave` across all JS files.

---

### TD-003 — castRay does not know about doors or crushers
**Status:** ⬜ Planned (Phase 4, 5)  
**Severity:** Medium  
**File:** `js/collision.js` `castRay`  
**Description:** `castRay` reads only from the static grid. Doors (closed) and crushers (dynamic) must also block rays, but they aren't in the grid. The current castFn closure in game.js only forwards grid.  
**Fix:** Extend castFn closure to also check `G.doors` (for closed doors) and `G.crushers` (for current positions) as pre-checks before the DDA loop.

---

### TD-004 — PatrolEnemy does not wall-avoid intelligently
**Status:** ⬜ Future improvement  
**Severity:** Low  
**File:** `js/entities.js` `PatrolEnemy.update()`  
**Description:** Patrol follows straight-line waypoints. If a level redesign puts a wall segment between two waypoints, the patrol gets stuck at the wall (resolveWalls pushes it back, it never reaches the waypoint).  
**Fix:** Simple waypoint path validation at level load, or add simple wall-sliding. Not needed for current 5 levels.

---

### TD-005 — ChaserEnemy wander hits walls and resets direction
**Status:** ⬜ Accepted behavior  
**Severity:** Low  
**File:** `js/entities.js` `ChaserEnemy.update()`  
**Description:** When idle, the ChaserEnemy picks a random direction and resets timer on wall contact. This causes rapid direction changes in tight corridors. Visually acceptable; gameplay-wise it means the chaser clusters in open areas.  
**Fix:** Not a priority. Acceptable for current enemy count and level sizes.

---

### TD-006 — No save state / level progression persistence
**Status:** ⬜ Accepted scope decision  
**Severity:** Low  
**Description:** Refreshing the page resets to level 1. `G.levelIndex` is in-memory only. Levels are short enough (60–120s each) that this is acceptable.  
**Fix:** Could add `localStorage.setItem('resonance_level', G.levelIndex)` if requested. Not in current scope.

---

## Performance Concerns

### PC-001 — shadowBlur on large numbers of elements is expensive
**Status:** ✅ Mitigated  
**Description:** Canvas `shadowBlur` triggers GPU compositing. Currently only applied to: player dot (radius 10px glow), exit glow.  
**Decision:** Echo trails and impact glints use NO shadowBlur. Acceptable trade-off.

---

### PC-002 — segPtDist called O(rays × entities) per frame
**Status:** ⬜ Monitoring  
**Description:** `processRayEntities` calls `segPtDist` for every active ray × every entity. With 64 pulse rays and ~10 entities, this is 640 calls/frame during a pulse — trivial. Becomes relevant if entity count or ray count grows significantly.  
**Fix:** Spatial bucketing if entities > 30. Not needed for current 10 levels.

---

## Design Concerns

### DC-001 — Collapsible wall collapse may reveal too much geometry
**Status:** ⬜ Needs playtesting  
**Description:** When a collapsible wall collapses, the 12-ray burst from the collapse point will reveal surrounding geometry including nearby enemies. This might accidentally make certain sections easier.  
**Fix:** Reduce collapse burst ray count or max distance after playtesting.

---

### DC-002 — Water zone difficulty spike
**Status:** 🔄 Addressed in Level 7 design — needs playtesting  
**Description:** Water zones force louder footsteps with no way to compensate (crouch is additive). In a level with a water zone + nearby hearing-reactive enemy, the player may find it near-impossible to cross silently.  
**Fix:** Level 7 uses only `Hazard` enemies in the water zone (not hearing-reactive patrol/chaser). Hazards have fixed pulse intervals; player can time their crossing. No step-aware patrol placed near water zones yet. Re-evaluate if future levels combine water + step-aware enemies.

---

## Future Improvements (Post v1.0)

| # | Idea | Notes |
|---|---|---|
| FI-001 | Procedural level generator | For replay value; hard to guarantee solvability |
| FI-002 | Actual audio samples | Architecture is ready via SOUND_CONFIG |
| FI-003 | Leaderboard (level time) | Needs backend; out of current scope |
| FI-004 | Level editor | Would require DOM overlay; medium effort |
| FI-005 | Reverb / echo chamber zones | ConvolverNode; can be SOUND_CONFIG option |
| FI-006 | Enemy patrol path visualization in debug | Draw waypoints when debug overlay is active |
| FI-007 | Screen-shake on collapse / death | CSS transform animation, low effort |
