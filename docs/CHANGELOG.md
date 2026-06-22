# CHANGELOG — RESONANCE

> Format: `## [vX.Y] — Date — Phase N`  
> Follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [v0.19.0] — 2026-06-17 — Phase 14

### Added
- **Title screen demo pulse**: A 64-ray pulse fires from canvas center every 4 seconds on the title screen, bouncing off canvas-edge walls. New players see the core sound-visualization mechanic before touching any controls. Implemented via a dedicated `G.titleRaySystem` + perimeter-wall grid in `game.js`; renderer draws echo trails and active rays when `screen === 'title'`.
- **Entity visual differentiation (DC-004 resolved)**: Each of the three "dot" enemy types now has a distinct rendered shape within the same red danger palette:
  - **PatrolEnemy**: directional arrowhead triangle pointing toward current waypoint target.
  - **ChaserEnemy**: dot + concentric outer ring (ring pulses rapidly and brightens when in `hunting` state).
  - **BlindStalker**: dot + 3 rotating arcs at 120° spacing (spin faster when hunting, communicate sound awareness).
  - Sentry and Hazard already had distinct visuals (cone and orange respectively); unchanged.
  - `shape` field added to all enemy constructors; `drawEnemies()` switches on `e.shape`.

### Changed
- **Level-up screen transition**: `#screen-levelup.visible` now fades in with a 0.25s `ease-out` CSS animation (`@keyframes screenFadeIn`). Makes level completion feel more deliberate.

### Verified
- Echo trail cap (`ECHO_TRAIL_CAP = 500`) holds correctly under rapid pulse spam — enforced in `RaySystem.update()` since Phase 0.
- All 10 levels confirmed completable via static audit; Level 9 crusher periods (13.0s / 10.0s / 8.0s) provide sufficient crossing windows.

---

## [v1.2.0] — 2026-06-19 — Phase 16

### Changed
- **Wavefront visual upgrade**: Active pulse/step bursts now render as an expanding sonar ring instead of a starburst spoke pattern. Each `burst()` call gets a unique `burstId` and `startTime`; `drawWavefront()` groups rays by `burstId`, sorts by angle from burst origin, and connects adjacent tips with `ctx.arc()` strokes at the median radius. Arc connections are only drawn when adjacent rays are within π/16 of each other — gaps appear correctly where sound has hit walls or bounced away.
- **Shockwave origin ring**: A faint circle expands from 0 to 32px at the burst origin over 200ms then fades, giving each pulse a tactile "impact" feel at the source point.
- **Soft glow on wavefront**: `ctx.filter = 'blur(1.5px)'` applied to the wavefront arc pass when FPS ≥ 45; disabled automatically on low-end hardware.
- **Echo trails unchanged**: Historical sealed segments still render as individual line segments — the geometric history of past bounces.

### Technical
- `js/waves.js`: module-level `_nextBurstId` counter; `burst()` stamps each ray with `burstId` and `startTime` via `performance.now()`
- `js/renderer.js`: `drawActiveRays()` no longer draws the live tip segment (was the spoke); sealed bounce segments still draw. New `drawWavefront()` function draws the arc ring + origin ring.

---

## [v1.1.0] — 2026-06-18 — Phase 15

