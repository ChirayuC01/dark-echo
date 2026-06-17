# CHANGELOG — RESONANCE

> Format: `## [vX.Y] — Date — Phase N`  
> Follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased] — Phase 12 pending

---

## [v0.16.0] — 2026-06-17 — Phase 11

### Added
- **Debug overlay** (`js/debug.js`): Backtick key toggles a diagnostic panel in the top-left corner during gameplay
  - FPS counter (EMA, color-coded: green ≥55fps / yellow ≥30fps / red <30fps)
  - Active ray count, echo trail count (warns orange when ≥85% of 500-cap), impact glint count
  - Player pixel coordinates + tile coordinates, crouch flag, water flag
  - All entities listed by type (constructor name), current state, and position
  - Entity lines color-coded: hunting/alert states in coral; idle in muted rose
  - Semi-transparent dark panel with faint blue border, monospace font, drawn above vignette
- `js/input.js`: `Backquote` key sets `_debugToggle`; new `consumeDebugToggle()` export
- `js/game.js`: FPS tracked as exponential moving average in `G.fps`; debug toggle consumed each frame; `fps` forwarded in state spread to renderer
- `js/renderer.js`: imports `Debug`; calls `Debug.draw()` as final draw step

---

## [v0.15.0] — 2026-06-17 — Phase 10

### Added
- **Ambient audio drone**: Continuous 55Hz sine wave plays quietly during all gameplay
  - `startAmbient()` / `stopAmbient()` in `audio.js` were already implemented from Phase 0; this phase wires them to game events
  - Drone fades in over 1.5s on game start; fades out over 0.5s on death or win
  - `game.js` `handleAction()`: `startAmbient()` called on `'start'`, `'resume'`, `'restart'`, `'restart-from-1'`, `'next-level'`
  - `game.js` `die()`: `stopAmbient()` called before `playDeath()` — drone stops before death sound plays
  - `game.js` `checkExit()`: `stopAmbient()` called in win branch before showing win screen
  - `game.js` `handleAction('title')`: `stopAmbient()` on returning to title screen
  - Null guard in `startAmbient()` prevents stacking across rapid calls; safe to call on every gameplay entry

---

## [v0.14.0] — 2026-06-17 — Phase 9

### Fixed
- **Level 9 trigger placement bug (critical)**: The `remove_wall` trigger was placed at `col 3, row 9` — unreachable in normal play. Player path in row 9 enters at col 14 (gap in row 8 wall) and exits at col 6 (gap in row 10 wall), never crossing col 3. Trigger moved to `col 10, row 9` (mid-path), ensuring the wall at row 13 col 16 is always removed before the player reaches the exit sprint.

### Documentation
- **DC-004 added to KNOWN_ISSUES.md**: All three "dot" enemy types (PatrolEnemy, ChaserEnemy, BlindStalker) are visually identical under pressure. Proposed shape vocabulary documented:
  - PatrolEnemy → directional triangle (movement direction)
  - ChaserEnemy → circle + outer ring (ring brightens when hunting)
  - BlindStalker → dot + 3 radiating arcs at 120° (communicates sound-awareness)
  - Deferred to Phase 14 polish pass
- **PROJECT_MASTER_SPEC.md section 3** updated with enemy shape vocabulary table

---

## [v0.13.0] — 2026-06-16 — Phase 8

