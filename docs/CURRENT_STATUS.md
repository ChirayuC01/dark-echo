# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 6 complete (2026-06-16)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 7 — Sentry Enemy**  
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
| **Switches / Triggers** | `js/game.js`, `js/renderer.js`, `js/levels.js` | Blue-white pulsing dot; player proximity fires `open_door` or `remove_wall` once |
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
## Phase 6 — Complete ✅ (commit `fe82322`)

**Phase 6 summary:**
- `G.triggers = []` added to game state; reset in `loadLevel()`; populated from `def.triggers[]`
- Trigger objects: `{col, row, x, y, action, targetId, fired: false, revealedAt: -Infinity}`
- `fireTrigger(tr)` dispatches `open_door` (reuses door-open logic) and `remove_wall` (mutates mutable grid)
- `update()`: proximity loop checks `dist(player, trigger) < 10px` → fires once; `fired = true` prevents re-trigger
- `processRayEntities()`: trigger reveal loop using `segPtDist` with `REVEAL_D = 28px` (same as exit/key/door)
- `drawTriggers()` in `renderer.js`: bright blue-white `rgba(100,160,255)` pulsing radial dot, hearing-attenuated; disappears after fired
- Level 9 extended: wall added at row 13 col 16 (blocks direct path to exit); trigger at col 3 row 9 (`remove_wall` → `'13,16'`) fires naturally as player crosses connecting zone between corridors 2 and 3; hint updated

---

## Pending Systems

| System | Phase | Priority |
|---|---|---|
| ~~Water zones~~ | ~~Phase 2~~ | ~~High~~ |
| ~~Collapsible walls~~ | ~~Phase 3~~ | ~~High~~ |
| ~~Crushers~~ | ~~Phase 4~~ | ~~Medium~~ |
| ~~Doors & keys~~ | ~~Phase 5~~ | ~~Medium~~ |
| ~~Switches / triggers~~ | ~~Phase 6~~ | ~~Medium~~ |
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

Begin **Phase 7 — Sentry Enemy**:
1. `entities.js`: Add `Sentry` class — rotating scan angle (60°/s), ±45° cone, 180px range, `idle`/`alert` state machine
2. `game.js` `loadLevel()`: spawn from `type: 'sentry'`; pass `castFn` + `player` to `sentry.update(dt, castFn, player)` each frame
3. LOS check: `castFn(sentry.x, sentry.y, dir.x, dir.y, dist)` — if no hit before player → alert
4. `audio.js`: `playSentryAlert()` — distinct pitch pair from ChaserEnemy alert
5. `renderer.js`: reveal sentry same as enemies (`revealedAt` fade); draw scan cone arc when revealed
6. Introduce in Level 9 or a new level (roadmap says Level 9)

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
