# KNOWN ISSUES — RESONANCE

> Track bugs, tech debt, design concerns, and future improvements here.  
> Format: **[Status]** Issue — Notes

---

## Active Bugs

_None currently confirmed._

---

## Tech Debt

### TD-001 — echoTrails no hard cap
**Status:** ✅ Resolved (Phase 0, `ECHO_TRAIL_CAP = 500` in `constants.js`; enforced in `waves.js` `RaySystem.update()`)  
**Severity:** Medium  
**File:** `js/waves.js` `RaySystem.update()`  
**Resolution:** `ECHO_TRAIL_CAP = 500` constant added and pruning enforced in `RaySystem.update()` — after time-based prune, oldest entries are trimmed to keep total under cap.

---

### TD-002 — Backward-compat shim classes in waves.js
**Status:** ⬜ Low priority  
**Severity:** Low  
**File:** `js/waves.js` lines 201–217  
**Description:** `Wave` and `WaveManager` shim classes at the bottom of waves.js are unused. They were kept for backward compat during the circular→ray migration but nothing imports them.  
**Fix:** Delete both classes after confirming no remaining imports. Search: `import.*Wave` across all JS files.

---

### TD-003 — castRay does not know about doors
**Status:** ✅ Resolved (Phase 5, commit `d1e4e23`)  
**Severity:** Medium  
**File:** `js/collision.js` `castRay`  
**Resolution:** Closed doors are written into the mutable grid as `CELL.WALL` when loaded. `castRay` hits them as regular walls. When a door opens, the cell is reset to `CELL.EMPTY`. `G.doorsByCell` map tracks which wall cells are doors for visual differentiation. No change to `castRay` or `resolveWalls` required.

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

### DC-003 — Level 9 crusher difficulty still too high  
**Status:** ✅ Resolved (commit `842ab09` + follow-up)  
**Severity:** High  
**File:** `js/levels.js` Level 9 "The Corridor"  
**Description:** Despite two rounds of redesign (wide-range long corridors → narrow-range short corridors), Level 9 is still reported as too difficult. The crusher's sinusoidal motion is hard to read as sound alone, and the 6-tile danger zone leaves little margin for error. Players cannot reliably time the crossing using only the echo visualization.  
**Root cause hypotheses:**
1. The crusher's reveal radius is small — the player may not have enough sound information about where the crusher currently is before committing to a dash.
2. The danger crossing window, while mathematically sufficient (~2.75s at period 5.5s), feels tight under the game's limited field of view.
3. No "waiting room" safe zone within the corridor itself — the player must remain at the col 6 entry point while the crusher approaches and turns, which is uncomfortable.

**Proposed fixes (to try in Phase 14):**
- Add an additional interior alcove (single-tile notch) at the midpoint of each corridor where the player can pause mid-crossing if needed.
- Increase crusher reveal radius from `REVEAL_D = 28px` to `48px` so the player hears the crusher from further away.
- Slow final corridor to period 7s (from 5.5s), making the hardest window 3.5s instead of 2.75s.
- Consider replacing the continuous-sine crusher with a "pause at extremes" motion (ease-in/ease-out or step function) so the player has a clear stationary window to cross.
- Defer Level 9 redesign until all phases complete; playtest with fresh eyes then.

---

### DC-004 — All enemy types render as near-identical red dots
**Status:** ⬜ Deferred to Phase 14  
**Severity:** Medium  
**File:** `js/renderer.js` `drawEnemies()`  
**Description:** Under gameplay pressure, players cannot distinguish PatrolEnemy, ChaserEnemy, and BlindStalker from each other — all appear as identical muted-red dots of the same size. The Hazard and Sentry are already visually distinct (Hazard: orange; Sentry: has scan cone), but the three "dot" enemies give no information about behavior or threat level.

**Proposed fix — shape-based differentiation within existing danger palette:**
- **PatrolEnemy**: directional triangle pointing in current movement direction. Communicates "this moves predictably."
- **ChaserEnemy**: circle with a concentric outer ring (ring brightens / expands when in `hunting` state). Communicates "this chases."
- **BlindStalker**: dot with 3 short radiating arcs at 120° intervals (like sound-wave emanating rings). Communicates "this hears everything."
- **Hazard**: already distinct (orange, cross/X shape optional if desired). No change required.
- **Sentry**: already distinct via rotating scan cone arc. Optionally use a diamond dot shape.

**Implementation:** In `renderer.js` `drawEnemies()`, add `instanceof` checks (or a shape property) to switch draw path per entity type. All shapes remain in the existing `rgba(200,70,70)` red danger palette — only shape differs, not color. Shape is drawn at the entity's current position, attenuated by `hearing(d)` like the existing dot.

**Priority:** Phase 14 polish pass — does not block gameplay; purely UX improvement.

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
