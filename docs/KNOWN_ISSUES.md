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
**Status:** ✅ Resolved (Phase 14)  
**Severity:** Medium  
**File:** `js/renderer.js` `drawEnemies()`  
**Resolution:** Each enemy type now has a distinct shape drawn within the same red danger palette:
- **PatrolEnemy**: directional arrowhead triangle pointing toward current waypoint + small center dot.
- **ChaserEnemy**: dot + concentric outer ring that pulses rapidly and brightens when in `hunting` state.
- **BlindStalker**: dot + 3 rotating arcs at 120° spacing that spin faster when hunting (communicates sound awareness).
- **Sentry**: unchanged — rotating scan cone is already visually distinct.
- **Hazard**: unchanged — orange color already provides clear differentiation.

Implementation: `shape` property added to each enemy constructor (`'patrol'`, `'chaser'`, `'stalker'`, `'sentry'`); `drawEnemies()` switches on `e.shape` instead of duck-typing.

---

---

### TD-007 — Vignette gradient recreated every frame
**Status:** ⬜ Fix in Phase 23  
**Severity:** Low-Medium (mobile performance impact)  
**File:** `js/renderer.js` `drawVignette()`  
**Description:** `createRadialGradient()` is called every frame to draw the vignette. On mobile, this adds GPU upload state per frame. Cache the vignette on an offscreen canvas created once at resize and use `drawImage()` each frame instead.  
**Fix:** `let _vignetteCanvas = null` — create on first call or canvas resize, reuse every frame.

---

### TD-008 — No error boundary in game loop
**Status:** ⬜ Fix in Phase 22 (with Sentry)  
**Severity:** Medium  
**File:** `js/game.js` `loop()`  
**Description:** An uncaught exception in `update()` or `Renderer.draw()` silently kills the `requestAnimationFrame` loop. The canvas freezes with no user feedback.  
**Fix:** Wrap the loop body in try/catch. On catch: show an error overlay ("Something went wrong — reload the page"). Wire Sentry.captureException() in production build.

---

### TD-009 — No build pipeline (ES module HTTP requests on load)
**Status:** ⬜ Fix in Phase 15  
**Severity:** Medium (performance on mobile 4G)  
**File:** `index.html`  
**Description:** The browser makes 12+ separate HTTP requests for ES module files on page load. On localhost this is imperceptible. On a mobile 4G connection with 100ms RTT, this adds ~1.2s to initial load time.  
**Fix:** Vite build bundles all modules into a single minified JS file. Phase 15 task.

---

### TD-010 — No level progress persistence
**Status:** ⬜ Fix in Phase 15  
**Severity:** Medium (UX regression — players restart at Level 1 on every refresh)  
**File:** `js/game.js`  
**Description:** `G.levelIndex` is in-memory only. Refreshing the browser resets to Level 1. Acceptable for prototype; unacceptable for a shipped game.  
**Fix:** `localStorage.setItem('resonance_progress', G.levelIndex + 1)` on level complete. Read on init. Phase 15 task.

---

### TD-011 — Enemies are completely silent
**Status:** ⬜ Fix in Phase 17  
**Severity:** **High** (largest gameplay gap vs Dark Echo)  
**File:** `js/entities.js`, `js/audio.js`, `js/game.js`  
**Description:** Enemies do not generate any sound. In Dark Echo, enemy footsteps propagate through the visualization system exactly like the player's, creating tension from ambiguous echoes. In RESONANCE, enemies are invisible and silent until the player's own rays find them. This eliminates ~40% of the psychological tension the concept is capable of generating.  
**Fix:** Add `shouldEmitStep()` to moving enemies; emit `'step-enemy'` ray bursts + positional audio each step. Phase 17 task. Full spec in PRODUCTION_ROADMAP.md.

---

### TD-012 — No positional / binaural audio
**Status:** ⬜ Fix in Phase 17  
**Severity:** High (audio immersion gap)  
**File:** `js/audio.js`  
**Description:** All sounds route directly to `AudioContext.destination`. Enemy alerts play at constant volume and center pan regardless of enemy position. There is no spatial awareness from audio alone.  
**Fix:** Route sounds through `PannerNode` at world coordinates. Update `AudioListener` position with player coordinates each frame. Phase 17 task.

---

### TD-013 — No reverb / room acoustics
**Status:** ⬜ Fix in Phase 18  
**Severity:** Medium-High (atmosphere gap)  
**File:** `js/audio.js`  
**Description:** All sounds are "dry" — no room response. In a cave/tunnel environment, absence of reverb makes sounds feel disconnected from the space. Dark Echo's sounds feel physically present in the environment.  
**Fix:** Add a procedurally-synthesized impulse response buffer → ConvolverNode at 15% wet mix. Phase 18 task.

---

### TD-014 — Ray visual looks like starburst, not wavefront
**Status:** ⬜ Fix in Phase 16  
**Severity:** High (visual identity gap vs Dark Echo)  
**File:** `js/renderer.js`  
**Description:** Active rays render as discrete line segments radiating from origin — a "spoke" or starburst pattern. Dark Echo's sound propagation looks like a coherent expanding ring (sonar wavefront). The underlying DDA mechanics are equivalent; only the rendering differs.  
**Fix:** Group rays by burstId, sort by angle, draw arcs between adjacent tips. Add shockwave origin ring on burst. Phase 16 task. Full spec in PRODUCTION_ROADMAP.md.

---

## Future Improvements (Post v1.0)

| # | Idea | Notes | Target Phase |
|---|---|---|---|
| FI-001 | Procedural level generator | For replay value; hard to guarantee solvability | Post-25 |
| FI-002 | Actual audio samples | Architecture is ready via SOUND_CONFIG | Post-25 |
| FI-003 | Leaderboard (level time) | Needs backend (Supabase); out of current scope | Post-25 |
| FI-004 | Level editor | Would require DOM overlay; medium effort | Post-25 |
| FI-005 | Reverb / echo chamber zones | ConvolverNode — being implemented in Phase 18 | Phase 18 |
| FI-006 | Enemy patrol path visualization in debug | Draw waypoints when debug overlay is active | Post-20 |
| FI-007 | Screen-shake on collapse / death | CSS transform animation — being implemented in Phase 19 | Phase 19 |
| FI-008 | Sound bleeding through thin walls | Attenuated ray energy passing through 1-cell-wide walls | Post-25 |
| FI-009 | Chapter select screen | Navigate between Act I and Act II independently | Phase 24 |
| FI-010 | iOS / App Store release | Capacitor supports iOS; requires Mac + Apple developer account ($99/yr) | Post-25 |
| FI-011 | Colorblind accessibility mode | Alternative color palette for echo/enemy colors | Post-25 |
| FI-012 | Narrative / environmental storytelling | Text fragments revealed by sound; environmental geometry that implies a location | Phase 20 |
