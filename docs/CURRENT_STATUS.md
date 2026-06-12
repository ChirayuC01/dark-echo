# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 4 complete (2026-06-12)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 5 — Doors & Keys**  
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
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| Echo trail cap | `js/waves.js` | Hard cap at 500 entries |
| Mutable grid copy | `js/game.js` `loadLevel()` | Enables in-run grid mutation (collapsibles) |

---

## Phase 0 — Complete ✅ (commit `cbc1694`)
## Phase 1 — Complete ✅ (commit `3933d22`)
## Phase 2 — Complete ✅ (commit `e65bf1b`)
## Phase 3 — Complete ✅ (commit `e9be4d4`)
## Phase 4 — Complete ✅ (commit `03303ff`)

**Phase 4 summary:**
- `Crusher` class in `entities.js`: sinusoidal axis motion (`sin((elapsed/period)×2π)×range`), TILE-sized AABB, `revealedAt`
- `castRayCrushers()` in `collision.js`: AABB slab-method intersection, returns hit with `crusher` reference
- `circleOverlapsAABB()` in `collision.js`: nearest-point circle vs AABB for kill check
- `castFn` in `loadLevel()` now composites grid hit and crusher hit, returns whichever is closer
- `applyWallHits()`: crusher hits set `h.crusher.revealedAt = now` and store `cellType: 'crusher'`
- `processRayEntities()`: crusher proximity reveal via `segPtDist`
- `checkDeath()`: `circleOverlapsAABB` kill check against each crusher's bounds → `die('Crushed.')`
- `drawCrushers()` in `renderer.js`: orange `rgba(230,105,55)` filled+stroked TILE block, hearing-attenuated
- Crusher impact glints use orange color matching hazard palette
- Level 9 "The Corridor": 3 corridors, each with a crusher sweeping at 5.0s / 3.5s / 2.5s period

---

## Pending Systems

| System | Phase | Priority |
|---|---|---|
| ~~Water zones~~ | ~~Phase 2~~ | ~~High~~ |
| ~~Collapsible walls~~ | ~~Phase 3~~ | ~~High~~ |
| ~~Crushers~~ | ~~Phase 4~~ | ~~Medium~~ |
| Doors & keys | Phase 5 | Medium |
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

Begin **Phase 5 — Doors & Keys**:
1. `game.js`: add `G.doors` Map, `G.keys` Map to state; populate in `loadLevel()` from `def.keys[]` / `def.doors[]`
2. `collision.js` / `castFn`: treat closed doors as walls (check `G.doors` before DDA)
3. `game.js` `update()`: key pickup proximity check → open door; `resolveWalls` skips open doors
4. `renderer.js`: `drawDoors()`, `drawKeys()` — pulsing dots with hearing attenuation
5. `audio.js`: `playKeyPickup()`, `playDoorOpen()` (already in SOUND_CONFIG)
6. Level in `levels.js` using keys/doors

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
