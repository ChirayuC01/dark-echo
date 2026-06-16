# DEVELOPMENT LOG — RESONANCE

> Append an entry after every completed phase. Most recent entry first.

---

## [Phase 7 — Complete] Sentry Enemy + Trigger Visibility Fix

**Date:** 2026-06-16  
**Commit:** `d1c00f5`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/constants.js`**: Added 4 sentry constants:
- `SENTRY_SCAN_RANGE = 180` (px — cone depth)
- `SENTRY_SCAN_ARC = Math.PI / 2` (90° total, ±45°)
- `SENTRY_SCAN_SPEED = Math.PI / 3` (60°/s rotation)
- `SENTRY_HUNT_DURATION = 8` (seconds in alert/pursuit state)

**`js/entities.js`**: Added `Sentry` class:
- Constructor stores `scanRange` and `scanArc` as instance fields — renderer reads these to detect Sentry type without needing instanceof or imports
- State machine: `'idle'` (rotate + check LOS) → `'alert'` (pursue player, 8s timer) → `'stunned'` (0.6s, then idle)
- `update(dt, grid, castFn, player)` returns `true` exactly once on the frame the player is first spotted, so game.js can play the alert sound
- LOS check: normalize direction to player, cast ray via `castFn(sx, sy, nx, ny, d-PLAYER_RADIUS)`; null result = no wall = player visible
- Cone check: `Math.abs(angleDiff) < scanArc/2` (i.e., within ±45° of current facing)
- Pursuit movement: identical to ChaserEnemy — `resolveWalls` based movement toward player
- `onPulseHit()`: immediately sets state to stunned (even if alert)

**`js/game.js`**:
- Import extended: `Sentry` added from `'./entities.js'`
- `loadLevel()`: `type:'sentry'` → `new Sentry(ex, ey, e.angle ?? 0)`; added to `G.enemies[]` (same kill-check loop as other enemies)
- Enemy update loop: `instanceof Sentry` branch passes `G.castFn` and `G.player` to `update()`; calls `Audio.playSentryAlert()` on `true` return
- `processRayEntities()`: `instanceof Sentry` branch calls `en.onPulseHit()` on pulse ray hit (no sound hearing — Sentry is vision-only)

**`js/audio.js`**: `playSentryAlert()` and `SOUND_CONFIG.sentryAlert` were already implemented in a prior session. No changes needed.

**`js/renderer.js`** — two changes:
1. **Sentry cone**: `drawEnemies()` checks `e.scanRange !== undefined` → draws cone arc (canvas path: moveTo center, arc spanning `e.angle ± e.scanArc/2`, closePath); faint orange `rgba(220,100,50,α×0.14)` in idle, brighter red `rgba(255,55,35,α×0.30)` in alert; thin stroke outline for clarity; drawn BEFORE the enemy dot so dot appears on top
2. **Alert state color**: `const hunting = e.state === 'hunting' || e.state === 'alert'` — Sentry in alert now uses the same bright red glow as ChaserEnemy in hunting mode
3. **Trigger visibility fix**: `drawTriggers()` redesigned — larger glow radius (28px), wider pulse beat (0.35–0.80 amplitude vs old 0.50–0.75), pulsing outer ring stroke, slow-rotating 4-spoke cross indicator (spokes 5–11px from center, rotate at now/4000 rad/ms), brighter center dot (4.5px)

**`js/levels.js`**: Level 9 extended:
- `{ type:'sentry', col:12, row:13, angle:Math.PI }` added to enemies array
- Sentry faces LEFT initially (away from where player arrives at col 14)
- Cone rotates clockwise; danger window (cone pointing east ±45°) = 1.5s; safe window = 4.5s per cycle
- Player sprints 4 tiles (160px) in ~1.07s at PLAYER_SPEED=150 — comfortably fits in safe window once timed
- Hint updated: "Find the switch · Time the crushers · Dodge the sentry at the exit"

### Design decisions

- **`instanceof Sentry` in game.js update loop**: Cleanest approach to pass extra parameters (castFn, player) without changing the base enemy interface. PatrolEnemy and ChaserEnemy's `update(dt, grid)` signature is unchanged.
- **Return value for alert signal**: `update()` returns `true` on the spot frame rather than using a callback or event. Matches the existing `Hazard.update()` pattern (returns pulse event object or null). Single-responsibility: the Sentry manages its own state, game.js handles the audio side effect.
- **`scanRange`/`scanArc` as instance fields**: The renderer detects Sentry type via `e.scanRange !== undefined` without needing to import `Sentry` or `instanceof`. Keeps renderer.js decoupled from entity types.
- **Sentry at col 12 row 13**: Player enters row 13 at col 14 after final crusher. The sentry is 2 tiles LEFT (80px). Player goes RIGHT to exit at col 18. The sentry's cone sweeping rightward is the only danger — clear mechanical puzzle with learnable timing.
- **Trigger cross indicator**: A rotating 4-spoke indicator distinguishes the trigger from other dots (key=gold, exit=green, door=amber). The slow rotation (one full turn ~25s) communicates "switch/interactive" better than a static dot.

---

## [Phase 6 — Complete] Switches / Triggers

**Date:** 2026-06-16  
**Commit:** `fe82322`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/game.js`**:
- `G.triggers: []` added to state object; reset in `loadLevel()`
- `loadLevel()` iterates `def.triggers[]` to build trigger objects: `{col, row, x, y, action, targetId, fired: false, revealedAt: -Infinity}`
- `processRayEntities()`: new trigger reveal loop — `segPtDist(tr.x, tr.y, sx, sy, tx, ty) < REVEAL_D` → `tr.revealedAt = now` (skips `fired` triggers)
- `fireTrigger(tr)` function: `'open_door'` reuses the key-pickup door-open logic (get door from `G.doors`, set `CELL.EMPTY`, remove `doorsByCell` entry, play audio); `'remove_wall'` parses `targetId` as `"row,col"` and sets `G.grid[r][c] = CELL.EMPTY`
- `update()`: trigger proximity loop after key pickup — `dist(player, trigger) < 10px` → `tr.fired = true` → `fireTrigger(tr)` (single-frame one-shot; fired flag prevents re-trigger)

