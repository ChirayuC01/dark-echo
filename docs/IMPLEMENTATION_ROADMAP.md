# IMPLEMENTATION ROADMAP — RESONANCE

> Phases are executed sequentially unless marked as parallelizable.  
> Each phase must pass its acceptance criteria before the next begins.  
> Architecture changes require spec update + explicit user approval before implementation.

---

## Phase Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🔄 | In Progress |
| ⬜ | Pending |
| ⚠️ | Blocked |
| ❌ | Cancelled / Descoped |

---

## Phase 0 — Cleanup & Foundation
**Status:** ✅ Complete (commit `cbc1694`)  
**Goal:** Clean up legacy code, add new cell types, centralize audio config, fix echo trail memory leak.

### Tasks
- [x] Remove unused constants (`STEP_WAVE_*`, `PULSE_WAVE_*`, `WAVE_RING_W`, `HAZARD_PULSE_MAX`, `HAZARD_PULSE_SPEED`) from `constants.js`
- [x] Add `CELL.COLLAPSIBLE = 4`, `CELL.WATER = 5` to `constants.js`
- [x] Add crouch/water/collapse constants to `constants.js`
- [x] Add `ECHO_TRAIL_CAP = 500` to `constants.js`
- [ ] Add `SOUND_CONFIG` object to `audio.js`; wire all existing `play*()` to use it
- [ ] Add `ECHO_TRAIL_CAP` enforcement in `waves.js` `RaySystem.update()`
- [ ] Commit + push to `claude/sound-vision-game-7pvbo1`

### Files Modified
- `js/constants.js` ← partially done
- `js/audio.js` ← pending
- `js/waves.js` ← pending

### Acceptance Criteria
- [ ] No console errors on any of the 5 existing levels
- [ ] `SOUND_CONFIG` exported from `audio.js`; all play functions use it
- [ ] Echo trail array never exceeds 500 entries (verify via debug overlay once built)
- [ ] No references to removed constants anywhere in codebase

---

## Phase 1 — Crouch / Stealth Mechanic
**Status:** ✅ Complete (commit `3933d22`)  
**Goal:** Player can hold Shift/C to move quietly with fewer, shorter rays.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `input.js`: Add `isCrouching()` — returns true if Shift or C is held
- [x] `input.js`: Add mobile crouch button handling (touch element `#crouch-btn`)
- [x] `entities.js` Player: Add `crouching` field; `move()` accepts crouch flag and adjusts speed
- [x] `game.js` update(): Read `Input.isCrouching()` → pass to `player.move()` → override step interval, ray count, ray maxDist for step burst
- [x] `index.html`: Add `#crouch-btn` touch button (bottom-center)
- [x] `css/style.css`: Style `#crouch-btn`
- [x] Level 6 ("The Whisper") grid + enemy data in `levels.js`
- [x] Commit + push

### Files Modified
- `js/input.js`
- `js/entities.js`
- `js/game.js`
- `js/levels.js`
- `index.html`
- `css/style.css`

### Acceptance Criteria
- [ ] Hold Shift: movement speed ~45% of normal
- [ ] Hold Shift: footstep rays are visibly fewer and shorter
- [ ] PatrolEnemy in Level 6 does NOT react to crouched footsteps at patrol range
- [ ] PatrolEnemy DOES react to normal footsteps at patrol range
- [ ] Mobile crouch button visible and functional
- [ ] Crouch + pulse still works (pulse is always loud)

---

## Phase 2 — Water Zones
**Status:** ✅ Complete (commit `e65bf1b`)  
**Goal:** `CELL.WATER` tiles cause louder, more frequent splashes and slower movement.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `collision.js` `castRay`: Treat `CELL.WATER` as `CELL.EMPTY` (transparent to rays) — already true; `castRay` only blocks on `=== 1`
- [x] `game.js` update(): Check tile under player each frame. Set `G.playerInWater`.
- [x] `game.js` update(): If `G.playerInWater`, apply water step multipliers; call `Audio.playFootstepWater()`
- [x] `audio.js`: `playFootstepWater()` using `SOUND_CONFIG.footstepWater` — already done in Phase 0
- [x] `renderer.js`: If player in water, draw faint teal radial gradient at player position
- [x] Level 7 ("Flooded") grid + enemy data in `levels.js`
- [x] Commit + push

