# PROJECT MASTER SPEC — RESONANCE

> **This file is the source of truth.** All implementation decisions must align with what is written here. Do not implement features that contradict this spec without updating this document first and getting explicit approval.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Title | RESONANCE |
| Genre | Top-down minimalist stealth / horror exploration |
| Platform | Browser (HTML + CSS + JavaScript, ES Modules) |
| Stack | Canvas 2D, Web Audio API, no build step, no frameworks |
| Target resolution | 800 × 600 px (responsive on mobile) |
| Entry point | `index.html` → `js/game.js` (ES module) |
| Repo branch | `claude/sound-vision-game-7pvbo1` |

---

## 2. Core Design Pillars

1. **Sound is vision.** The screen is black. The player perceives geometry only through visualized sound echoes.
2. **Louder = more reveal, more danger.** Every emission is a tradeoff.
3. **Silence is a valid tactic.** Crouching/stopping is meaningful gameplay.
4. **Minimalist visuals.** No textures, no sprites, no UI clutter. Every pixel is earned.
5. **Audio-first.** Headphone use is assumed. Tension comes from ambient silence and sparse events.
6. **Short retry loop.** Death is fast to recover from. Levels are short.

---

## 3. Visual Language (Canonical Color Grammar)

| Element | Color | Notes |
|---|---|---|
| Background | `#000000` | Always pure black |
| Player position | White dot, radius 7px | Never drawn; only revealed if pulse hits it (future) |
| Step ray / echo | `rgba(155,195,235,α)` | Pale blue |
| Pulse ray / echo | `rgba(185,220,255,α)` | Bright blue |
| Hazard scan ray | `rgba(230,105,55,α)` | Orange |
| Enemy reveal | `rgba(200,70,70,α)` | Muted red, fades |
| Player dot | `rgba(255,255,255,α)` | Small white dot |
| Exit | `rgba(80,210,120,α)` | Pulsing green, hidden until sound finds it |
| Collapsible wall (revealed) | `rgba(200,175,120,α)` | Warm tan — differs from blue/red/green vocab |
| Door (locked, revealed) | `rgba(210,160,50,α)` | Amber |
| Door (open, revealed) | `rgba(80,210,120,0.3)` | Faint green tint |
| Key (revealed) | `rgba(255,210,80,α)` | Gold |
| Switch / trigger (revealed) | `rgba(100,160,255,α)` | Bright blue-white |
| Water zone background | `rgba(50,150,160,0.04)` | Barely visible teal wash, only when player inside |
| Crusher (revealed) | `rgba(230,105,55,α)` | Same as hazard — crushing is lethal |

**Rendering rules:**
- Alpha `α` is always modulated by two factors multiplied together:
  1. **Time fade**: smoothstep from 1.0 at creation to 0 at `RAY_TRAIL_MS` (4200ms)
  2. **Hearing attenuation**: smoothstep from 1.0 at `HEARING_NEAR` (130px) to 0 at `HEARING_FAR` (420px) from player
- Wall geometry is **never** drawn directly. Only ray impact glints reveal it.
- All glints are short perpendicular lines (3–9px) at hit points, not tiles.
- Echo trails have `lineWidth: 0.7`. Active ray segments have `lineWidth: 1.2`.
- Player dot: `shadowBlur: 10`, radius: 4px, always drawn last (before vignette).
- Vignette: radial gradient, `rgba(0,0,0,0)` center → `rgba(0,0,0,0.85)` edge.

---

## 4. Player Mechanics

### 4.1 Movement
- **Normal walk**: WASD / arrow keys / touch joystick. Speed: `PLAYER_SPEED = 150 px/s`.
- **Crouch/Stealth**: Hold Shift or C. Speed multiplied by `CROUCH_SPEED_MULT = 0.45`.
  - Step interval multiplied by `CROUCH_INTERVAL_MULT = 2.5` (less frequent footsteps).
  - Step ray count multiplied by `CROUCH_RAY_MULT = 0.5`.
  - Step ray max distance multiplied by `CROUCH_DIST_MULT = 0.7`.
  - Audio: same `playFootstep()` (already quieter due to fewer rays).
- **Water zone** (when on `CELL.WATER` tile): Speed `× WATER_SPEED_MULT = 0.6`.
  - Step interval `× WATER_INTERVAL_MULT = 0.6` (more frequent — harder to stay quiet).
  - Step ray count `× WATER_RAY_MULT = 1.6`.
  - Audio: `playFootstepWater()` instead of `playFootstep()`.
- **Stopping**: No movement = no step rays. Only hazard scans reveal geometry.

### 4.2 Pulse
- Spacebar / pulse button. Cooldown: `PULSE_COOLDOWN = 3500ms`.
- Emits `RAY_COUNT_PULSE = 64` rays, max distance `PULSE_RAY_MAX = 340px`, 3 bounces.
- High visibility. Enemies react. Collapsible walls can collapse on hit.
- HUD shows cooldown as a fill bar.