**`js/renderer.js`**:
- `draw()` destructures `triggers` from state; calls `drawTriggers(triggers, now, px, py)` after `drawKeys`
- `drawTriggers()`: bright blue-white `rgba(100,160,255)` pulsing radial gradient dot (16px radius), 3px solid center `rgba(160,210,255)`, `shadowBlur 14 * alpha`; uses `revealAlpha × hearing` attenuation; `sin(now/350)` pulse period differs from key (400ms) and exit (500ms) for distinct visual rhythm; renders nothing for fired triggers

**`js/levels.js`**: Level 9 "The Corridor" extended:
- Row 13 col 16 changed from `0` to `1` — creates a wall blocking the final exit sprint
- `triggers: [{ col: 3, row: 9, action: 'remove_wall', targetId: '13,16' }]` added
- Trigger fires naturally in player flow: after crossing corridor 2 (row 7 via col 14 gap in row 8), player enters row 9 connecting zone and walks LEFT toward col 6 (next corridor entry); passes col 3 during this traversal → trigger fires → exit wall removed
- Hint updated: "A switch unlocks the exit · Watch for the crusher · Wait, then dash"

### Design decisions

- **10px proximity radius**: Tight enough that the player must deliberately walk through the trigger tile (not just pass nearby). At `TILE = 40px`, the trigger center is always ≥ 20px from tile edges — a 10px radius means the player must reach the center area. Natural for left-to-right traversal of a row.
- **Trigger reveals itself via sound**: Same `segPtDist` reveal pattern as keys/exit/doors. No special handling needed — players learn to pulse-reveal before approaching, consistent with the game's sound-is-vision pillar.
- **Level 9 switch placement at row 9, col 3**: The player MUST cross row 9 walking from the right (col 14 area) to the left (col 6 entry) as part of the normal level flow. Col 3 is reached during this walk — the trigger fires at a natural moment, never requiring a detour.
- **Wall at row 13 col 16**: After crossing all three corridors, the player exits through col 14 gap in row 12 and arrives in row 13 around col 14. The wall at col 16 blocks the sprint to exit col 18. Since the trigger already fired in row 9, the wall is already gone — smooth experience if played in order. If the player somehow skips row 9 (impossible in normal flow), they would encounter the blocked exit and need to backtrack.
- **`'spawn_enemy'` action not implemented**: No level in Phase 6 uses it; left as a no-op stub for a future phase if needed. Not worth implementing without a use case.