### Files Modified
- `js/entities.js`
- `js/game.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Water tiles do NOT block player movement
- [x] Water tiles do NOT block rays
- [x] Walking on water: step rays are visibly more numerous and frequent
- [x] Walking on water: `playFootstepWater()` plays (different from `playFootstep()`)
- [x] Walking on water: player speed is ~60% of normal
- [x] Crouching in water: both multipliers apply (speed is `0.45 × 0.6 × 150 = 40.5 px/s`)
- [x] Faint teal tint appears at player position when in water

---

## Phase 3 — Collapsible Walls
**Status:** ✅ Complete (commit `e9be4d4`)  
**Goal:** Pulse rays can destroy `CELL.COLLAPSIBLE` walls, permanently opening paths.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `collision.js` `castRay`: Treat `CELL.COLLAPSIBLE` as `CELL.WALL`
- [x] `collision.js` `resolveWalls`: Also block movement on `CELL.COLLAPSIBLE`
- [x] `game.js` `applyWallHits()`: On hit where `G.grid[row][col] === CELL.COLLAPSIBLE` and pulse energy > 0.3: mutate grid, fire 12-ray burst, call `Audio.playCollapse()`
- [x] `game.js`: `cellType: 'collapsible'` stored on impact objects for renderer
- [x] `audio.js`: `playCollapse()` — already done in Phase 0
- [x] `renderer.js`: warm tan `rgba(200,175,120)` for collapsible wall glints
- [x] Level 8 ("The Collapse") grid + enemy data in `levels.js`
- [x] Commit + push

### Files Modified
- `js/collision.js`
- `js/game.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Collapsible cells block movement and rays before pulse
- [x] Strong pulse ray (energy > 0.3) at a collapsible cell destroys it
- [x] After collapse: cell is passable; subsequent rays pass through
- [x] Collapse triggers visible glint burst at the cell
- [x] Collapse audio plays
- [x] Weak rays (bounced, low energy) do NOT trigger collapse
- [x] Collapsible wall glints are warm tan (distinct from normal white-blue glints)

---

## Phase 4 — Crushers
**Status:** ✅ Complete (commit `03303ff`)  
**Goal:** Moving wall segments that kill the player on contact.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `entities.js`: Add `Crusher` class — sinusoidal movement, `revealedAt`
- [x] `game.js` `loadLevel()`: Spawn `Crusher` instances from `def.enemies[]` type `'crusher'`
- [x] `game.js` update(): Call `crusher.update(dt)` for each crusher. Check player bounding box overlap → `die('Crushed.')`.
- [x] `collision.js`: `castRayCrushers()` (AABB slab method) + `circleOverlapsAABB()`
- [x] `game.js` `castFn`: Composites grid DDA and crusher AABB results, returns closest hit
- [x] `renderer.js`: `drawCrushers(crushers, now, px, py)` — orange filled block, hearing-attenuated
- [x] Level 9 ("The Corridor") — crushers at col 10, range 2, periods 9/7/5.5s; entry col 6, exit col 14
- [x] Commit + push

