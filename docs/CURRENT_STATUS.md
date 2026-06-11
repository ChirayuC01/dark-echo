# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 1 complete (2026-06-11)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 2 — Water Zones**  
Status: ⬜ Pending (ready to begin)

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
| 6 levels | `js/levels.js` | Levels 1–6 complete (Level 6 = The Whisper) |
| Touch joystick | `js/input.js` | 110px zone, 40px max drag |
| Touch crouch button | `js/input.js`, `index.html` | #crouch-btn, bottom-center mobile |
| All UI screens | `js/ui.js`, `index.html` | title/pause/dead/levelup/win |
| Web Audio sounds | `js/audio.js` | SOUND_CONFIG + all play*() |
| Game loop & state | `js/game.js` | G state machine, 6 screens |
| Grid collision | `js/collision.js` | castRay (DDA), resolveWalls, circlesOverlap |
| **Crouch / stealth** | `js/input.js`, `js/entities.js`, `js/game.js` | Hold Shift/C: 45% speed, 50% rays, 70% range |
| **HUD crouch indicator** | `js/renderer.js`, `index.html`, `css/style.css` | Shows CROUCH in HUD when active |
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| Echo trail cap | `js/waves.js` | Hard cap at 500 entries |
| Mutable grid copy | `js/game.js` `loadLevel()` | Prep for Phase 3 collapsibles |

---

## Phase 0 — Complete ✅ (commit `cbc1694`)
## Phase 1 — Complete ✅ (commit `3933d22`)

**Phase 1 summary:**
- `Input.isCrouching()` — Shift, C, or mobile button
- `Player.move()` accepts crouching flag; adjusts speed by `CROUCH_SPEED_MULT = 0.45`
- Step burst uses `CROUCH_RAY_MULT = 0.5` (fewer rays) and `CROUCH_DIST_MULT = 0.7` (shorter)
- Step interval multiplied by `CROUCH_INTERVAL_MULT = 2.5` (less frequent footsteps)
- `PatrolEnemy.stepAware` flag: step-hearing patrol only activates when level sets `stepAware: true`
- `PatrolEnemy.hearStep()`: investigation mode for 3.5s, then resumes patrol
- `waves.js burst()` accepts optional `countOverride`/`maxDistOverride` params
- Level 6 "The Whisper": symmetric maze with full-width patrol corridor at row 7; only two crossing gaps force player into the patrol's hearing range; stepAware patrol reacts to normal steps (170px) but NOT crouched steps (119px)

---

## Pending Systems

| System | Phase | Priority |
|---|---|---|
| Water zones | Phase 2 | High |
| Collapsible walls | Phase 3 | High |
| Crushers | Phase 4 | Medium |
| Doors & keys | Phase 5 | Medium |
| Switches / triggers | Phase 6 | Medium |
| Sentry enemy | Phase 7 | Medium |
| BlindStalker enemy | Phase 8 | Low |
| Levels 7–10 | Phase 9 | High |
| Ambient audio | Phase 10 | Medium |
| Debug overlay | Phase 11 | Low |
| Audio polish | Phase 12 | Low |
| Mobile polish | Phase 13 | Medium |
| Final balance/polish | Phase 14 | Low |

---

## Next Recommended Task

Begin **Phase 2 — Water Zones**:
1. `collision.js` `castRay`: treat `CELL.WATER` as `CELL.EMPTY`
2. `game.js`: tile-check after player.move(), set `G.playerInWater`
3. `game.js`: apply water step multipliers; call `Audio.playFootstepWater()`
4. `renderer.js`: faint teal wash when player in water
5. Level 7 "Flooded" data in `levels.js`
6. Commit + push

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
