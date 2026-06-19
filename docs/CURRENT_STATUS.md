# CURRENT STATUS — RESONANCE

> **Last updated:** Phase 17 complete (2026-06-19)  
> Update this file after every completed task or phase.

---

## Active Phase

**Phase 18 — Reverb + Environmental Ambient Sounds**  
Status: ⬜ Pending

> See `docs/PRODUCTION_ROADMAP.md` for complete Phase 15–25 specifications.  
> Phase 16 was skipped (wavefront visual not preferred — original spoke rendering kept). Phase 17 is complete.

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
| **Positional audio** | `js/audio.js`, `js/game.js` | PannerNode HRTF; updateListener() per frame; alert/sentry/hazard sounds positioned |
| **Enemy footstep rays** | `js/entities.js`, `js/game.js`, `js/renderer.js` | 8-ray `'step-enemy'` burst per enemy step (520ms idle / 340ms hunt); muted red render |
| **BlindStalker breathing** | `js/entities.js`, `js/audio.js`, `js/game.js` | Positional 110Hz breath every 2–3s; audio cue only, no rays |
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
## Phase 12 — Complete ✅
## Phase 14 — Complete ✅ (v1.0.0)
## Phase 13 — Complete ✅

**Phase 14 summary:**
- **Title screen demo pulse**: `initTitleScreen()` in `game.js` creates a perimeter-wall grid + dedicated `G.titleRaySystem`; fires 64-ray pulse from canvas center (400, 300) every 4 seconds; renderer draws echo trails + active rays for `screen === 'title'`
- **Entity differentiation (DC-004)**: `shape` field added to PatrolEnemy/ChaserEnemy/BlindStalker/Sentry constructors; `drawEnemies()` switches on `e.shape`:
  - PatrolEnemy → arrowhead triangle pointing toward waypoint
  - ChaserEnemy → dot + outer ring (pulses fast, brightens when hunting)
  - BlindStalker → dot + 3 rotating arcs at 120° (faster when hunting)
- **Level-up fade-in**: `@keyframes screenFadeIn` + `#screen-levelup.visible { animation: screenFadeIn 0.25s ease-out }` in `css/style.css`
- **Echo trail cap verified**: enforced since Phase 0 via `ECHO_TRAIL_CAP = 500` in `RaySystem.update()`; no changes needed
- **Level 9 balance**: crusher periods already adjusted to 13.0s / 10.0s / 8.0s — sufficient crossing windows