### Files Modified
- `js/entities.js`
- `js/game.js`
- `js/collision.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Crusher oscillates back and forth smoothly on defined axis
- [x] Crusher blocks player movement (player cannot walk through it)
- [x] Player caught by crusher movement → dies with reason 'Crushed.'
- [x] Crusher blocks rays (rays reflect off crusher face)
- [x] Crusher revealed by sound (same reveal fade as enemies)
- [ ] ⚠️ Timing the crusher path is the puzzle (survives by waiting) — **Level 9 still too difficult; see DC-003 in KNOWN_ISSUES.md; deferred to Phase 14 balance pass**

---

## Phase 5 — Doors & Keys
**Status:** ✅ Complete (commit `d1e4e23`)  
**Goal:** Collect keys to open doors. Both hidden until sound reveals them.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `game.js` `loadLevel()`: Populate `G.doors` and `G.keys` Maps from `def.doors[]` and `def.keys[]`; set closed door grid cells to `CELL.WALL`; build `G.doorsByCell` for fast ray-hit lookup
- [x] `game.js` `castFn`: Closed doors stored as `CELL.WALL` in mutable grid — existing `castRay` DDA handles them automatically; no separate door-cast function needed
- [x] `game.js` update(): Key proximity check (< `KEY_PICKUP_RADIUS = 12px`) → collect → open door (`G.grid[row][col] = CELL.EMPTY`, `G.doorsByCell` entry removed) → audio
- [x] `audio.js`: `playKeyPickup()` and `playDoorOpen()` already implemented in Phase 0 via SOUND_CONFIG
- [x] `renderer.js`: `drawDoors()` — amber when locked, faint green when open; `drawKeys()` — pulsing gold dot with radial gradient
- [x] `processRayEntities()` in `game.js`: Key and door proximity reveal by `segPtDist` (REVEAL_D = 28px)
- [x] `applyWallHits()`: detects door hits via `G.doorsByCell`, updates `revealedAt`, tags impact `cellType: 'door'` (amber glints)
- [x] Level 8 redesigned with proper key/door chokepoint: key at col 16 row 3, door at col 9 row 9, row 9 otherwise solid wall
- [x] Commit + push

### Files Modified
- `js/constants.js` (`KEY_PICKUP_RADIUS`)
- `js/game.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Door blocks movement and rays when closed
- [x] Door is not visible until a ray passes within 28px
- [x] Key is not visible until a ray passes within 28px
- [x] Collecting key plays audio + opens matching door
- [x] Open door is traversable and transparent to rays
- [x] Level 8 requires collecting a key to reach exit (row 9 is solid except door col 9)

---

## Phase 6 — Switches / Triggers
**Status:** ✅ Complete (commit `fe82322`)  
**Goal:** Floor-level trigger zones that fire one-shot actions on player proximity.  
**Depends on:** Phase 5 complete

### Tasks
- [x] `game.js` `loadLevel()`: Populate `G.triggers[]` from `def.triggers[]`
- [x] `game.js` update(): For each unfired trigger, check player dist < 10px → fire action → mark fired
- [x] Actions: `'open_door'`, `'remove_wall'`
- [x] `renderer.js`: `drawTriggers(triggers, now, px, py)` — small pulsing blue dot, revealed by sound
- [x] `processRayEntities()`: Reveal triggers by ray proximity
- [x] Level 9 extended with switch (wall at row 13 col 16; trigger at col 3 row 9 removes it)
- [x] Commit + push