### 4.3 Death
- Enemy contact → `die('Caught.')`
- Hazard proximity → `die('Disintegrated.')`
- Crusher contact → `die('Crushed.')`
- Shows `screen-dead` overlay with death reason.
- Restart reloads current level (no checkpoint — levels are short).

### 4.4 Level Completion
- Walk within `TILE × 0.6` (24px) of exit → level complete.
- Exit is hidden (`revealedAt = -Infinity`) until a player ray (not hazard ray) passes within 28px.
- On complete: `screen-levelup` → next level loads. After final level: `screen-win`.

---

## 5. Sound Propagation System

### 5.1 Architecture
Ray-based (DDA — Digital Differential Analyzer). Not arc/wavefront.

| Parameter | Value | Constant |
|---|---|---|
| Ray speed | 160 px/s | `RAY_SPEED` |
| Step rays | 22 | `RAY_COUNT_STEP` |
| Pulse rays | 64 | `RAY_COUNT_PULSE` |
| Hazard rays | 28 | `RAY_COUNT_HAZARD` |
| Step max dist | 170 px | `STEP_RAY_MAX` |
| Pulse max dist | 340 px | `PULSE_RAY_MAX` |
| Hazard max dist | 110 px | `HAZARD_RAY_MAX` |
| Max bounces | 3 | `MAX_BOUNCES` |
| Energy decay per bounce | 0.55× | `ENERGY_DECAY` |
| Min energy threshold | 0.06 | `MIN_ENERGY` |
| Echo trail persistence | 4200ms | `RAY_TRAIL_MS` |
| Echo trail hard cap | 500 entries | `ECHO_TRAIL_CAP` |
| Impact glint persistence | 3600ms | `IMPACT_FADE_MS` |

### 5.2 Ray Lifecycle
1. `RaySystem.burst(x, y, type, castFn)` — emits N rays at random phase offset angles.
2. Each frame: `RaySystem.update(dt, castFn, now)` — advances all active rays.
3. On wall hit: seal current segment → compute reflection → nudge 0.8px off wall → continue.
4. On ray completion (`done=true`): all segments move to `echoTrails[]`.
5. `echoTrails[]` pruned every frame by time (`RAY_TRAIL_MS`) and hard-capped at `ECHO_TRAIL_CAP`.
6. Wall impact glints (`G.impacts[]`) pruned by `IMPACT_FADE_MS`.

### 5.3 Entity Reveal
Every active ray segment is checked against all entities via `segPtDist(entity, segStart, segEnd)`. If distance < `entity.radius + 28px`, `entity.revealedAt = now`. Entity is drawn only within `WALL_FADE_MS` (2800ms) of `revealedAt`.

### 5.4 Enemy Hearing (one-shot per ray)
Each ray maintains a `heardEntities` Set. On segment advance, if entity within `entity.radius + 18px` and not already in set → add to set → trigger enemy hearing response.

### 5.5 Collapsible Walls (NEW)
- `CELL.COLLAPSIBLE = 4` treated as wall in `castRay`.
- On pulse ray hit of a COLLAPSIBLE cell with `energy > COLLAPSE_ENERGY_THRESHOLD (0.3)`:
  - Set `G.grid[row][col] = CELL.EMPTY` (mutates live grid).
  - Fire a 12-ray burst (`COLLAPSE_BURST_RAYS`) at hit point for visual effect.
  - Play `Audio.playCollapse()`.

### 5.6 Water Zone (NEW)
- `CELL.WATER = 5` — does not block rays.
- If player is on a water tile, step parameters change (see 4.1).
- Rays passing through water cells lose `WATER_ENERGY_DRAIN (0.2)` extra energy.

---

## 6. Environmental Mechanics

### 6.1 Cell Types
| Value | Name | Behavior |
|---|---|---|
| 0 | EMPTY | Traversable, transparent to rays |
| 1 | WALL | Blocks rays and movement |
| 2 | START | Player spawn; treated as EMPTY at runtime |
| 3 | EXIT | Win condition tile; treated as EMPTY |
| 4 | COLLAPSIBLE | Blocks like WALL; destroyed by strong pulse |
| 5 | WATER | Traversable; modifies player + ray behavior |
| 6 | HAZARD | Legacy; hazards spawned from enemies[] array |

### 6.2 Doors / Keys
- Doors: `G.doors: Map<id, {x, y, col, row, open: bool, revealedAt}>`. Closed door blocks rays and movement (treated as WALL in castRay). Open door is traversable.
- Keys: `G.keys: Map<id, {x, y, col, row, collected: bool, doorId, revealedAt}>`. Player walks within 12px → key collected → door with matching `doorId` opens.
- Both revealed only when sound passes nearby.
- Level def: `keys: [{id, col, row, doorId}]`, `doors: [{id, col, row}]`.

