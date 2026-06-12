# CHANGELOG — RESONANCE

> Format: `## [vX.Y] — Date — Phase N`  
> Follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased] — Phase 6 pending

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