---

## [Phase 5 — Complete] Doors & Keys

**Date:** 2026-06-12  
**Commit:** `d1e4e23`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/constants.js`**: Added `KEY_PICKUP_RADIUS = 12` (player must walk within 12px of key center to collect).

**`js/game.js`**:
- `G` state extended with `G.doors: new Map()`, `G.keys: new Map()`, `G.doorsByCell: new Map()`
- `loadLevel()` resets all three maps; iterates `def.doors[]` to build door objects and set `G.grid[row][col] = CELL.WALL` (closed door becomes a real wall in the mutable grid copy); iterates `def.keys[]` to build key objects
- Implementation decision: closed doors are written into the grid as `CELL.WALL`, so existing `castRay` DDA and `resolveWalls` block them automatically — no new `castRayDoors` function needed. `G.doorsByCell` keyed `"row,col"` allows `applyWallHits` to identify door hits without a separate ray function
- `applyWallHits()`: checks `G.doorsByCell.get("${h.row},${h.col}")` — if door hit, updates `revealedAt`, stores `cellType: 'door'`
- `processRayEntities()`: key reveal loop (skips collected keys), door reveal loop — both use `segPtDist` with `REVEAL_D = 28px`
- `update()`: key pickup loop — `dist(player, key) < KEY_PICKUP_RADIUS` → mark collected, `Audio.playKeyPickup()`, open matching door: `grid[row][col] = CELL.EMPTY`, `G.doorsByCell.delete(...)`, `Audio.playDoorOpen()`

**`js/renderer.js`**:
- `draw()` destructures `doors` and `keys` from state
- `drawDoors(doors, now, px, py)`: amber `rgba(210,160,50)` fill + stroke when locked (with glow), faint green `rgba(80,210,120)` when open; uses `revealAlpha × hearing` attenuation
- `drawKeys(keys, now, px, py)`: gold `rgba(255,210,80)` pulsing dot with radial gradient (`sin(now/400)` pulse), same fade pattern as exit; skips collected keys
- `drawImpacts()`: new `'door'` branch uses amber color `rgba(210,160,50)` for door-hit glints
- Draw order: doors and keys rendered between collapsible reveals and crushers

**`js/levels.js`**: Level 8 "The Collapse" redesigned to incorporate key/door:
- Row 9 is now all walls (`1`) except col 9 (`0`, the door position) — only passage from middle zone to lower section
- Key at col 16, row 3 (reachable from eastern corridor at col 18; near the chaser at col 14)
- Door at col 9, row 9 — loaded as `CELL.WALL` until key collected
- Lower section simplified: row 10 wide open, row 11 corridor (gaps at cols 1 and 18 only), row 12 wide open, row 13 exit at col 18
- Updated hint: "Find the key · Shatter the walls · The door will open"
- No changes to `audio.js` — `playKeyPickup()` and `playDoorOpen()` were already implemented in Phase 0 via `SOUND_CONFIG`

### Design decisions

- **Grid mutation for closed doors**: Writing `CELL.WALL` into the grid when a door loads means no change to `castRay` or `resolveWalls` — they already handle walls correctly. When the door opens, `CELL.EMPTY` is written back. `G.doorsByCell` is the lookup that identifies which wall hits are door hits (for visual differentiation and `revealedAt` tracking). This is simpler than a separate `castRayDoors` slab function.
- **Level 8 redesign**: The original lower section had too many bypass paths to create a true door chokepoint. Making row 9 all-walls except the door cell creates an absolute chokepoint — the player cannot reach the lower section without having the key. The key is placed near the chaser in the upper section, combining the crouch mechanic (avoid detection while retrieving it) with the new key/door mechanic.
- **Key proximity pickup**: 12px radius is intentionally tight — smaller than the player's footstep radius, so the player must walk toward the key, not just run past it.
- **Open door visual**: The faint green (`rgba(80,210,120)`) for open doors reuses the exit color palette, subconsciously signaling "this is now passable." The reveal fades naturally via `revealAlpha` — no special open-door fade timer needed.

---

## [Phase 4 — Complete] Crushers

**Date:** 2026-06-12  
**Commit:** `03303ff`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/entities.js`**: Added `Crusher` class. Constructor takes `(x, y, axis, range, period)` where `range` is in tiles (converted to px on construction). `elapsed` starts at `Math.random() * period` for random phase so crushers in the same level don't all sync up. `update(dt)` advances elapsed, computes `sin` offset, moves `this.x` or `this.y` along the given axis. `bounds()` returns `{x1,y1,x2,y2}` TILE-sized AABB centered on current position.

