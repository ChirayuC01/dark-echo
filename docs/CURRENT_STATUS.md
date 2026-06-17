# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 9 complete (2026-06-17)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 12 — Audio Polish**  
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
| **Sentry Enemy** | `js/entities.js`, `js/game.js`, `js/renderer.js`, `js/levels.js` | Rotating ±45° scan cone, 180px LOS detection, 8s pursuit; stunned by pulse |
| **BlindStalker Enemy** | `js/entities.js`, `js/game.js`, `js/levels.js` | Hears all sounds (step+pulse, incl. crouched); 104px/s hunt speed; 4s timer |
| **10 levels** | `js/levels.js` | Level 10 "The Gauntlet II" — all mechanics + BlindStalker |
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| **Ambient drone** | `js/audio.js`, `js/game.js` | 55Hz sine, gain 0.035, 1.5s fade-in/0.5s fade-out; starts on play, stops on death/win/title |
| **Debug overlay** | `js/debug.js`, `js/input.js`, `js/game.js`, `js/renderer.js` | Backtick toggle; FPS, rays, trails, glints, player state, all enemy states |
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
## Phase 7 — Complete ✅ (commit `d1c00f5`)
## Phase 8 — Complete ✅ (commit `fe11f7d`)
## Phase 9 — Complete ✅
## Phase 10 — Complete ✅
## Phase 11 — Complete ✅

**Phase 11 summary:**
- `js/debug.js` (new module): `isEnabled()`, `toggle()`, `draw(ctx, state, fps)`
- Overlay panel: semi-transparent dark box, top-left corner, 306px wide; monospace 12px font
- Displays: FPS (green ≥55 / yellow ≥30 / red <30), screen state, active rays, echo trail count with cap warning at 85% threshold, glint count, player pixel + tile coords, crouch + water flags, per-entity type+state+position
- Entity type shown as `constructor.name.replace('Enemy', '')` — produces Patrol/Chaser/BlindStalker/Sentry/Hazard/Crusher
- Enemy lines are color-coded: hunting/alert states render in coral red; idle in muted rose
- `input.js`: `_debugToggle` bool + `Backquote` keydown; `consumeDebugToggle()` export
- `game.js`: EMA FPS (`G.fps * 0.85 + (1/dt) * 0.15`, guarded on `dt > 0.001`); `consumeDebugToggle()` → `Debug.toggle()` each frame; `fps: G.fps` added to state spread
- `renderer.js`: imports Debug; calls `Debug.draw(ctx, state, state.fps)` after vignette (drawn last so it renders above all game visuals)

**Phase 10 summary:**
- `audio.js` `startAmbient()` and `stopAmbient()` were already fully implemented from Phase 0 (55Hz sine, `SOUND_CONFIG.ambient`, null guard, fade-in/fade-out)
- `game.js` wired: `startAmbient()` called in `'start'`, `'resume'`, `'restart'`, `'restart-from-1'`, `'next-level'` action branches; `stopAmbient()` called in `die()` (before `playDeath()`) and `checkExit()` win branch; also `stopAmbient()` in `'title'` to mute when returning to title screen
- Drone never stacks: `startAmbient()` null-guards before creating new oscillator node
- Drone persists across normal level transitions (level exit → levelup screen → next level); only stops on death, win, or title

**Phase 9 summary:**
- All 10 levels audited for completability; all confirmed solvable
- **Critical bug fixed**: Level 9 trigger `{ col: 3, row: 9 }` was unreachable — player path in row 9 traverses cols 14→6 (never reaches col 3). Fixed to `col: 10` which sits mid-path
- **DC-004 documented**: Entity visual differentiation concern logged in KNOWN_ISSUES.md with proposed shape vocabulary (PatrolEnemy→triangle, ChaserEnemy→circle+ring, BlindStalker→dot+arcs); spec section 3 updated; deferred to Phase 14

**Phase 7 summary:**
- `SENTRY_SCAN_RANGE=180`, `SENTRY_SCAN_ARC=π/2`, `SENTRY_SCAN_SPEED=π/3`, `SENTRY_HUNT_DURATION=8` added to `constants.js`
- `Sentry` class in `entities.js`: stores `scanRange`/`scanArc` as instance fields for renderer; `update(dt, grid, castFn, player)` returns `true` once on spot frame; `onPulseHit()` stuns 0.6s; LOS check via `castFn(sx, sy, nx, ny, d-PLAYER_RADIUS)` — null hit = clear path
- `game.js`: import `Sentry`; spawn from `type:'sentry'`; `instanceof Sentry` branch passes `castFn`+`player` to `update()`; calls `Audio.playSentryAlert()` on `true` return; adds `en.onPulseHit()` for pulse rays
- `renderer.js drawEnemies()`: checks `e.scanRange !== undefined` to detect Sentry; draws cone arc before dot (faint orange idle, bright red alert); `hunting` flag extended to cover `state==='alert'` for glow color
- Trigger visibility enhanced: larger glow (28px), dramatic pulse beat (0.35–0.80 swing), outer ring stroke + slow-rotating 4-spoke cross indicator
- Level 9: `{ type:'sentry', col:12, row:13, angle:Math.PI }` — sentry faces left initially; player arrives at col 14 from corridor 3 gap; must wait for cone to face away before sprinting to exit at col 18 (1.5s danger / 4.5s safe per rotation cycle)
- Hint updated: "Find the switch · Time the crushers · Dodge the sentry at the exit"

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
| ~~Sentry enemy~~ | ~~Phase 7~~ | ~~Medium~~ |
| ~~BlindStalker enemy~~ | ~~Phase 8~~ | ~~Low~~ |
| ~~Level 10 (full polish)~~ | ~~Phase 9~~ | ~~High~~ |
| ~~Ambient audio~~ | ~~Phase 10~~ | ~~Medium~~ |
| ~~Debug overlay~~ | ~~Phase 11~~ | ~~Low~~ |
| Audio polish | Phase 12 | Low |
| Mobile polish | Phase 13 | Medium |
| Final balance/polish | Phase 14 | Low |

---

## Next Recommended Task

Begin **Phase 12 — Audio Polish**:
1. Verify all `play*()` in `audio.js` read from `SOUND_CONFIG` (no hardcoded values) — most already do
2. Add `playFootstepSurface(surface)` dispatcher that calls `playFootstep()` or `playFootstepWater()` based on surface type
3. Add subtle pitch variation to footstep: randomize `filterFreq` ± 5% on each call

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