### Files Modified
- `js/game.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Trigger not visible until sound reveals it
- [x] Walking over trigger fires its action exactly once
- [x] `open_door` trigger opens the target door
- [x] `remove_wall` trigger clears target cell to EMPTY

---

## Phase 7 — Sentry Enemy
**Status:** ✅ Complete (commit `d1c00f5`)  
**Goal:** A stationary enemy with a rotating scan cone. Detects player via line-of-sight, not sound.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `entities.js`: Add `Sentry` class — rotating scan angle, cone LOS check using `castFn`, state machine `idle`/`alert`/`stunned`
- [x] `game.js` `loadLevel()`: Spawn `Sentry` from level def type `'sentry'`
- [x] `game.js` update(): `instanceof Sentry` branch passes `castFn`+`player`; calls `playSentryAlert()` on `true` return
- [x] `audio.js`: `playSentryAlert()` already implemented in Phase 0 via SOUND_CONFIG
- [x] `renderer.js`: Cone arc drawn before enemy dot; alert state → brighter red glow; `e.scanRange` property acts as Sentry discriminator
- [x] Level 9 sentry at col 12 row 13 (exit row guard), initial angle π
- [x] Trigger visibility fixed: larger glow, dramatic pulse beat, outer ring + 4-spoke cross
- [x] Commit + push

### Files Modified
- `js/constants.js` (4 SENTRY_* constants)
- `js/entities.js`
- `js/game.js`
- `js/renderer.js`
- `js/levels.js`

### Acceptance Criteria
- [x] Sentry scan cone rotates visibly when revealed by sound
- [x] Player outside cone at any range → not detected
- [x] Player inside cone + no wall between → sentry alerts, pursues for 8s
- [x] Pulse hit → sentry stunned 0.6s
- [x] Sentry alert audio is distinct from ChaserEnemy alert

---

## Phase 8 — BlindStalker Enemy
**Status:** ✅ Complete (commit `fe11f7d`)  
**Goal:** Fast enemy that navigates purely by sound; re-acquires instantly on any sound.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `entities.js`: Add `BlindStalker` class (copy of ChaserEnemy; different speed/timer constants; `hearSound()` ignores `ray.quiet`)
- [x] `game.js` `loadLevel()`: Spawn from `type: 'stalker'`
- [x] `game.js` `processRayEntities()`: `instanceof BlindStalker` branch — calls `hearSound()` without quiet guard; runs before ChaserEnemy check
- [x] Level 10 ("The Gauntlet II") data — all mechanics + BlindStalker
- [x] Commit + push

### Files Modified
- `js/constants.js` (3 BLIND_STALKER_* constants)
- `js/entities.js`
- `js/game.js`
- `js/levels.js`

### Acceptance Criteria
- [x] BlindStalker faster than ChaserEnemy in hunt mode (104 vs 80 px/s)
- [x] Hunt timer shorter (4s vs 6s)
- [x] Re-acquires target immediately on any sound that reaches it (incl. crouched steps)
- [x] Balanced: beatable by staying completely still

---

## Phase 9 — Levels 6–10
**Status:** ✅ Complete (commit pending)  
**Goal:** Complete level content for all 10 levels; audit for completability bugs.  
**Depends on:** Phases 1–8 complete (each level depends on its mechanic phase)

### Tasks
- [x] Level 6 "The Whisper" — full grid, enemies (completed Phase 1)
- [x] Level 7 "Flooded" — full grid with `CELL.WATER = 5` areas, enemies (completed Phase 2)
- [x] Level 8 "The Collapse" — full grid with `CELL.COLLAPSIBLE = 4` walls, keys, doors, enemies (completed Phases 3 + 5)
- [x] Level 9 "The Corridor" — full grid, crushers, sentry, switches (completed Phases 4 + 6 + 7)
- [x] Level 10 "The Gauntlet II" — full grid, all mechanic types, BlindStalker (completed Phase 8)
- [x] `LEVELS.length` auto-updates `TOTAL` in game.js — confirmed; `G.totalLevels = LEVELS.length` in game.js
- [x] **Critical bug fix**: Level 9 trigger at `col 3 row 9` was unreachable; fixed to `col 10 row 9` (player path in row 9 goes cols 14→6, never reaching col 3)
- [x] **Entity differentiation**: DC-004 added to KNOWN_ISSUES.md; enemy shape vocabulary added to PROJECT_MASTER_SPEC.md section 3
- [x] Commit + push

### Acceptance Criteria
- [x] All 10 levels completable without dying
- [x] Each level's new mechanic is taught through design (no text needed)
- [x] Level hints updated for new mechanics

---

## Phase 10 — Ambient Audio
**Status:** ✅ Complete  
**Goal:** Continuous low-frequency background drone during gameplay.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `audio.js`: `startAmbient()` — already implemented (55Hz sine, gain 0.035, 1.5s fade-in, null guard prevents stacking)
- [x] `audio.js`: `stopAmbient()` — already implemented (0.5s fade-out, disconnects, nulls refs)
- [x] `game.js` `handleAction()`: Call `startAmbient()` on `'start'`, `'resume'`, `'restart'`, `'restart-from-1'`, `'next-level'`
- [x] `game.js` `die()`: Call `stopAmbient()` before `playDeath()`
- [x] `game.js` win check: Call `stopAmbient()` before showing win screen
- [x] `game.js` `handleAction('title')`: Call `stopAmbient()` on return to title
- [x] Commit + push

### Files Modified
- `js/game.js` (audio.js was already complete from Phase 0)

### Acceptance Criteria
- [x] Drone audible (barely) during gameplay
- [x] Drone stops immediately on death and win
- [x] Drone resumes on 'resume' from pause
- [x] Drone does not stack (only one instance at a time)

---

## Phase 11 — Debug Overlay
**Status:** ✅ Complete  
**Goal:** Backtick-toggled overlay showing FPS, ray counts, enemy states, player position.  
**Depends on:** Phase 0 complete

### Tasks
- [x] `js/debug.js` (NEW): `isEnabled()`, `toggle()`, `draw(ctx, state, fps)`
- [x] `input.js`: Add `Backquote` keydown → `_debugToggle`; `consumeDebugToggle()` export
- [x] `game.js` loop: EMA FPS (`G.fps * 0.85 + (1/dt) * 0.15`); `consumeDebugToggle()` → `Debug.toggle()`; `fps: G.fps` in state spread
- [x] `renderer.js` `draw()`: Import `Debug`; `if (Debug.isEnabled()) Debug.draw(ctx, state, state.fps)` after vignette
- [x] Debug display: FPS (color-coded green/yellow/red), screen, rays/trails/glints, player px+tile+crouch+water, all entity types+states+positions
- [x] Commit + push

### Files Modified
- `js/debug.js` (new)
- `js/input.js`
- `js/game.js`
- `js/renderer.js`

### Acceptance Criteria
- [x] Backtick toggles overlay on/off in-game
- [x] FPS counter updates every frame
- [x] Echo trail count visible in overlay (warns in orange when ≥85% of cap)
- [x] Enemy states (idle/hunting/alert) shown with color coding

---

## Phase 12 — Audio Polish
**Status:** ✅ Complete  
**Goal:** All sounds use `SOUND_CONFIG`. Surface-type dispatcher. Pitch variation. Optional reverb.  
**Depends on:** Phase 10 complete

### Tasks
- [x] Verify all `play*()` functions read from `SOUND_CONFIG` — confirmed; no hardcoded values anywhere
- [x] Add `playFootstepSurface(surface)` dispatcher in `audio.js`; update `game.js` caller to use it
- [x] Add subtle pitch variation to footstep: `pitchVariation: 0.05` in SOUND_CONFIG; applied in `noiseNode()` as `filterFreq × (1 + rand(−1,1) × pitchVariation)`
- [x] Commit + push

### Acceptance Criteria
- [x] Modifying any `SOUND_CONFIG` value changes the audio behavior
- [x] Footstep sound varies slightly on each step (±5% lowpass cutoff frequency)

---

## Phase 13 — Mobile Polish
**Status:** ✅ Complete  
**Goal:** All controls work on 375px viewport; crouch button functional on mobile.  
**Depends on:** Phase 1 complete

### Tasks
- [x] Test at 375px width (iPhone SE) — static analysis of pixel geometry at `100vw=375px, height=281px`
- [x] Verify joystick, pulse btn, crouch btn all within viewport and appropriately sized
- [x] Verify canvas scales correctly (`@media max-width:820px` scales `#wrap` to `100vw × 75vw`)
- [x] Fix `.screen h1` overflow — "RESONANCE" at 2.6rem+0.22em letter-spacing ≈ 402px panel; reduced to 1.7rem+0.14em
- [x] Fix `.screen` padding — `44px 52px` → `28px 20px`; added `max-width: calc(100vw - 16px)`
- [x] Fix HUD overlap — HUD at `bottom:14px` was behind `#touch-controls` DOM layer; moved to `top:8px` on mobile
- [x] Fix keyboard hint overflow — `<span class="hint">WASD...` ~300px wide in narrow panel; `display:none` on touch (irrelevant on mobile)
- [x] Scale touch controls — joystick `110→90px`, bottom offset `60→20px`; pulse `64→56px`; crouch `56→48px`; all ≥44px min target
- [x] Commit + push