**`js/collision.js`**: Added two new exports:
- `castRayCrushers(crushers, ox, oy, dx, dy, maxDist)` — AABB slab method, loops over crusher list, returns closest hit with `{ x,y,t,nx,ny,col:-1,row:-1,crusher:c }`. The `col:-1, row:-1` sentinel ensures `applyWallHits` won't misidentify it as a grid cell.
- `circleOverlapsAABB(cx, cy, cr, x1, y1, x2, y2)` — nearest-point circle vs AABB; used for player kill check.

**`js/game.js`**:
- Imports extended: `castRayCrushers`, `circleOverlapsAABB` from collision; `Crusher` from entities
- `G.crushers: []` added to state object; reset in `loadLevel()`
- Crusher spawn in `loadLevel()` enemy loop: `type: 'crusher'` → `new Crusher(ex, ey, e.axis, e.range, e.period)`
- `castFn` updated: calls both `castRay` (grid) and `castRayCrushers` (crushers), picks whichever has smaller `t`
- `applyWallHits()`: detects `isCrusher = !!h.crusher`; if true, sets `h.crusher.revealedAt = now` and marks impact `cellType: 'crusher'`
- `processRayEntities()`: new inner loop over `G.crushers` using `segPtDist` for proximity-based reveal (same `REVEAL_D = 28px` threshold)
- `checkDeath()`: new loop over `G.crushers`; `circleOverlapsAABB(p.x, p.y, PLAYER_RADIUS, b.x1, b.y1, b.x2, b.y2)` → `die('Crushed.')`
- `update()`: `for (const cr of G.crushers) cr.update(dt)` — crushers advance each frame

**`js/renderer.js`**:
- `draw()` destructures `crushers` from state
- `drawCrushers(crushers, now, px, py)` called after `drawExit` and before `drawHazards`
- `drawCrushers`: orange `rgba(230,105,55)` fill + stroke per crusher, `revealAlpha` + `hearing` attenuation, `shadowBlur` glow
- `drawImpacts()`: added `cellType === 'crusher'` branch (orange, same palette as hazard/crusher) before `'collapsible'` check

**`js/levels.js`**: Level 9 "The Corridor" — S-shaped zigzag path through 3 open corridors (rows 3, 5, 7) connected by single-tile gaps at alternating ends (col 18 / col 1). Three crushers with periods 5.0s / 3.5s / 2.5s sweep horizontally through each corridor. Lower maze (rows 9–13) leads to exit col 18 row 13.

### Design decisions

- Random `elapsed` start phase: avoids all crushers being at the same position when the level loads. Each crusher behaves independently from the start.
- `col:-1, row:-1` in crusher hit result: sentinel that prevents `applyWallHits` from reading `G.grid[-1]?.[-1]` (undefined → not collapsible), so crusher hits never accidentally trigger collapse logic.
- Dual reveal system: proximity reveal (rays passing near crusher) + direct hit reveal (rays bouncing off crusher). Proximity ensures the player detects approaching crushers even if no ray hits them directly.
- Death reason 'Crushed.' — distinct from 'Caught.' (enemy) and 'Disintegrated.' (hazard).
- Visual palette: crushers use orange `rgba(230,105,55)` matching hazard rays — both are lethal; color consistency telegraphs danger.
- Level 9 difficulty scaling: corridor 1 (5s period = slow), corridor 2 (3.5s = medium), corridor 3 (2.5s = fast) — player learns timing before it becomes critical.

---

## [Phase 3 — Complete] Collapsible Walls

