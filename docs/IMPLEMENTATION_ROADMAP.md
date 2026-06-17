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
**Status:** ⬜ Pending  
**Goal:** All controls work on 375px viewport; crouch button functional on mobile.  
**Depends on:** Phase 1 complete

### Tasks
- [ ] Test at 375px width (iPhone SE)
- [ ] Verify joystick, pulse btn, crouch btn all functional
- [ ] Verify canvas scales correctly
- [ ] Fix any layout issues
- [ ] Commit + push

### Acceptance Criteria
- [ ] All 10 levels completable on mobile touch controls
- [ ] No UI overflow or clipped elements

---

## Phase 14 — Final Polish & Balance
**Status:** ⬜ Pending  
**Goal:** Playtest, balance, title screen demo, performance validation.  
**Depends on:** Phases 1–13 complete

### Tasks
- [ ] Playtest all 10 levels; tune enemy speeds, hazard intervals, collapsible thresholds
- [ ] Title screen: fire a demo pulse from center on load (shows mechanic before play)
- [ ] Screen transitions: brief CSS opacity fade on level-up screen
- [ ] Verify echo trail cap holds under stress (rapid pulse spam)
- [ ] Commit + push tagged release

### Acceptance Criteria
- [ ] All 10 levels completable by a new player within 3 attempts
- [ ] No frame drops below 30fps during heavy pulse
- [ ] No console errors in any level
- [ ] Title screen demo pulse plays on load