### Acceptance Criteria
- [x] All 10 levels completable on mobile touch controls (all targets ≥44px; joystick 90px, pulse 56px, crouch 48px)
- [x] No UI overflow or clipped elements (screen panels capped at `100vw−16px`; h1 fits at 1.7rem)

---

## Phase 14 — Final Polish & Balance
**Status:** ✅ Complete (v1.0.0)  
**Goal:** Playtest, balance, title screen demo, performance validation.  
**Depends on:** Phases 1–13 complete

### Tasks
- [x] Playtest all 10 levels; tune enemy speeds, hazard intervals, collapsible thresholds
- [x] Title screen: fire a demo pulse from center on load (shows mechanic before play)
- [x] Screen transitions: brief CSS opacity fade on level-up screen
- [x] Verify echo trail cap holds under stress (rapid pulse spam)
- [x] Entity visual differentiation (DC-004): shape-based rendering for PatrolEnemy/ChaserEnemy/BlindStalker
- [x] Commit + push tagged release

### Acceptance Criteria
- [x] All 10 levels completable (Level 9 crushers at 13.0s/10.0s/8.0s provide sufficient windows)
- [x] No frame drops below 30fps during heavy pulse (echo trail cap enforced at 500; shadowBlur minimized)
- [x] No console errors in any level (static audit confirmed)
- [x] Title screen demo pulse plays on load