**Date:** 2026-06-12  
**Commit:** `e9be4d4`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/collision.js`**: Imported `CELL`. In `castRay`, changed the wall check from `=== 1` to `=== CELL.WALL || === CELL.COLLAPSIBLE` so collapsible cells block rays. In `resolveWalls`, changed `!== 1` guard to exclude both `CELL.WALL` and `CELL.COLLAPSIBLE` so the player cannot walk through them.

**`js/game.js`**:
- Imported `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS` from constants
- `applyWallHits()` checks `G.grid[h.row]?.[h.col] === CELL.COLLAPSIBLE` *before* recording impact (reads cell type before mutation); stores `cellType: 'collapsible'` on the impact object for renderer
- If collapsible + pulse + energy > 0.3: mutates `G.grid[row][col] = CELL.EMPTY`; fires 12-ray burst at hit point (80px maxDist) for glint effect; calls `Audio.playCollapse()`

**`js/renderer.js`**: `drawImpacts()` checks `im.cellType === 'collapsible'` first; uses warm tan `rgba(200,175,120,α)` so collapsible walls are visually distinct from regular walls before and as they are destroyed.

**`js/levels.js`**: Level 8 "The Collapse" — symmetric maze upper + lower, split by two full-row horizontal barriers (rows 6 and 8) each with a single collapsible wall at col 9. Patrol guards middle zone (row 7, col 1–17). Chaser in upper section (col 14, row 3). Two pulses required to break through; enemy pressure punishes hasty pulsing.

**`js/audio.js`**: `playCollapse()` was already implemented in Phase 0. No changes needed.

### Design decisions

- `cellType` field is added to impact objects so only the renderer needs to know about collapsible cell color — `applyWallHits` reads `G.grid` before mutation to capture the correct type.
- Collapse only triggers on `type === 'pulse'` hits — step rays and hazard rays (lower energy) cannot destroy walls. This is intentional: the player must explicitly use the loud pulse, accepting the risk.
- Collapse burst uses 80px `maxDistOverride` — short starburst pattern that reveals the newly opened gap without flooding the screen with geometry.
- Level 8 uses two barriers so the player experiences the mechanic twice: first to learn (row 6), second under enemy pressure (row 8, with patrol already active).

---

## [Phase 2 — Complete] Water Zones

**Date:** 2026-06-11  
**Commit:** `e65bf1b`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/entities.js`**: `Player.move()` gains 6th param `inWater = false`; sets `this.inWater`; speed is `PLAYER_SPEED * (crouching ? CROUCH_SPEED_MULT : 1) * (inWater ? WATER_SPEED_MULT : 1)`. Import line extended to include `WATER_SPEED_MULT`.

**`js/game.js`**:
- `G.playerInWater: false` added to state object
- Imports extended: `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`
- `update()`: tile under player detected before `player.move()` (`Math.floor(player.x / TILE)`, same for row); `G.playerInWater = G.grid[row]?.[col] === CELL.WATER`
- `player.move()` now passes `G.playerInWater` as 6th arg
- Step interval: `STEP_INTERVAL * (crouching ? CROUCH_INTERVAL_MULT : 1) * (G.playerInWater ? WATER_INTERVAL_MULT : 1)` — multipliers stack
- Ray count: `ceil(RAY_COUNT_STEP * crouchMult * waterMult)`, capped at 64
- Plays `Audio.playFootstepWater()` when in water, `Audio.playFootstep()` otherwise

**`js/renderer.js`**: Added `drawWaterZone(player)` — `createRadialGradient` teal wash (0 → 80px radius, `rgba(50,150,160,0.08)` → transparent). Called in `draw()` before `drawPlayer()` only when `state.playerInWater`.

**`js/levels.js`**: Level 7 "Flooded" — 20×15 grid; rows 6–8 cols 2–17 are `CELL.WATER = 5`; walls at cols 0, 1, 18, 19 of water rows force the player to cross entirely through water; two hazards at cols 5 and 14 in row 7.

### Design decisions

- Water detection uses the player's position BEFORE move() is called — 1 frame "late" on entry/exit but imperceptible at water-zone crossing speeds.
- Ray count cap at 64 prevents extreme bursts when crouching in water (0.5 × 1.6 = 0.8 × default; normal in water = 1.6 × default = ~35 rays, within budget).
- Level 7 forces water crossing at cols 2–17 (walls at cols 0, 1, 18, 19) so the player cannot simply run along the edges.
- Hazards placed at cols 5 and 14 (row 7) to bracket the crossing without making it impassable — player path at cols 9–10 is equidistant from both.

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