### 6.3 Switches / Triggers
- `G.triggers: [{col, row, action, targetId, fired: bool}]`.
- Player within 10px of trigger tile center → fires once → dispatches action.
- Actions: `'open_door'`, `'remove_wall'`, `'spawn_enemy'`.
- Revealed by sound like any other entity.

### 6.4 Crushers
- `Crusher` class: axis-aligned segment (`h` or `v`), sinusoidal motion, period and range from level def.
- Acts as dynamic wall obstacle: blocks rays and movement.
- Player overlap with crusher → `die('Crushed.')`.
- Level def: `{ type: 'crusher', col, row, axis: 'h'|'v', range: N, period: S }` in `enemies[]`.

---

## 7. Enemy / Hazard Taxonomy

### 7.1 PatrolEnemy (existing)
| Property | Value |
|---|---|
| State machine | Moving along waypoints |
| Hearing | Reacts to pulse rays (staggers 0.6s via `onPulseHit()`) |
| Speed | `PATROL_SPEED = 52 px/s` |
| Kill condition | Circle overlap with player |
| Level def | `{ type: 'patrol', col, row, waypoints: [[c,r],...] }` |

### 7.2 ChaserEnemy (existing)
| Property | Value |
|---|---|
| State machine | `idle` (wander) → `hunting` (pursue last heard source) |
| Hearing | Any ray type triggers `hearSound(sourceX, sourceY)` |
| Speed | Idle: 35, Hunt: 80 px/s |
| Hunt duration | 6 seconds |
| Kill condition | Circle overlap with player |
| Level def | `{ type: 'chaser', col, row }` |

### 7.3 Hazard (existing)
| Property | Value |
|---|---|
| State machine | Timed pulse emitter |
| Pulse interval | `HAZARD_PULSE_INTERVAL = 2400ms` (staggered start) |
| Kill condition | Player within `HAZARD_RADIUS = 28px` |
| Level def | `{ type: 'hazard', col, row }` |

### 7.4 Sentry (NEW)
| Property | Value |
|---|---|
| State machine | `idle` (rotating scan cone) → `alert` (pursue player) |
| Hearing | Pulse ray hit → stun (like patrol). Cone LOS → alert. |
| Scan cone | ±45° arc, 180px range, LOS via `castRay` |
| Scan rotation | 60°/s |
| Speed (alert) | `CHASER_SPEED_HUNT = 80 px/s` |
| Hunt duration | 8 seconds |
| Kill condition | Circle overlap with player |
| Level def | `{ type: 'sentry', col, row, angle: 0 }` |

### 7.5 BlindStalker (NEW)
| Property | Value |
|---|---|
| State machine | Same as ChaserEnemy but faster, shorter hunt timer |
| Hearing | Reacts to any sound immediately; re-acquires on each new sound |
| Speed | Idle: 30, Hunt: 104 px/s (`CHASER_SPEED_HUNT × 1.3`) |
| Hunt duration | 4 seconds |
| Kill condition | Circle overlap with player |
| Level def | `{ type: 'stalker', col, row }` |

### 7.6 Crusher (NEW)
| Property | Value |
|---|---|
| State machine | Continuous sinusoidal movement |
| Kill condition | Player overlaps crusher segment bounds |
| Level def | `{ type: 'crusher', col, row, axis, range, period }` |

---

## 8. Level Structure

### 8.1 Format
```javascript
{
  name: string,
  hint: string,                      // shown on level entry
  grid: number[][15][20],            // CELL values, 15 rows × 20 cols
  enemies: [EnemyDef],               // patrol, chaser, hazard, sentry, stalker, crusher
  keys:     [{ id, col, row, doorId }],      // optional
  doors:    [{ id, col, row }],              // optional
  triggers: [{ col, row, action, targetId }] // optional
}
```

### 8.2 Progression Plan (10 Levels)

| # | Name | New Mechanic | Enemy Mix |
|---|---|---|---|
| 1 | The Awakening | Navigation tutorial | None |
| 2 | The Patrol | Single patrol enemy | 1 patrol |
| 3 | The Chamber | Static hazards | 5 hazards |
| 4 | The Hunt | Chaser enemy | 1 chaser |
| 5 | The Gauntlet | All existing threats | 1 patrol + 1 chaser + 3 hazards |
| 6 | The Whisper | Crouch mechanic | 1 patrol (react to normal steps) |
| 7 | Flooded | Water zones | 2 hazards |
| 8 | The Collapse | Collapsible walls + keys | 1 patrol + 1 chaser |
| 9 | The Corridor | Crushers + switches | 2 crushers + 2 sentries |
| 10 | The Gauntlet II | All mechanics + blind stalker | Mixed |