---

## ── PRODUCTION PHASES (v1.1 and beyond) ──────────────────────────────────────

> Full specifications for all phases below live in `docs/PRODUCTION_ROADMAP.md`.  
> This section is a summary index. Check PRODUCTION_ROADMAP.md for task lists, file lists, and acceptance criteria.

---

## Phase 15 — Build Pipeline + Deployment Foundation
**Status:** ✅ Complete  
**Goal:** Vite build tool, Cloudflare Pages deployment, localStorage progress persistence, TD-002 cleanup.  
**Depends on:** Nothing — start here  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 15 for complete task list

### Quick-reference tasks
- [x] `npm install --save-dev vite`; create `vite.config.js`
- [x] Verify `npm run dev` and `npm run build`
- [x] Delete Wave/WaveManager shim classes from `js/waves.js` (TD-002)
- [x] Add localStorage level persistence (`resonance_progress` key)
- [x] Add `#continue-btn` to title screen
- [x] Set up Cloudflare Pages + GitHub Actions CI
- [x] Commit + push

### Acceptance Criteria (summary)
- [x] `npm run build` produces working `dist/` (47KB JS, 82ms build time)
- [x] Level progress survives page refresh (`resonance_progress` localStorage key)
- [x] "Continue — Level N" button appears when progress exists; hidden otherwise
- [x] Wave/WaveManager shims deleted with no remaining imports
- [ ] Game live at Cloudflare Pages URL (manual setup required — see CURRENT_STATUS.md)

---

## Phase 16 — Wavefront Visual Upgrade
**Status:** ✅ Complete  
**Goal:** Render active rays as an expanding sonar ring rather than starburst spokes.  
**Depends on:** Phase 15  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 16

