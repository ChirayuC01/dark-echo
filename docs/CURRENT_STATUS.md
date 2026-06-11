# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 0 in progress  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 0 — Cleanup & Foundation**  
Status: 🔄 In Progress

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
| PatrolEnemy | `js/entities.js` | Waypoint cycle, pulse-stun 0.6s |
| ChaserEnemy | `js/entities.js` | Idle wander + hunt state |
| Hazard | `js/entities.js` | Timed pulse emitter, proximity kill |
| 5 levels | `js/levels.js` | Levels 1–5 complete |
| Touch joystick | `js/input.js` | 110px zone, 40px max drag |
| All UI screens | `js/ui.js`, `index.html` | title/pause/dead/levelup/win |
| Web Audio sounds | `js/audio.js` | footstep, pulse, alert, death, levelComplete, hazardPulse |
| Game loop & state | `js/game.js` | G state machine, 6 screens |
| Grid collision | `js/collision.js` | castRay (DDA), resolveWalls, circlesOverlap |

---

## In Progress

| Task | File | Notes |
|---|---|---|
| Remove unused constants | `js/constants.js` | ✅ Done in this session |
| Add CELL.COLLAPSIBLE, CELL.WATER | `js/constants.js` | ✅ Done in this session |
| Add crouch/water/collapse constants | `js/constants.js` | ✅ Done in this session |
| Add ECHO_TRAIL_CAP | `js/constants.js` | ✅ Done in this session |
| Add SOUND_CONFIG to audio.js | `js/audio.js` | ⬜ Pending |
| Enforce ECHO_TRAIL_CAP in waves.js | `js/waves.js` | ⬜ Pending |

---

## Pending Systems (not yet started)

| System | Phase | Priority |
|---|---|---|
| Crouch / stealth mechanic | Phase 1 | High |
| Water zones | Phase 2 | High |
| Collapsible walls | Phase 3 | High |
| Crushers | Phase 4 | Medium |
| Doors & keys | Phase 5 | Medium |
| Switches / triggers | Phase 6 | Medium |
| Sentry enemy | Phase 7 | Medium |
| BlindStalker enemy | Phase 8 | Low |
| Levels 6–10 | Phase 9 | High |
| Ambient audio | Phase 10 | Medium |
| Debug overlay | Phase 11 | Low |
| Audio polish | Phase 12 | Low |
| Mobile polish | Phase 13 | Medium |
| Final balance/polish | Phase 14 | Low |

---

## Next Recommended Task

Complete Phase 0:
1. Add `SOUND_CONFIG` to `js/audio.js` and wire existing `play*()` functions
2. Add hard cap `ECHO_TRAIL_CAP` enforcement in `js/waves.js`
3. Commit and push Phase 0

Then begin **Phase 1 — Crouch Mechanic**.

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