---

## 9. Audio System

### 9.1 Architecture
All sounds procedurally synthesized via Web Audio API. No sample files.

A `SOUND_CONFIG` object in `audio.js` centralizes all tunable parameters. All `play*()` functions read from it. To swap a sound: change `SOUND_CONFIG`.

### 9.2 Sound Inventory

| Function | Trigger | Character |
|---|---|---|
| `playFootstep()` | Player step on normal surface | Low noise burst, 60ms, lowpass 180Hz |
| `playFootstepWater()` | Player step on water | Wider noise burst, 90ms, lowpass 320Hz, louder |
| `playPulse()` | Spacebar pulse | Deep resonant boom, two sines + click, 700ms |
| `playAlert()` | ChaserEnemy hears sound | Two square beep bursts |
| `playSentryAlert()` | Sentry spots player | Distinct tone from ChaserAlert |
| `playDeath()` | Player dies | Sawtooth descend, 1.2s |
| `playLevelComplete()` | Level exit reached | Ascending 4-note arpeggio |
| `playHazardPulse(vol)` | Hazard scan fires | Triangle wave, attenuated by distance |
| `playCollapse()` | Collapsible wall destroyed | Low rumble + noise burst |
| `playDoorOpen()` | Door unlocked/opened | Short metallic sweep up |
| `playKeyPickup()` | Key collected | Brief high ping, 880Hz |
| `startAmbient()` | Game starts | Continuous 55Hz sine drone, gain 0.04 |
| `stopAmbient()` | Player dies / wins | Ramp down and disconnect |

### 9.3 Mixing Categories
```
ambience:    gain 0.04  (ambient drone)
player:      gain 0.18  (footsteps)
environment: gain 0.4   (collapse, door)
enemy:       gain 0.06  (alerts, hazard pulses)
UI:          gain 0.18  (level complete)
```

---

## 10. HUD & UI

- **HUD**: Pulse cooldown bar + level label. Visible only during gameplay.
- **Screens**: title → playing → (pause) → (dead | levelup | win)
- **Hints**: Short text, shown on level entry, fades or dismissed on first input.
- **No tutorial popups**. Mechanics are taught through level design.
- **Mobile**: Touch joystick (bottom-left). Pulse button (bottom-right). Crouch button (NEW, bottom-center or second touch zone).

---

## 11. Technical Architecture

```
js/
  constants.js   — all tuning parameters and CELL types
  utils.js       — dist, normalize, clamp, lerp, tileCenter, segPtDist
  audio.js       — SOUND_CONFIG + all play*() functions
  input.js       — keyboard, touch joystick, crouch state, debug toggle
  entities.js    — Player, PatrolEnemy, ChaserEnemy, Hazard, Sentry, BlindStalker, Crusher
  waves.js       — Ray class, RaySystem (burst, update, echoTrails)
  collision.js   — castRay (DDA), resolveWalls, circlesOverlap
  levels.js      — LEVELS array (all 10 level defs)
  game.js        — G state, loadLevel, update, loop, handleAction
  renderer.js    — draw(), all drawX() helpers, hearing(), revealAlpha()
  ui.js          — show/hide screens, setHint, setDeathMessage
  debug.js (NEW) — debug overlay toggle, stat display
```

**Frame order in `game.js` update():**
1. Read input (move, crouch, pulse, pause)
2. Determine water/surface tile under player
3. Modify step params based on crouch + water state
4. `player.move()`
5. Footstep ray burst (if moving + interval elapsed)
6. Pulse ray burst (if spacebar + cooldown ready)
7. Hazard update + hazard ray bursts
8. Crusher update (+ death check for crusher overlap)
9. `raySystem.update()` → collect wall hits
10. `applyWallHits()` — push to G.impacts, prune
11. `processRayEntities()` — reveal entities, check exit, enemy hearing
12. Check key pickup, trigger proximity
13. Enemy AI update for all enemies
14. `checkDeath()` — enemy + hazard overlap
15. `checkExit()` — player near exit
16. HUD update

---

## 12. Performance Constraints

- Echo trail hard cap: `ECHO_TRAIL_CAP = 500` entries.
- Impact glints hard cap: 200 entries (prune by time, already O(n) sweep).
- Ray object pool: `RaySystem._pool[]` recycles Ray instances.
- Canvas: single `requestAnimationFrame` loop, no retained mode, clear each frame.
- No `shadowBlur` on echo trails (expensive). Only on player dot and exit glow.
- `dt` capped at 0.05s (20fps minimum) to prevent physics tunneling.

---

## 13. Out of Scope

- Monetization, ads, IAP — **never**.
- Save/checkpoint system beyond current level (levels are short; no need).
- Multiplayer.
- Sound sample files (Web Audio synthesis only).
- External libraries or build systems.
- Any analytics or tracking.