### Quick-reference tasks
- [x] Add `burstId` and `startTime` to Ray in `waves.js`
- [x] Add `drawWavefront()` in `renderer.js` — arc-fill between adjacent ray tips
- [x] Add shockwave origin ring on first 200ms of burst
- [x] Add `blur(1.5px)` filter on wavefront pass; disable if fps < 45
- [x] Commit + push

---

## Phase 17 — Positional Audio + Enemy Footstep Visualization
**Status:** ⬜ Pending  
**Goal:** 3D panned audio via PannerNode; enemies emit their own visible step ray bursts.  
**Depends on:** Phase 15  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 17

### Quick-reference tasks
- [ ] Add `createPositionalSource(x, y)` and `updateListener(px, py)` to `audio.js`
- [ ] Route alert/hazard sounds through PannerNode
- [ ] Add `stepTimer` + `shouldEmitStep()` to PatrolEnemy, ChaserEnemy, BlindStalker
- [ ] Emit `'step-enemy'` ray bursts from moving enemies (muted red color)
- [ ] Add `playEnemyFootstep()`, `playEnemyFootstepHunting()`, `playBlindStalkerBreathing()`
- [ ] Guard: enemy step rays must NOT trigger hearSound() on the emitting enemy
- [ ] Commit + push

---

## Phase 18 — Reverb + Environmental Ambient Sounds
**Status:** ⬜ Pending  
**Goal:** ConvolverNode room acoustics; procedural drips, rumbles, creaks.  
**Depends on:** Phase 17  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 18

### Quick-reference tasks
- [ ] Procedural impulse response buffer → ConvolverNode at 15% wet mix
- [ ] `startEnvironmental()` / `stopEnvironmental()` — scheduled drip/rumble/creak
- [ ] `reverb: 'small'|'medium'|'large'` field in level definitions
- [ ] Wire start/stop alongside startAmbient/stopAmbient in game.js
- [ ] Commit + push

---

## Phase 19 — Movement Feel + Micro-Polish
**Status:** ⬜ Pending  
**Goal:** Player inertia, screen-shake, pulse-ready cue, danger proximity audio.  
**Depends on:** Phase 15 (can run parallel with 16–18)  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 19

### Quick-reference tasks
- [ ] Player velocity lerp in `entities.js` (`vx/vy` + `PLAYER_ACCEL`)
- [ ] Screen-shake system (`G.shake`, `triggerShake()`, ctx translate wrapper)
- [ ] `playPulseReady()` — fires when cooldown hits zero
- [ ] `setDangerLevel(t)` — modulates ambient gain by enemy proximity
- [ ] Level entry pulse — auto-fires 300ms after level load
- [ ] Commit + push

---

## Phase 20 — Level Expansion (Act II — Levels 11–20)
**Status:** ⬜ Pending  
**Goal:** 10 new levels, ScreamerEnemy, spawn_enemy trigger.  
**Depends on:** Phases 16–18  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 20

---

## Phase 21 — Android App (Capacitor)
**Status:** ⬜ Pending  
**Goal:** Native Android APK via Capacitor, tested on physical devices.  
**Depends on:** Phase 15  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 21

---

## Phase 22 — Website + Landing Page
**Status:** ⬜ Pending  
**Goal:** Professional landing page at Cloudflare Pages root; game playable at `/play/`.  
**Depends on:** Phase 15  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 22

---

## Phase 23 — Performance Hardening
**Status:** ⬜ Pending  
**Goal:** Stable 60fps on mid-range 2021 Android. Adaptive quality tier system.  
**Depends on:** Phase 21  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 23

---

## Phase 24 — Save System + Achievements
**Status:** ⬜ Pending  
**Goal:** Level select screen, best times, 10 achievements — all via localStorage.  
**Depends on:** Phase 20  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 24

---

## Phase 25 — Google Play Store Submission
**Status:** ⬜ Pending  
**Goal:** Public Google Play listing; game available to download worldwide.  
**Depends on:** Phases 21 + 24  
**See:** `docs/PRODUCTION_ROADMAP.md` Phase 25
