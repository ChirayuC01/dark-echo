# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 5 complete (2026-06-12)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 6 — Switches / Triggers**  
Status: ⬜ Pending

---

## Completed Systems

| System | File(s) | Notes |
|---|---|---|
| DDA ray propagation | `js/waves.js` | Ray, RaySystem, burst, update, echoTrails |
| Wall impact glints | `js/renderer.js` | drawImpacts, perpendicular glints |
| Echo trails | `js/waves.js`, `js/renderer.js` | Sealed segments with smoothstep fade |
| Distance attenuation | `js/renderer.js` | `hearing(d)` smoothstep, per-segment |
| Hidden walls | `js/renderer.js` | Walls never drawn; only glints reveal them |
| Hidden exit | `js/game.js`, `js/renderer.js` | `exit.revealedAt` guard, player-ray only |
| Entity reveal via rays | `js/game.js` | `processRayEntities`, `segPtDist` |
| PatrolEnemy | `js/entities.js` | Waypoint cycle, pulse-stun, step-aware hearing |
| ChaserEnemy | `js/entities.js` | Idle wander + hunt state |
| Hazard | `js/entities.js` | Timed pulse emitter, proximity kill |
| 9 levels | `js/levels.js` | Levels 1–9 complete (Level 9 = The Corridor) |
| Touch joystick | `js/input.js` | 110px zone, 40px max drag |
| Touch crouch button | `js/input.js`, `index.html` | #crouch-btn, bottom-center mobile |
| All UI screens | `js/ui.js`, `index.html` | title/pause/dead/levelup/win |
| Web Audio sounds | `js/audio.js` | SOUND_CONFIG + all play*() |
| Game loop & state | `js/game.js` | G state machine, 6 screens |
| Grid collision | `js/collision.js` | castRay (DDA), resolveWalls, circlesOverlap |
| **Crouch / stealth** | `js/input.js`, `js/entities.js`, `js/game.js` | Hold Shift/C: 45% speed, 50% rays, 45% range |
| **HUD crouch indicator** | `js/renderer.js`, `index.html`, `css/style.css` | Shows CROUCH in HUD when active |
| **Water zones** | `js/entities.js`, `js/game.js`, `js/renderer.js` | CELL.WATER=5: 60% speed, 160% rays, 60% interval, teal wash |
| **Collapsible walls** | `js/collision.js`, `js/game.js`, `js/renderer.js` | CELL.COLLAPSIBLE=4: blocks until pulse (energy>0.3) destroys it |
| **Crushers** | `js/entities.js`, `js/collision.js`, `js/game.js`, `js/renderer.js` | AABB slab-method ray hit; sinusoidal motion; kill on AABB overlap |
| **Doors & Keys** | `js/game.js`, `js/renderer.js`, `js/levels.js` | Keys reveal gold dot; closed doors block rays/movement; pickup opens door |
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| Echo trail cap | `js/waves.js` | Hard cap at 500 entries |
| Mutable grid copy | `js/game.js` `loadLevel()` | Enables in-run grid mutation (collapsibles) |

---

## Phase 0 — Complete ✅ (commit `cbc1694`)
## Phase 1 — Complete ✅ (commit `3933d22`)
## Phase 2 — Complete ✅ (commit `e65bf1b`)
## Phase 3 — Complete ✅ (commit `e9be4d4`)
## Phase 4 — Complete ✅ (commit `03303ff`)
## Phase 5 — Complete ✅ (commit `d1e4e23`)

**Phase 5 summary:**
- `KEY_PICKUP_RADIUS = 12` added to `constants.js`
- `G.doors` Map, `G.keys` Map, `G.doorsByCell` Map added to game state
- `loadLevel()` populates maps from `def.doors[]`/`def.keys[]`; closed door cells are set to `CELL.WALL` in the mutable grid
- `applyWallHits()`: checks `G.doorsByCell` to identify door hits; tags `cellType: 'door'`; updates `door.revealedAt`
- `processRayEntities()`: key/door proximity reveal via `segPtDist` (same `REVEAL_D = 28px` as exit)
- `update()`: key pickup loop — player within 12px → `key.collected = true`, matching door opens (`G.grid[row][col] = CELL.EMPTY`), `G.doorsByCell` entry removed, audio plays
- `drawDoors()` in `renderer.js`: amber `rgba(210,160,50)` fill+stroke when locked, faint green `rgba(80,210,120)` when open
- `drawKeys()` in `renderer.js`: gold `rgba(255,210,80)` pulsing dot with radial gradient, same fade pattern as exit
- Door impact glints use amber color
- Level 8 redesigned: row 9 is solid wall except col 9 (the door); key at col 16 row 3 (near chaser); lower section accessible only via the door; simplified lower zone with col 18 corridor to exit

---

## Pending Systems

| System | Phase | Priority |
|---|---|---|
| ~~Water zones~~ | ~~Phase 2~~ | ~~High~~ |
| ~~Collapsible walls~~ | ~~Phase 3~~ | ~~High~~ |
| ~~Crushers~~ | ~~Phase 4~~ | ~~Medium~~ |
| ~~Doors & keys~~ | ~~Phase 5~~ | ~~Medium~~ |
| Switches / triggers | Phase 6 | Medium |
| Sentry enemy | Phase 7 | Medium |
| BlindStalker enemy | Phase 8 | Low |
| Level 10 | Phase 9 | High |
| Ambient audio | Phase 10 | Medium |
| Debug overlay | Phase 11 | Low |
| Audio polish | Phase 12 | Low |
| Mobile polish | Phase 13 | Medium |
| Final balance/polish | Phase 14 | Low |

---

## Next Recommended Task

Begin **Phase 6 — Switches / Triggers**:
1. `game.js`: add `G.triggers[]` to state; populate from `def.triggers[]` in `loadLevel()`
2. `game.js` `update()`: player proximity (< 10px) to unfired trigger → fire action
3. Actions: `'open_door'`, `'remove_wall'`, `'spawn_enemy'`
4. `renderer.js`: `drawTriggers()` — small pulsing blue dot, revealed by sound
5. `processRayEntities()`: trigger proximity reveal
6. Level using triggers (extend Level 9 or add to Level 10)

---

## Known Blockers

None currently.

---

## Branch

`claude/sound-vision-game-7pvbo1`

## How to Run

```
cd /home/user/dark-echo
python3 -m http.server 8080
# Open: http://localhost:8080
```

> Must use HTTP server (not `file://`) due to ES module CORS restrictions.