### Added
- **Vite build pipeline**: `package.json` + `vite.config.js` (Vite 8.0.16, 0 vulnerabilities). `npm run dev` starts HMR dev server on port 8080; `npm run build` produces 47KB JS bundle in `dist/` in 82ms; `npm run preview` serves production build locally.
- **GitHub Actions CI/CD** (`.github/workflows/deploy.yml`): builds on every push and PR; deploys to Cloudflare Pages on push to main (requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` GitHub secrets).
- **`.gitignore`**: covers `node_modules/`, `dist/`, `android/`, `ios/`, editor dirs.
- **localStorage level persistence** (`SAVE_KEY = 'resonance_progress'`): saves 0-based `levelIndex` on every level complete; clears on game win and restart-from-1.
- **Continue button** on title screen: shown when saved progress exists above Level 1, displaying "Continue — Level N" (1-based); hidden when no save or save is at Level 1.

### Removed
- **`Wave` and `WaveManager` shim classes** from `js/waves.js` (TD-002 resolved): dead backward-compat code from the circular-wave → DDA-ray migration; confirmed no imports anywhere.

---

## [v2.0.0] — 2026-06-22 — Phase 20

### Added
- **ScreamerEnemy** (`js/entities.js`): Stationary sound trap. Any ray passing within `HAZARD_RADIUS + 4px` triggers a 48-ray burst from the screamer's position and alerts all enemies within 300px. Kills player on direct contact. Rendered as pulsing orange-red glyph with 4 diagonal spikes; turns solid red once triggered.
- **`spawn_enemy` trigger action** (`js/game.js`): `targetId` format `"type,col,row"`. Spawns a `chaser`, `stalker`, or `screamer` at the target cell center on player proximity. Used in L18 "The Web" to introduce a chaser mid-level.
- **`playScreamer()`** (`js/audio.js`): Layered piercing sound — sawtooth 2400Hz + sine 3200Hz + square 1800Hz stacked over a noise burst (gain 0.4, 1.5s). Unmistakable alarm cue.
- **Act II — 10 new levels** (`js/levels.js`):
  - L11 "The Corridor II" — 3 step-aware patrols in parallel corridors (reverb: large)
  - L12 "The Chamber II" — 2 screamers + chaser in large open room (reverb: large)
  - L13 "The Factory" — 4 horizontal crushers + patrol, industrial gauntlet (reverb: medium)
  - L14 "The Scream" — 3 screamers + collapsible wall + step-aware patrol; pulse-free challenge (reverb: medium)
  - L15 "The Archive" — 3 keys + 3 doors + chaser + patrol + hazard; dense maze (reverb: small)
  - L16 "The Flood II" — water zone + 2 screamers inside water + 2 hazards (reverb: large)
  - L17 "The Awakening II" — BlindStalker only in open space; pure stealth test (reverb: large)
  - L18 "The Web" — spawn_enemy chain + remove_wall trigger + patrol + hazard (reverb: medium)
  - L19 "The Vault" — 2 screamers + crusher + BlindStalker + sentry + key/door (reverb: large)
  - L20 "The Deep" — all mechanics combined; largest map; hardest level in the game (reverb: large)

### Technical
- `js/constants.js`: `SCREAMER_ALERT_RADIUS = 300`, `SCREAMER_BURST_RAYS = 48`
- `js/game.js`: `G.screamers = []` array; screamer detection inside `processRayEntities()` (any non-step-enemy ray); screamer kill check in `checkDeath()`; `spawn_enemy` action in `fireTrigger()` parses `"type,col,row"` and pushes the new entity into the appropriate array
- `js/renderer.js`: `drawScreamers()` — orange-red radial glow + 4 rotated spike arms drawn via `ctx.rotate`; arms collapse and color turns solid red on trigger

---

## [v1.3.0] — 2026-06-22 — Phase 19

### Added
- **Player velocity inertia** (`js/entities.js`): `Player` gains `vx = 0`, `vy = 0` fields. `move()` lerps toward target velocity: `this.vx += (dx * speed - this.vx) * Math.min(1, accel * dt)`. `PLAYER_ACCEL = 12` (lerp factor, not px/s²). Crouch reduces accel by 45% for more deliberate feel.
- **Screen-shake** (`js/game.js`, `js/renderer.js`): `G.shake = { x, y, timer, intensity, duration }` state field. `triggerShake(intensity, duration)` helper decays linearly per frame. Triggers: collapse → `(4, 0.25)`, death → `(6, 0.35)`, crusher near-miss (within 12px margin, debounced by shake timer) → `(2, 0.15)`. In renderer: `ctx.save(); ctx.translate(shake.x, shake.y)` wraps all game drawing; `ctx.restore()` before vignette so overlay stays fixed.
- **Pulse-ready audio cue** (`js/audio.js`, `js/game.js`): `SOUND_CONFIG.pulseReady` — 1800Hz sine, 0.04s, gain 0.08. `playPulseReady()` export. Fires once in `game.js` when `G.pulseCooldown` transitions from `> 0` to `<= 0`.
- **Danger proximity audio** (`js/audio.js`, `js/game.js`): `setDangerLevel(t)` export modulates `_ambientGain` via `setTargetAtTime(0.035 + t * 0.05, now, 0.1)`. Called each frame with `t = 1 - nearestEnemyDist / DANGER_NEAR_PX` when enemy is within `DANGER_NEAR_PX = 100px`.
- **Level entry pulse** (`js/game.js`): 300ms after `loadLevel()`, a free pulse burst fires from player start position via `setTimeout`. Does not consume cooldown. Gives player one "free look" at starting geometry.

### Technical
- `js/constants.js`: `PLAYER_ACCEL = 12`, `DANGER_NEAR_PX = 100`
- Level entry pulse captured with closure over `entryX`, `entryY`; guarded by `G.screen === 'playing'`

---

## [v1.2.5] — 2026-06-22 — Phase 18

### Added
- **Reverb via ConvolverNode** (`js/audio.js`): `createImpulseResponse(ac, duration, decay)` generates a stereo noise buffer with exponential decay. `initReverb()` creates `_convolver` + `_reverbSend` gain node (gain 0.25), called once from `startAmbient()`. `addReverb(gainNode)` taps any gain node into the convolver. `setReverbSize(size)` accepts `'small'` (decay 0.18s) / `'medium'` (decay 0.4s) / `'large'` (decay 0.8s); hot-swaps convolver buffer if already live. `_pendingReverbSize` stores size from `loadLevel()` before `initReverb()` is called.
- **Environmental ambient sounds** (`js/audio.js`): `startEnvironmental()` / `stopEnvironmental()` exports. Three procedural loops via `setTimeout` chains with `_envActive` guard: **Drip** (bandpass 300Hz, 40ms, gain 0.06, random pan, 4–12s interval), **Rumble** (lowpass 60Hz, 1.2s, gain 0.02, 18–35s), **Creak** (bandpass 800Hz Q=3, 0.3s, gain 0.04, 12–28s). Sounds are heard but not visualized as rays — ambient dread only.
- **Per-level reverb** (`js/levels.js`): `reverb` field added to all 10 Act I levels — `'small'` (L1 Awakening, L6 Whisper), `'medium'` (L2 Patrol, L3 Chamber, L4 Hunt, L8 Collapse), `'large'` (L5 Gauntlet, L7 Flooded, L9 Corridor, L10 Gauntlet II).

### Changed
- **Reverb routing on game sounds**: `osc()` gains 7th `reverb` param; `noiseNode()` checks `cfg.reverb`; `playPulse()`, `playCollapse()`, enemy footstep sounds flagged with `reverb: true`
- **`game.js` wiring**: `Audio.setReverbSize(def.reverb ?? 'medium')` in `loadLevel()`; `startEnvironmental()` / `stopEnvironmental()` wired alongside `startAmbient()` / `stopAmbient()` across all play/death/win/title transitions

---

## [v1.2.0] — 2026-06-19 — Phase 17

### Added
- **Positional audio (PannerNode HRTF)** (`js/audio.js`): `createPositionalSource(x, y)` helper creates a `PannerNode` at world coordinates (`panningModel: 'HRTF'`, `distanceModel: 'inverse'`, `refDistance: 120`, `maxDistance: 600`, `rolloffFactor: 1.2`). `updateListener(px, py)` export sets HRTF listener position each frame. `playAlert(x,y)`, `playSentryAlert(x,y)`, `playHazardPulse(x,y,volume)` updated to route through `createPositionalSource`.
- **Enemy footstep ray bursts** (`js/entities.js`, `js/game.js`, `js/renderer.js`): `stepTimer` + `shouldEmitStep(dt)` added to `PatrolEnemy`, `ChaserEnemy`, `BlindStalker`. Intervals: 520ms idle / 340ms hunting. Each step emits an 8-ray `'step-enemy'` burst at 80px max distance. Enemy step rays render in muted red `rgba(180,60,60,α)` (active) and `rgba(165,50,50,α)` (echo trails). Enemy step rays DO NOT trigger enemy hearing and DO NOT count for exit reveal.
- **Enemy footstep audio** (`js/audio.js`): `playEnemyFootstep(x, y)` — noise burst, gain 0.07, cutoff 240Hz, positional. `playEnemyFootstepHunting(x, y)` — louder (gain 0.13), higher cutoff (320Hz), positional. Called from `game.js` enemy step loop.
- **BlindStalker breathing** (`js/entities.js`, `js/audio.js`, `js/game.js`): `breathTimer` + `shouldBreathe(dt)` on `BlindStalker`; fires every 2–3 seconds. `playBlindStalkerBreathing(x, y)` — 110Hz triangle, gain 0.03, 0.3s, positional. Audio cue only, no rays.

### Technical
- `js/constants.js`: `ENEMY_STEP_INTERVAL_IDLE = 520`, `ENEMY_STEP_INTERVAL_HUNT = 340`, `ENEMY_STEP_RAYS = 8`, `ENEMY_STEP_MAX = 80`, `BLIND_STALKER_BREATH_MIN = 2000`, `BLIND_STALKER_BREATH_MAX = 3000`
- `js/renderer.js`: `drawActiveRays` and `drawEchoTrails` both extended with `'step-enemy'` color branch (4-pass draw for active rays)
- `Audio.updateListener()` called every frame in `game.js` `update()`

---

## [Unreleased]

---

## [v1.0.1] — 2026-06-18 — Production Audit

### Added
- `docs/PRODUCTION_ROADMAP.md` — complete specifications for Phases 15–25 covering: Vite build pipeline, Cloudflare Pages deployment, wavefront visual upgrade, positional audio + enemy footstep rays, reverb + environmental sounds, movement inertia + micro-polish, Act II (10 more levels + ScreamerEnemy), Android Capacitor packaging, website + landing page, performance hardening, achievements + level select, and Google Play Store submission.

### Changed
- `docs/CURRENT_STATUS.md` — active phase updated to Phase 15; production pending systems table added; branch table updated; run instructions updated to reflect post-Vite workflow.
- `docs/IMPLEMENTATION_ROADMAP.md` — Phases 15–25 appended as pending with quick-reference task lists, referencing PRODUCTION_ROADMAP.md for full specs.
- `docs/PROJECT_MASTER_SPEC.md` — project identity updated with deployment targets; Out of Scope revised; Section 14 (Production Scope) and Section 15 (New Systems v1.1+) added.
- `docs/KNOWN_ISSUES.md` — 8 new tech debt entries (TD-007–TD-014); Future Improvements table updated with target phases.
- `docs/DEVELOPMENT_LOG.md` — Production Audit session entry added.

### Notes
- No game code changed in this session. Documentation only.
- v1.0.0 game is feature-complete and playable locally. This documents the production planning audit.

---

## [v0.18.0] — 2026-06-17 — Phase 13

### Fixed
- **Mobile: title h1 overflow** — "RESONANCE" at `2.6rem + 0.22em letter-spacing` produces a ~402px panel on a 375px viewport. New rule at `max-width: 480px` reduces to `1.7rem + 0.14em` (~218px panel). No clipping.
- **Mobile: screen panel overflow** — reduced padding from `44px 52px` to `28px 20px` and added `max-width: calc(100vw - 16px)` on all `.screen` elements at narrow viewports. Panels can never exceed the viewport width.
- **Mobile: HUD obscured by touch controls** — `#hud` was at `bottom: 14px` while `#touch-controls` (later in DOM, renders above) had its joystick at `bottom: 20–110px`. HUD text was visually behind the joystick zone. Fixed by moving HUD to `top: 8px` on mobile.
- **Mobile: keyboard hint overflow** — title screen `<span class="hint">WASD / arrows · SPACE = pulse · P / ESC = pause</span>` is ~300px wide at 0.72rem in a 218px-wide panel. Hidden via `#screen-title .hint { display: none }` on mobile (keyboard hints are irrelevant on touch devices).
- **Mobile: touch controls oversized for 281px canvas** — at 375px viewport the canvas is 281px tall; the 110px joystick with 60px bottom offset consumed 60.5% of canvas height. Scaled down: joystick `90px`, pulse btn `56px`, crouch btn `48px`; bottom offsets reduced to `20–27px`. All targets remain ≥44px minimum.

---

## [v0.17.0] — 2026-06-17 — Phase 12

### Changed
- **Footstep pitch variation**: each footstep (normal and water) now plays at a slightly different lowpass cutoff frequency — ±5% random variation per step
  - `SOUND_CONFIG.footstep` and `SOUND_CONFIG.footstepWater` both gain `pitchVariation: 0.05`
  - `noiseNode()` applies: `filterFreq × (1 + rand(−1,1) × pitchVariation)` — zero variation for sounds without the field
- **Surface dispatcher**: `playFootstepSurface(surface)` added to `audio.js`; `game.js` uses it instead of the inline if/else
- **Audit**: all `play*()` functions confirmed to read exclusively from `SOUND_CONFIG` — no hardcoded audio parameters remain

---

## [v0.16.0] — 2026-06-17 — Phase 11

### Added
- **Debug overlay** (`js/debug.js`): Backtick key toggles a diagnostic panel in the top-left corner during gameplay
  - FPS counter (EMA, color-coded: green ≥55fps / yellow ≥30fps / red <30fps)
  - Active ray count, echo trail count (warns orange when ≥85% of 500-cap), impact glint count
  - Player pixel coordinates + tile coordinates, crouch flag, water flag
  - All entities listed by type (constructor name), current state, and position
  - Entity lines color-coded: hunting/alert states in coral; idle in muted rose
  - Semi-transparent dark panel with faint blue border, monospace font, drawn above vignette
- `js/input.js`: `Backquote` key sets `_debugToggle`; new `consumeDebugToggle()` export
- `js/game.js`: FPS tracked as exponential moving average in `G.fps`; debug toggle consumed each frame; `fps` forwarded in state spread to renderer
- `js/renderer.js`: imports `Debug`; calls `Debug.draw()` as final draw step

---

## [v0.15.0] — 2026-06-17 — Phase 10

### Added
- **Ambient audio drone**: Continuous 55Hz sine wave plays quietly during all gameplay
  - `startAmbient()` / `stopAmbient()` in `audio.js` were already implemented from Phase 0; this phase wires them to game events
  - Drone fades in over 1.5s on game start; fades out over 0.5s on death or win
  - `game.js` `handleAction()`: `startAmbient()` called on `'start'`, `'resume'`, `'restart'`, `'restart-from-1'`, `'next-level'`
  - `game.js` `die()`: `stopAmbient()` called before `playDeath()` — drone stops before death sound plays
  - `game.js` `checkExit()`: `stopAmbient()` called in win branch before showing win screen
  - `game.js` `handleAction('title')`: `stopAmbient()` on returning to title screen
  - Null guard in `startAmbient()` prevents stacking across rapid calls; safe to call on every gameplay entry

---

## [v0.14.0] — 2026-06-17 — Phase 9

### Fixed
- **Level 9 trigger placement bug (critical)**: The `remove_wall` trigger was placed at `col 3, row 9` — unreachable in normal play. Player path in row 9 enters at col 14 (gap in row 8 wall) and exits at col 6 (gap in row 10 wall), never crossing col 3. Trigger moved to `col 10, row 9` (mid-path), ensuring the wall at row 13 col 16 is always removed before the player reaches the exit sprint.

### Documentation
- **DC-004 added to KNOWN_ISSUES.md**: All three "dot" enemy types (PatrolEnemy, ChaserEnemy, BlindStalker) are visually identical under pressure. Proposed shape vocabulary documented:
  - PatrolEnemy → directional triangle (movement direction)
  - ChaserEnemy → circle + outer ring (ring brightens when hunting)
  - BlindStalker → dot + 3 radiating arcs at 120° (communicates sound-awareness)
  - Deferred to Phase 14 polish pass
- **PROJECT_MASTER_SPEC.md section 3** updated with enemy shape vocabulary table

---

## [v0.13.0] — 2026-06-16 — Phase 8

### Added
- **BlindStalker enemy**: fast sound-hunter that detects all noise including crouched footsteps
  - `BlindStalker` class in `entities.js`: same state machine as `ChaserEnemy` but hears everything
  - Hunt speed: 104 px/s (`CHASER_SPEED_HUNT × 1.3`); idle speed: 30 px/s
  - Hunt timer: 4 seconds (shorter than ChaserEnemy's 6s)
  - `hearSound()` called by `processRayEntities()` for all step and pulse rays, ignoring `ray.quiet` flag — crouching does NOT hide the player from it
  - Re-acquires instantly on each new sound before timer expires
  - 3 new constants: `BLIND_STALKER_SPEED_IDLE`, `BLIND_STALKER_SPEED_HUNT`, `BLIND_STALKER_HUNT_DURATION`
  - Spawn from `type: 'stalker'` in level def enemies array
- **Level 10 "The Gauntlet II"**: all mechanics combined, BlindStalker introduced
  - BlindStalker at col 15 row 5 — hears the forced pulse at col 5 row 5
  - Collapsible wall at col 5 row 5 blocks path to key; player must pulse it (alerting stalker)
  - Key at col 2 row 7; door at col 10 row 10 — key/door chokepoint
  - Water zone in row 3 (cols 2–8, 10–17) with two hazards bracketing the dry path at col 9
  - Step-aware patrol sweeps row 9 (player must crouch to cross)
  - Horizontal crusher in row 11 (range 3, period 5.5s)
  - Sentry at col 14 row 13 guards the final sprint to exit

---

---

## [v0.12.0] — 2026-06-16 — Phase 7

### Added
- **Sentry enemy**: stationary guard with rotating visual scan cone
  - `Sentry` class in `entities.js`: state machine `idle`/`alert`/`stunned`
  - Scan cone: 90° arc (±45°), 180px range, rotates at 60°/s
  - Detection: player must be inside cone AND have clear line-of-sight (castFn ray check)
  - On spot: 8-second pursuit at `CHASER_SPEED_HUNT = 80 px/s`
  - Pulse hit: stuns 0.6s (same as PatrolEnemy)
  - 4 new constants: `SENTRY_SCAN_RANGE`, `SENTRY_SCAN_ARC`, `SENTRY_SCAN_SPEED`, `SENTRY_HUNT_DURATION`
  - `playSentryAlert()` already present in `audio.js` from Phase 0
- **Sentry cone rendered** in `drawEnemies()`: faint orange arc in idle, bright red in alert; drawn behind enemy dot; `e.scanRange` field acts as Sentry discriminator in renderer
- Level 9 "The Corridor" now has sentry at row 13 col 12 guarding the exit sprint

### Changed
- **Trigger visual** — now much more noticeable:
  - Larger outer glow (28px radius, was 16px)
  - More dramatic pulse beat (0.35–0.80 amplitude swing, was 0.50–0.75)
  - Pulsing outer ring stroke
  - Slow-rotating 4-spoke cross indicator distinguishes it from key/exit/door dots
  - Brighter center dot (4.5px, was 3px)

---

## [v0.11.0] — 2026-06-16 — Phase 6

### Added
- **Switches / triggers mechanic**: one-shot floor trigger zones revealed by sound
  - `G.triggers[]` array in game state; populated from `def.triggers[]` level def field
  - Trigger format: `{ col, row, action, targetId }` — action is `'open_door'` or `'remove_wall'`
  - Triggers revealed by ray proximity (same 28px `REVEAL_D` threshold as exit/key/door)
  - Player walks within 10px of trigger center → fires exactly once; `fired = true` prevents re-trigger
  - `'open_door'`: opens the door with matching `targetId` (same logic as key pickup)
  - `'remove_wall'`: clears `G.grid[row][col]` at the `"row,col"` coordinate in `targetId`
  - `drawTriggers()` in `renderer.js`: bright blue-white `rgba(100,160,255)` pulsing radial dot; disappears on fire; `sin(now/350)` pulse distinguishes from keys (400ms) and exit (500ms)
- Level 9 "The Corridor" extended with trigger puzzle:
  - Wall at row 13 col 16 blocks direct path to exit
  - Trigger at row 9 col 3 removes it — fires naturally as player walks left toward corridor 3 entry
  - Hint updated: "A switch unlocks the exit · Watch for the crusher · Wait, then dash"

---

## [v0.10.0] — 2026-06-12 — Phase 5

### Added
- **Doors & keys mechanic**: hidden collectibles that unlock blocked passages
  - `KEY_PICKUP_RADIUS = 12` in `constants.js`
  - `G.doors: Map<id, {col, row, x, y, open, revealedAt}>` — closed doors are written into the mutable grid as `CELL.WALL`; opening restores `CELL.EMPTY`
  - `G.keys: Map<id, {col, row, x, y, collected, doorId, revealedAt}>` — player walks within 12px to collect
  - `G.doorsByCell: Map<"row,col", door>` — fast lookup to identify which wall hits are doors
  - Key pickup: `Audio.playKeyPickup()` + matching door opens instantly + `Audio.playDoorOpen()`
  - Doors and keys revealed by ray proximity (same 28px threshold as exit)
  - Door impact glints render amber `rgba(210,160,50)` — distinct from regular wall glints
  - `drawDoors()` in `renderer.js`: amber fill+stroke locked; faint green open; hearing-attenuated
  - `drawKeys()` in `renderer.js`: gold `rgba(255,210,80)` pulsing radial gradient dot
- Level 8 "The Collapse" redesigned with key/door chokepoint:
  - Row 9 all-walls except col 9 (door) — only passage from middle zone to lower section
  - Key at col 16, row 3 (upper section; near chaser at col 14)
  - Door unlocks when key collected; lower section then accessible
  - Simplified lower section: wide open rows 10 + 12, col 18 corridor to exit col 18 row 13

---

## [v0.9.0] — 2026-06-12 — Phase 4

### Added
- **Crusher mechanic**: moving lethal wall segments
  - `Crusher` class in `entities.js`: sinusoidal `h`/`v` axis motion, TILE-sized AABB
  - Random start phase per crusher — avoids synchronized movement on level load
  - `castRayCrushers()` in `collision.js`: AABB slab-method ray intersection, returns closest crusher hit
  - `circleOverlapsAABB()` in `collision.js`: player vs crusher kill check
  - `castFn` now composites grid DDA and crusher slab results, returns closest hit
  - Crushers revealed by ray proximity (`processRayEntities`) and direct ray bounce (`applyWallHits`)
  - Crusher kill: `circleOverlapsAABB` overlap → `die('Crushed.')`
  - Crusher impacts render in orange (same palette as hazard) via `cellType: 'crusher'` on impact objects
  - `drawCrushers()` in `renderer.js`: orange filled+stroked block, hearing-attenuated, glow
- Level 9 "The Corridor" — 3 corridors (rows 3, 5, 7), one crusher each (5.0s / 3.5s / 2.5s period), S-shaped path to exit

---

## [v0.8.0] — 2026-06-12 — Phase 3

### Added
- **Collapsible wall mechanic**: `CELL.COLLAPSIBLE = 4` tiles block rays and movement like walls
  - Destroyed by a direct pulse ray hit with energy > `COLLAPSE_ENERGY_THRESHOLD (0.3)`
  - Permanent: `G.grid[row][col]` mutated to `CELL.EMPTY`; path stays open for the rest of the level
  - Collapse emits a 12-ray glint burst at hit point (`COLLAPSE_BURST_RAYS = 12`, 80px maxDist)
  - Collapse audio: `playCollapse()` — low rumble + noise burst
  - Step rays and hazard rays cannot trigger collapse (energy too low after bounces)
- Collapsible wall glints render as warm tan `rgba(200,175,120,α)` — distinct from white-blue wall glints
- `collision.js` `castRay` and `resolveWalls` now treat `CELL.COLLAPSIBLE` as solid (same as `CELL.WALL`)
- `applyWallHits()` stores `cellType: 'collapsible'` on impact objects for renderer coloring
- Level 8 "The Collapse" — two horizontal barriers at rows 6 and 8 (single collapsible gap each at col 9); patrol in middle zone; chaser in upper section

---

## [v0.7.0] — 2026-06-11 — Phase 2

### Added
- **Water zone mechanic**: `CELL.WATER = 5` tiles affect player movement and step sound
  - Speed: 60% of normal (`WATER_SPEED_MULT = 0.6`), stacks multiplicatively with crouch
  - Step interval: 60% of normal (`WATER_INTERVAL_MULT = 0.6`) — more frequent splashes
  - Step ray count: 160% of normal (`WATER_RAY_MULT = 1.6`) — louder, more visible splash
  - Crouch + water combined: speed = 150 × 0.45 × 0.6 = 40.5 px/s
- `Player.move()` now accepts 6th param `inWater = false`; applies `WATER_SPEED_MULT`
- `Player.inWater` field set each frame from tile under player
- `G.playerInWater` state flag in `game.js`; checked before every step burst
- `drawWaterZone()` in `renderer.js` — radial teal gradient (`rgba(50,150,160)`) at player position when on water tile
- `Audio.playFootstepWater()` called when stepping on water (replaces `playFootstep()`)
- Level 7 "Flooded" — upper maze → forced 3-row water crossing (cols 2–17) → lower maze; two hazards inside the flood zone

---

## [v0.6.0] — 2026-06-11 — Phase 1

### Added
- **Crouch / stealth mechanic**: Hold Shift or C (keyboard) or tap CROUCH button (mobile)
  - Speed: 45% of normal (`CROUCH_SPEED_MULT = 0.45`)
  - Step interval: 2.5× longer (`CROUCH_INTERVAL_MULT = 2.5`)
  - Step ray count: 50% fewer (`CROUCH_RAY_MULT = 0.5`)
  - Step ray max distance: 70% shorter (`CROUCH_DIST_MULT = 0.7`)
- `Input.isCrouching()` export
- `#crouch-btn` mobile touch button (bottom-center)
- `#crouch-indicator` HUD element — lights up when crouching
- `PatrolEnemy.stepAware` flag + `hearStep()` investigation behavior (3.5s)
- `RaySystem.burst()` optional `countOverride`/`maxDistOverride` parameters
- Level 6 "The Whisper" — introduces crouch mechanic via step-aware patrol
- `loadLevel()` now deep-copies grid (prep for Phase 3 collapsible walls)

---

## [v0.5.1] — 2026-06-11 — Phase 0

### Added
- `/docs/` directory with 6 project documentation files:
  - `PROJECT_MASTER_SPEC.md` — source of truth for all design decisions
  - `IMPLEMENTATION_ROADMAP.md` — phase-by-phase task tracking
  - `CURRENT_STATUS.md` — live status snapshot
  - `DEVELOPMENT_LOG.md` — session history
  - `KNOWN_ISSUES.md` — bugs, tech debt, future improvements
  - `CHANGELOG.md` — this file
- New constants in `js/constants.js`:
  - `CELL.COLLAPSIBLE = 4` — walls destroyable by pulse
  - `CELL.WATER = 5` — water tiles affecting movement and sound
  - `ECHO_TRAIL_CAP = 500` — hard cap for echo trail array
  - `CROUCH_SPEED_MULT`, `CROUCH_INTERVAL_MULT`, `CROUCH_RAY_MULT`, `CROUCH_DIST_MULT`
  - `WATER_SPEED_MULT`, `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`, `WATER_ENERGY_DRAIN`
  - `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS`

### Removed
- Legacy unused constants from `js/constants.js`:
  - `STEP_WAVE_MAX`, `STEP_WAVE_SPEED`, `STEP_WAVE_ALPHA`
  - `PULSE_WAVE_MAX`, `PULSE_WAVE_SPEED`, `PULSE_WAVE_ALPHA`
  - `WAVE_RING_W`
  - `HAZARD_PULSE_MAX`, `HAZARD_PULSE_SPEED`

---

## [v0.5.0] — 2026-06-10 — Prototype Complete

### Added
- Full working browser game prototype (5 levels, all core systems)
- DDA ray-based sound propagation system replacing old circular wave system
- Wall impact glints — geometry revealed only by ray bounces
- Echo trail system — sealed ray segments persist with smoothstep fade
- Distance attenuation — all visuals and audio scale with distance from player
- Hidden exit — exit only revealed when player ray passes near it
- Entity reveal via ray proximity — enemies only shown when sound finds them
- PatrolEnemy — waypoint cycle, pulse-stun mechanic
- ChaserEnemy — idle wander + hearing-triggered hunt state
- Hazard — timed scan pulse emitter, proximity kill zone
- 5 hand-crafted levels (The Awakening, The Patrol, The Chamber, The Hunt, The Gauntlet)
- Web Audio API procedural sounds: footstep, pulse, alert, death, level complete, hazard pulse
- Touch joystick and pulse button for mobile
- Full UI: title, pause, death, level-up, win screens
- HUD: pulse cooldown bar + level label
- Responsive layout (800×600 → 100vw×75vw on mobile)

### Technical
- ES Modules throughout (`type="module"`)
- Single canvas, `requestAnimationFrame` game loop
- Object pool for Ray instances (`RaySystem._pool[]`)
- `dt` capped at 0.05s to prevent physics tunneling
- Ray object: `segX/segY` (segment start), `tipX/tipY` (leading edge), `heardEntities` Set (one-shot hearing)
- `hearing(d)` smoothstep function applied to all rendered elements
- `segPtDist()` utility for ray-segment to entity distance