**Phase 13 summary:**
- `@media (max-width: 480px)` block added to `css/style.css` — 4 bugs fixed:
  1. **h1 overflow**: "RESONANCE" at 2.6rem+0.22em ≈ 402px panel > 375px viewport → reduced to 1.7rem+0.14em ≈ 218px
  2. **Screen panel overflow**: reduced padding `44px 52px → 28px 20px`; added `max-width: calc(100vw - 16px)` so no panel can exceed viewport
  3. **HUD overlap with touch controls**: HUD at `bottom:14px` was visually behind `#touch-controls` (later in DOM, renders on top); moved to `top:8px` on mobile
  4. **Keyboard hint overflow**: title screen `<span class="hint">WASD / arrows...` ~300px wide in narrow panel; hidden on mobile (touch users don't need keyboard hints)
- Touch controls scaled for 281px canvas height: joystick `110→90px` + bottom offset `60→20px`; pulse btn `64→56px`; crouch btn `56→48px`; all remain ≥44px min touch target

**Phase 12 summary:**
- All `play*()` functions already read from `SOUND_CONFIG` — audit passed with no changes needed
- `audio.js` `SOUND_CONFIG`: `pitchVariation: 0.05` added to `footstep` and `footstepWater` entries
- `audio.js` `noiseNode()`: applies variation as `filterFreq × (1 + rand(−1,1) × pitchVariation)` — affects only sounds that declare `pitchVariation` in their config; all other sounds unaffected
- `audio.js`: `playFootstepSurface(surface)` dispatcher added — `'water'` → `playFootstepWater()`, else → `playFootstep()`
- `game.js`: footstep call consolidated from 3-line if/else to `Audio.playFootstepSurface(G.playerInWater ? 'water' : 'normal')`

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

## Production Phase Pending Systems

| System | Phase | Priority | Notes |
|---|---|---|---|
| Build pipeline (Vite) + Cloudflare deploy | Phase 15 | **Critical** | Start here — everything else depends on this |
| localStorage level persistence | Phase 15 | High | Players lose progress on refresh currently |
| Delete Wave/WaveManager shims | Phase 15 | Low | TD-002, quick win |
| Wavefront visual upgrade (arc-fill) | Phase 16 | High | Biggest visual gap vs Dark Echo |
| Positional audio (PannerNode) | Phase 17 | High | Enemies should pan left/right |
| Enemy footstep ray bursts | Phase 17 | **Critical** | Most important missing mechanic — enemies are silent |
| Reverb (ConvolverNode) | Phase 18 | High | Acoustic room feel |
| Environmental ambient sounds | Phase 18 | High | Drips, rumbles, creaks — non-gameplay dread |
| Player velocity inertia | Phase 19 | Medium | Movement feel |
| Screen-shake on death/collapse | Phase 19 | Low | FI-007 |
| Pulse-ready audio cue | Phase 19 | Low | QoL |
| Act II levels (11–20) | Phase 20 | High | Content volume gap vs Dark Echo |
| ScreamerEnemy | Phase 20 | Medium | New enemy type for Act II |
| Android app (Capacitor) | Phase 21 | High | Play Store prerequisite |
| Website + landing page | Phase 22 | High | No public presence currently |
| Performance hardening (60fps mobile) | Phase 23 | High | Must pass on mid-range Android |
| Level select screen | Phase 24 | Medium | Quality-of-life for 20-level game |
| Achievements (10 total) | Phase 24 | Medium | Retention and replay incentive |
| Google Play Store submission | Phase 25 | High | Final commercial goal |

---

## Phase 17 — Complete ✅

**Phase 17 summary:**
- `js/constants.js`: 6 new constants — `ENEMY_STEP_INTERVAL_IDLE=520`, `ENEMY_STEP_INTERVAL_HUNT=340`, `ENEMY_STEP_RAYS=8`, `ENEMY_STEP_MAX=80`, `BLIND_STALKER_BREATH_MIN=2000`, `BLIND_STALKER_BREATH_MAX=3000`
- `js/entities.js`: `stepTimer` + `shouldEmitStep(dt)` added to PatrolEnemy (uses `alertTimer>0` for hunt state), ChaserEnemy, BlindStalker; `breathTimer` + `shouldBreathe(dt)` added to BlindStalker
- `js/audio.js`: `createPositionalSource(x,y)` private helper; `updateListener(px,py)` export (sets HRTF listener position + orientation once on first call); `playAlert(x,y)` / `playSentryAlert(x,y)` / `playHazardPulse(x,y,volume)` updated to route through PannerNode when coordinates provided; `playEnemyFootstep(x,y)`, `playEnemyFootstepHunting(x,y)`, `playBlindStalkerBreathing(x,y)` new exports
- `js/game.js`: `Audio.updateListener()` called each frame; enemy loop dispatches `shouldEmitStep?.(dt)` → `burst('step-enemy', ...)` + audio; BlindStalker `shouldBreathe(dt)` → `playBlindStalkerBreathing`; exit reveal guard extended to exclude `'step-enemy'` rays; `playSentryAlert`, `playAlert`, `playHazardPulse` callers updated with positional args
- `js/renderer.js`: `drawActiveRays` extended to 4 passes (adds `'step-enemy'`); `rayColor()` returns `rgba(180,60,60,α)` for step-enemy; `drawEchoTrails` adds `rgba(165,50,50,α)` branch for step-enemy trails

## Phase 16 — ❌ Skipped

Phase 16 (wavefront visual upgrade) was implemented via `drawWavefront()` and immediately reverted. The arc-fill sonar ring did not look good — the original spoke/starburst rendering was preferred. This phase is permanently cancelled. Original ray rendering is unchanged.

## Phase 15 — Complete ✅

**Phase 15 summary:**
- `package.json` created — `npm run dev` (Vite dev server port 8080), `npm run build` (outputs `dist/`)
- `vite.config.js` created — `root: '.'`, `outDir: 'dist'`, `target: 'es2020'`
- `vite@8.0.16` installed — 0 vulnerabilities, 47KB gzip-13KB bundle in 82ms
- `.gitignore` created — excludes `node_modules/`, `dist/`, `android/`, `ios/`
- `.github/workflows/deploy.yml` created — CI build on PR to `main`; deploy via `wrangler deploy` on push to `main`
- `js/waves.js` — Wave and WaveManager shim classes deleted (TD-002 resolved)
- `index.html` — `#continue-btn` added to title screen above "New Game" button; hidden by default via `style="display:none"`; "Begin" renamed to "New Game" for clarity
- `js/ui.js` — `showContinueButton(levelNum)` and `hideContinueButton()` exports added
- `js/game.js` — `SAVE_KEY = 'resonance_progress'`; `localStorage.setItem` on level complete; `localStorage.removeItem` on win and restart-from-1; `'continue'` action handler; `refreshContinueButton()` helper called on init and on title screen return

## Next Recommended Task

Begin **Phase 18 — Reverb + Environmental Ambient Sounds**.

Full task list with acceptance criteria is in `docs/PRODUCTION_ROADMAP.md` Phase 18.

---

## Deployment Setup

Cloudflare Workers Git integration is connected to `ChirayuC01/dark-echo`.

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Non-production deploy command** | `npx wrangler versions upload` |
| **Root directory** | `/` |

**Workflow:** develop on `claude/beautiful-fermat-5102bb` → open PR to `main` → Cloudflare runs `npm run build` + `npx wrangler deploy` automatically on merge.

---

## Known Blockers

None currently.

---

## Branches

| Branch | Purpose |
|---|---|
| `claude/beautiful-fermat-5102bb` | Current active branch |
| `claude/sound-vision-game-7pvbo1` | Prior development branch (v1.0.0 shipped here) |

## How to Run

```
npm run dev     # development server at localhost:8080 with HMR
npm run build   # production build → dist/
npm run preview # preview the production build locally
```