### Added
- **BlindStalker enemy**: fast sound-hunter that detects all noise including crouched footsteps
  - `BlindStalker` class in `entities.js`: same state machine as `ChaserEnemy` but hears everything
  - Hunt speed: 104 px/s (`CHASER_SPEED_HUNT × 1.3`); idle speed: 30 px/s
  - Hunt timer: 4 seconds (shorter than ChaserEnemy's 6s)
  - `hearSound()` called by `processRayEntities()` for all step and pulse rays, ignoring `ray.quiet` flag — crouching does NOT hide the player from it
  - Re-acquires instantly on each new sound before timer expires
  - 3 new constants: `BLIND_STALKER_SPEED_IDLE`, `BLIND_STALKER_SPEED_HUNT`, `BLIND_STALKER_HUNT_DURATION`
  - Spawn from `type: 'stalker'` in level def enemies array
- **Level 10 "The Gauntlet II"**: all mechanics combined, BlindStalker introduced
  - BlindStalker at col 15 row 5 — hears the forced pulse at col 5 row 5
  - Collapsible wall at col 5 row 5 blocks path to key; player must pulse it (alerting stalker)
  - Key at col 2 row 7; door at col 10 row 10 — key/door chokepoint
  - Water zone in row 3 (cols 2–8, 10–17) with two hazards bracketing the dry path at col 9
  - Step-aware patrol sweeps row 9 (player must crouch to cross)
  - Horizontal crusher in row 11 (range 3, period 5.5s)
  - Sentry at col 14 row 13 guards the final sprint to exit

---

---

## [v0.12.0] — 2026-06-16 — Phase 7

### Added
- **Sentry enemy**: stationary guard with rotating visual scan cone
  - `Sentry` class in `entities.js`: state machine `idle`/`alert`/`stunned`
  - Scan cone: 90° arc (±45°), 180px range, rotates at 60°/s
  - Detection: player must be inside cone AND have clear line-of-sight (castFn ray check)
  - On spot: 8-second pursuit at `CHASER_SPEED_HUNT = 80 px/s`
  - Pulse hit: stuns 0.6s (same as PatrolEnemy)
  - 4 new constants: `SENTRY_SCAN_RANGE`, `SENTRY_SCAN_ARC`, `SENTRY_SCAN_SPEED`, `SENTRY_HUNT_DURATION`
  - `playSentryAlert()` already present in `audio.js` from Phase 0
- **Sentry cone rendered** in `drawEnemies()`: faint orange arc in idle, bright red in alert; drawn behind enemy dot; `e.scanRange` field acts as Sentry discriminator in renderer
- Level 9 "The Corridor" now has sentry at row 13 col 12 guarding the exit sprint

### Changed
- **Trigger visual** — now much more noticeable:
  - Larger outer glow (28px radius, was 16px)
  - More dramatic pulse beat (0.35–0.80 amplitude swing, was 0.50–0.75)
  - Pulsing outer ring stroke
  - Slow-rotating 4-spoke cross indicator distinguishes it from key/exit/door dots
  - Brighter center dot (4.5px, was 3px)

---

## [v0.11.0] — 2026-06-16 — Phase 6

### Added
- **Switches / triggers mechanic**: one-shot floor trigger zones revealed by sound
  - `G.triggers[]` array in game state; populated from `def.triggers[]` level def field
  - Trigger format: `{ col, row, action, targetId }` — action is `'open_door'` or `'remove_wall'`
  - Triggers revealed by ray proximity (same 28px `REVEAL_D` threshold as exit/key/door)
  - Player walks within 10px of trigger center → fires exactly once; `fired = true` prevents re-trigger
  - `'open_door'`: opens the door with matching `targetId` (same logic as key pickup)
  - `'remove_wall'`: clears `G.grid[row][col]` at the `"row,col"` coordinate in `targetId`
  - `drawTriggers()` in `renderer.js`: bright blue-white `rgba(100,160,255)` pulsing radial dot; disappears on fire; `sin(now/350)` pulse distinguishes from keys (400ms) and exit (500ms)
- Level 9 "The Corridor" extended with trigger puzzle:
  - Wall at row 13 col 16 blocks direct path to exit
  - Trigger at row 9 col 3 removes it — fires naturally as player walks left toward corridor 3 entry
  - Hint updated: "A switch unlocks the exit · Watch for the crusher · Wait, then dash"

---

## [v0.10.0] — 2026-06-12 — Phase 5

### Added
- **Doors & keys mechanic**: hidden collectibles that unlock blocked passages
  - `KEY_PICKUP_RADIUS = 12` in `constants.js`
  - `G.doors: Map<id, {col, row, x, y, open, revealedAt}>` — closed doors are written into the mutable grid as `CELL.WALL`; opening restores `CELL.EMPTY`
  - `G.keys: Map<id, {col, row, x, y, collected, doorId, revealedAt}>` — player walks within 12px to collect
  - `G.doorsByCell: Map<"row,col", door>` — fast lookup to identify which wall hits are doors
  - Key pickup: `Audio.playKeyPickup()` + matching door opens instantly + `Audio.playDoorOpen()`
  - Doors and keys revealed by ray proximity (same 28px threshold as exit)
  - Door impact glints render amber `rgba(210,160,50)` — distinct from regular wall glints
  - `drawDoors()` in `renderer.js`: amber fill+stroke locked; faint green open; hearing-attenuated
  - `drawKeys()` in `renderer.js`: gold `rgba(255,210,80)` pulsing radial gradient dot
- Level 8 "The Collapse" redesigned with key/door chokepoint:
  - Row 9 all-walls except col 9 (door) — only passage from middle zone to lower section
  - Key at col 16, row 3 (upper section; near chaser at col 14)
  - Door unlocks when key collected; lower section then accessible
  - Simplified lower section: wide open rows 10 + 12, col 18 corridor to exit col 18 row 13

---

## [v0.9.0] — 2026-06-12 — Phase 4

### Added
- **Crusher mechanic**: moving lethal wall segments
  - `Crusher` class in `entities.js`: sinusoidal `h`/`v` axis motion, TILE-sized AABB
  - Random start phase per crusher — avoids synchronized movement on level load
  - `castRayCrushers()` in `collision.js`: AABB slab-method ray intersection, returns closest crusher hit
  - `circleOverlapsAABB()` in `collision.js`: player vs crusher kill check
  - `castFn` now composites grid DDA and crusher slab results, returns closest hit
  - Crushers revealed by ray proximity (`processRayEntities`) and direct ray bounce (`applyWallHits`)
  - Crusher kill: `circleOverlapsAABB` overlap → `die('Crushed.')`
  - Crusher impacts render in orange (same palette as hazard) via `cellType: 'crusher'` on impact objects
  - `drawCrushers()` in `renderer.js`: orange filled+stroked block, hearing-attenuated, glow
- Level 9 "The Corridor" — 3 corridors (rows 3, 5, 7), one crusher each (5.0s / 3.5s / 2.5s period), S-shaped path to exit

---

## [v0.8.0] — 2026-06-12 — Phase 3

### Added
- **Collapsible wall mechanic**: `CELL.COLLAPSIBLE = 4` tiles block rays and movement like walls
  - Destroyed by a direct pulse ray hit with energy > `COLLAPSE_ENERGY_THRESHOLD (0.3)`
  - Permanent: `G.grid[row][col]` mutated to `CELL.EMPTY`; path stays open for the rest of the level
  - Collapse emits a 12-ray glint burst at hit point (`COLLAPSE_BURST_RAYS = 12`, 80px maxDist)
  - Collapse audio: `playCollapse()` — low rumble + noise burst
  - Step rays and hazard rays cannot trigger collapse (energy too low after bounces)
- Collapsible wall glints render as warm tan `rgba(200,175,120,α)` — distinct from white-blue wall glints
- `collision.js` `castRay` and `resolveWalls` now treat `CELL.COLLAPSIBLE` as solid (same as `CELL.WALL`)
- `applyWallHits()` stores `cellType: 'collapsible'` on impact objects for renderer coloring
- Level 8 "The Collapse" — two horizontal barriers at rows 6 and 8 (single collapsible gap each at col 9); patrol in middle zone; chaser in upper section

---

## [v0.7.0] — 2026-06-11 — Phase 2

### Added
- **Water zone mechanic**: `CELL.WATER = 5` tiles affect player movement and step sound
  - Speed: 60% of normal (`WATER_SPEED_MULT = 0.6`), stacks multiplicatively with crouch
  - Step interval: 60% of normal (`WATER_INTERVAL_MULT = 0.6`) — more frequent splashes
  - Step ray count: 160% of normal (`WATER_RAY_MULT = 1.6`) — louder, more visible splash
  - Crouch + water combined: speed = 150 × 0.45 × 0.6 = 40.5 px/s
- `Player.move()` now accepts 6th param `inWater = false`; applies `WATER_SPEED_MULT`
- `Player.inWater` field set each frame from tile under player
- `G.playerInWater` state flag in `game.js`; checked before every step burst
- `drawWaterZone()` in `renderer.js` — radial teal gradient (`rgba(50,150,160)`) at player position when on water tile
- `Audio.playFootstepWater()` called when stepping on water (replaces `playFootstep()`)
- Level 7 "Flooded" — upper maze → forced 3-row water crossing (cols 2–17) → lower maze; two hazards inside the flood zone

---

## [v0.6.0] — 2026-06-11 — Phase 1

### Added
- **Crouch / stealth mechanic**: Hold Shift or C (keyboard) or tap CROUCH button (mobile)
  - Speed: 45% of normal (`CROUCH_SPEED_MULT = 0.45`)
  - Step interval: 2.5× longer (`CROUCH_INTERVAL_MULT = 2.5`)
  - Step ray count: 50% fewer (`CROUCH_RAY_MULT = 0.5`)
  - Step ray max distance: 70% shorter (`CROUCH_DIST_MULT = 0.7`)
- `Input.isCrouching()` export
- `#crouch-btn` mobile touch button (bottom-center)
- `#crouch-indicator` HUD element — lights up when crouching
- `PatrolEnemy.stepAware` flag + `hearStep()` investigation behavior (3.5s)
- `RaySystem.burst()` optional `countOverride`/`maxDistOverride` parameters
- Level 6 "The Whisper" — introduces crouch mechanic via step-aware patrol
- `loadLevel()` now deep-copies grid (prep for Phase 3 collapsible walls)

---

## [v0.5.1] — 2026-06-11 — Phase 0

### Added
- `/docs/` directory with 6 project documentation files:
  - `PROJECT_MASTER_SPEC.md` — source of truth for all design decisions
  - `IMPLEMENTATION_ROADMAP.md` — phase-by-phase task tracking
  - `CURRENT_STATUS.md` — live status snapshot
  - `DEVELOPMENT_LOG.md` — session history
  - `KNOWN_ISSUES.md` — bugs, tech debt, future improvements
  - `CHANGELOG.md` — this file
- New constants in `js/constants.js`:
  - `CELL.COLLAPSIBLE = 4` — walls destroyable by pulse
  - `CELL.WATER = 5` — water tiles affecting movement and sound
  - `ECHO_TRAIL_CAP = 500` — hard cap for echo trail array
  - `CROUCH_SPEED_MULT`, `CROUCH_INTERVAL_MULT`, `CROUCH_RAY_MULT`, `CROUCH_DIST_MULT`
  - `WATER_SPEED_MULT`, `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`, `WATER_ENERGY_DRAIN`
  - `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS`

### Removed
- Legacy unused constants from `js/constants.js`:
  - `STEP_WAVE_MAX`, `STEP_WAVE_SPEED`, `STEP_WAVE_ALPHA`
  - `PULSE_WAVE_MAX`, `PULSE_WAVE_SPEED`, `PULSE_WAVE_ALPHA`
  - `WAVE_RING_W`
  - `HAZARD_PULSE_MAX`, `HAZARD_PULSE_SPEED`

---

## [v0.5.0] — 2026-06-10 — Prototype Complete

### Added
- Full working browser game prototype (5 levels, all core systems)
- DDA ray-based sound propagation system replacing old circular wave system
- Wall impact glints — geometry revealed only by ray bounces
- Echo trail system — sealed ray segments persist with smoothstep fade
- Distance attenuation — all visuals and audio scale with distance from player
- Hidden exit — exit only revealed when player ray passes near it
- Entity reveal via ray proximity — enemies only shown when sound finds them
- PatrolEnemy — waypoint cycle, pulse-stun mechanic
- ChaserEnemy — idle wander + hearing-triggered hunt state
- Hazard — timed scan pulse emitter, proximity kill zone
- 5 hand-crafted levels (The Awakening, The Patrol, The Chamber, The Hunt, The Gauntlet)
- Web Audio API procedural sounds: footstep, pulse, alert, death, level complete, hazard pulse
- Touch joystick and pulse button for mobile
- Full UI: title, pause, death, level-up, win screens
- HUD: pulse cooldown bar + level label
- Responsive layout (800×600 → 100vw×75vw on mobile)

### Technical
- ES Modules throughout (`type="module"`)
- Single canvas, `requestAnimationFrame` game loop
- Object pool for Ray instances (`RaySystem._pool[]`)
- `dt` capped at 0.05s to prevent physics tunneling
- Ray object: `segX/segY` (segment start), `tipX/tipY` (leading edge), `heardEntities` Set (one-shot hearing)
- `hearing(d)` smoothstep function applied to all rendered elements
- `segPtDist()` utility for ray-segment to entity distance
