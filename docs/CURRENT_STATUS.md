# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 2 complete (2026-06-11)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 3 — Collapsible Walls**  
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
| 7 levels | `js/levels.js` | Levels 1–7 complete (Level 7 = Flooded) |
| Touch joystick | `js/input.js` | 110px zone, 40px max drag |
| Touch crouch button | `js/input.js`, `index.html` | #crouch-btn, bottom-center mobile |
| All UI screens | `js/ui.js`, `index.html` | title/pause/dead/levelup/win |
| Web Audio sounds | `js/audio.js` | SOUND_CONFIG + all play*() |
| Game loop & state | `js/game.js` | G state machine, 6 screens |
| Grid collision | `js/collision.js` | castRay (DDA), resolveWalls, circlesOverlap |
| **Crouch / stealth** | `js/input.js`, `js/entities.js`, `js/game.js` | Hold Shift/C: 45% speed, 50% rays, 70% range |
| **HUD crouch indicator** | `js/renderer.js`, `index.html`, `css/style.css` | Shows CROUCH in HUD when active |
| **Water zones** | `js/entities.js`, `js/game.js`, `js/renderer.js` | CELL.WATER=5: 60% speed, 160% rays, 60% interval, teal wash |
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| Echo trail cap | `js/waves.js` | Hard cap at 500 entries |
| Mutable grid copy | `js/game.js` `loadLevel()` | Prep for Phase 3 collapsibles |

---

## Phase 0 — Complete ✅ (commit `cbc1694`)
## Phase 1 — Complete ✅ (commit `3933d22`)
## Phase 2 — Complete ✅ (commit `e65bf1b`)

**Phase 2 summary:**
- `Player.move()` accepts `inWater` param; speed × `WATER_SPEED_MULT = 0.6`, stacks with crouch
- `G.playerInWater` detected each frame from tile under player feet (`CELL.WATER = 5`)
- Step burst multipliers stack: count × `WATER_RAY_MULT = 1.6`, interval × `WATER_INTERVAL_MULT = 0.6`
- `Audio.playFootstepWater()` called instead of `playFootstep()` when on water tile
- `drawWaterZone()` in renderer: radial teal gradient (`rgba(50,150,160)`) at player position when in water
- Level 7 "Flooded": upper maze → 3-row water crossing (cols 2–17 forced) → lower maze; two hazards in flood zone
- Crouch + water: all multipliers apply (speed = 150 × 0.45 × 0.6 = 40.5 px/s)

---

## Pending Systems

| System | Phase | Priority |
|---|---|---|
| ~~Water zones~~ | ~~Phase 2~~ | ~~High~~ |
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

Begin **Phase 3 — Collapsible Walls**:
1. `collision.js` `castRay`: treat `CELL.COLLAPSIBLE` as `CELL.WALL` (no change needed — already blocks as non-zero non-water)
2. `game.js` `applyWallHits()`: on hit where `G.grid[row][col] === CELL.COLLAPSIBLE` and `energy > COLLAPSE_ENERGY_THRESHOLD` → set cell to `CELL.EMPTY`, emit glint burst, call `Audio.playCollapse()`
3. `audio.js`: add `playCollapse()` using `SOUND_CONFIG.collapse`
4. Level 8 "The Collapse" grid in `levels.js`
5. Commit + push

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
