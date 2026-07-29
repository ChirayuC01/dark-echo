# CURRENT STATUS — RESONANCE

> **Last updated:** 2026-07-20 — full 20-level game; Phases 15–24 done (16 skipped); Phase 25 deferred; player rendered as animated footsteps.  
> Update this file after every completed task or phase.

## Project at a glance

RESONANCE is a complete, playable 20-level top-down stealth/horror game where **sound is the only vision** — the screen is black and geometry is revealed by visualized sound echoes. Vanilla ES-module JavaScript on Canvas 2D + Web Audio, built with Vite, deployed on Cloudflare Workers Static Assets, and packaged for Android via Capacitor.

- **Web**: landing page at `/`, game at `/play/`.
- **Gameplay**: 2 Acts / 20 levels; 6 enemy archetypes (Patrol, Chaser, Sentry, BlindStalker, Hazard, Screamer) + Crushers; crouch stealth, water, collapsible walls, doors/keys, switch/spawn triggers.
- **Audio**: procedural Web Audio — positional (HRTF), reverb (ConvolverNode), ambient drone + environmental sounds, enemy footsteps/breathing.
- **Feel**: velocity inertia, screen-shake, adaptive quality tiers, animated footprint player representation.
- **Meta**: localStorage save (progress, best times, achievements), level-select, 10 achievements.
- **Remaining**: Phase 25 (Google Play submission) — deferred by owner; needs signed AAB + on-device profiling + store assets.

---

## Active Phase

**None active — next up: Phase 26 (Sound Grammar Fixes). Phase 25 (Play Store) deferred by owner.**

> See `docs/PRODUCTION_ROADMAP.md` for complete Phase 15–30 specifications.  
> Phase 16 was skipped (wavefront visual not preferred). Phases 17–24 are complete.
> **Phase 25 (Google Play submission) is deferred by owner decision** — the game is
> feature-complete for the roadmap's gameplay scope but not yet considered fully
> production-ready for a public store launch.

### Dark Echo parity backlog (Phases 26–30, added 2026-07-27)

An audit against the original Dark Echo design spec (20 mechanics) found
**12 fully present · 5 partial · 3 missing**. The gaps are now planned as five
phases in `docs/PRODUCTION_ROADMAP.md` (~12–19 days total):

| Phase | Scope | Covers | Effort |
|---|---|---|---|
| **26** | Yellow exit + sound-activated switches | `SND-06`, `ENV-01`, `ENV-02` | 1–2 d |
| **27** | Noise-magnitude model + sprint (**keystone**) | `PLR-04`, `AI-01` | 4–6 d |
| **28** | Charge clap (variable-intensity pulse) | `PLR-05` | 2–3 d |
| **29** | Throwable noise decoy | `PLR-06` | 4–6 d |
| **30** | Zero-HUD immersion mode (**needs owner decision**) | `UI-01` | 1–2 d |

Phase 27 is the keystone: 28, 29 and the meaning of sprint all depend on
loudest-wins AI arbitration. Phase 26 is independent and the cheapest win.

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
| **Dark Echo-style touch controls** | `js/input.js`, `js/game.js` | Whole canvas is the surface: hold away from feet = walk toward finger; tap = sneak (crouched) step; hold on feet + release = stomp (pulse), only when standing |
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
| **ScreamerEnemy** | `js/entities.js`, `js/game.js`, `js/renderer.js` | Stationary trap; any ray triggers 48-ray burst + nearby enemy alert; killed on contact |
| **`spawn_enemy` trigger** | `js/game.js` | `targetId = "type,col,row"`; spawns chaser / stalker / screamer mid-level |
| **20 levels (Acts I + II)** | `js/levels.js` | L1–10 (The Awakening → The Gauntlet II) + L11–20 (Corridor II → The Deep) |
| SOUND_CONFIG | `js/audio.js` | All sounds centralized; easy to tune |
| **Ambient drone** | `js/audio.js`, `js/game.js` | 55Hz sine, gain 0.035, 1.5s fade-in/0.5s fade-out; starts on play, stops on death/win/title |
| **Positional audio** | `js/audio.js`, `js/game.js` | PannerNode HRTF; updateListener() per frame; alert/sentry/hazard sounds positioned |
| **Enemy footstep rays** | `js/entities.js`, `js/game.js`, `js/renderer.js` | 8-ray `'step-enemy'` burst per enemy step (520ms idle / 340ms hunt); muted red render |
| **BlindStalker breathing** | `js/entities.js`, `js/audio.js`, `js/game.js` | Positional 110Hz breath every 2–3s; audio cue only, no rays |
| **Debug overlay** | `js/debug.js`, `js/input.js`, `js/game.js`, `js/renderer.js` | Backtick toggle; FPS, rays, trails, glints, player state, all enemy states |
| Echo trail cap | `js/waves.js` | Hard cap at 500 entries (lowered to 250/150 at reduced quality tiers) |
| Mutable grid copy | `js/game.js` `loadLevel()` | Enables in-run grid mutation (collapsibles) |
| **Perf caching** | `js/renderer.js` | Vignette pre-rendered offscreen and blitted each frame |
| **Adaptive quality** | `js/game.js`, `js/renderer.js`, `js/waves.js` | Auto FPS-driven high/medium/low tiers + pause-menu override; gates shadowBlur, trail cap, enemy step rays |
| **Ray pool cap** | `js/waves.js` | Recycled Ray pool bounded at `RAY_POOL_CAP` (200) |
| **Save system** | `js/save.js` | Progress, act flags, best times, achievements — guarded localStorage |
| **Level select** | `js/ui.js`, `play/index.html` | 20-cell grid; lock state + best times; launch any unlocked level |
| **Achievements** | `js/achievements.js`, `js/game.js`, `js/ui.js` | 10 achievements; queued toast + pause-menu gallery |
| **Footsteps (audio)** | `js/audio.js`, `js/game.js` | `playFootstepSurface()` on each step (normal/water), reverb-tail |
| **Player = animated footsteps** | `js/game.js`, `js/renderer.js` | No dot — distance-based footprint trail while walking (recognizable feet, stamp-in animation, one in front of the other), both feet planted when standing; wall-aware; rays dimmed for contrast |
| **Android packaging** | `capacitor.config.ts`, `android/` (gitignored) | Capacitor 8 + Haptics + StatusBar; build steps in `docs/ANDROID_BUILD_GUIDE.md` |
| **Landing page + multi-page build** | `index.html`, `landing/`, `vite.config.js` | Marketing page at `/`, game at `/play/`; shared Vite build |
| **Player-centered camera** | `js/renderer.js`, `js/constants.js` | `CAMERA_ZOOM` zoom + follow; only a local portion visible (Dark Echo parity) |
| **Strict 4-color palette** | `js/renderer.js` | white=sound, blue=water, yellow=switch/key/door, red=danger (Dark Echo parity) |
| **How to Play tutorial** | `play/index.html`, `css/style.css`, `js/game.js` | Goal + keyboard/touch controls + color language + illustrated threat legend; from title/pause menus, auto-shown once on first visit |

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

| System | Phase | Status | Priority | Notes |
|---|---|---|---|---|
| Build pipeline (Vite) + Cloudflare deploy | Phase 15 | ✅ Done | — | Live and working |
| localStorage level persistence | Phase 15 | ✅ Done | — | Survives page refresh |
| Delete Wave/WaveManager shims | Phase 15 | ✅ Done | — | TD-002 resolved |
| Wavefront visual upgrade (arc-fill) | Phase 16 | ❌ Skipped | — | Original spoke rendering preferred |
| Positional audio (PannerNode) | Phase 17 | ✅ Done | — | HRTF spatial audio live |
| Enemy footstep ray bursts | Phase 17 | ✅ Done | — | 8-ray burst per step, muted red |
| Reverb (ConvolverNode) | Phase 18 | ✅ Done | — | Per-level impulse response; small/medium/large |
| Environmental ambient sounds | Phase 18 | ✅ Done | — | Drip/rumble/creak loops; scheduled randomly |
| Player velocity inertia | Phase 19 | ✅ Done | — | Lerp-based vx/vy; crouch reduces accel |
| Screen-shake on death/collapse | Phase 19 | ✅ Done | — | triggerShake(); crusher near-miss shake |
| Pulse-ready audio cue | Phase 19 | ✅ Done | — | 1800Hz click on cooldown expiry |
| Act II levels (11–20) | Phase 20 | ✅ Done | — | Levels 11–20; commits `37f8ef2` + `ec08a1c` |
| ScreamerEnemy | Phase 20 | ✅ Done | — | Stationary ray trap; 48-ray burst; alerts enemies within 300px |
| Android app (Capacitor) | Phase 21 | ✅ Done | — | Capacitor 8 + Haptics + StatusBar; debug APK built + installed on physical device |
| Website + landing page | Phase 22 | ✅ Done | — | Landing at `/`, game at `/play/`; multi-page Vite build; native app redirects to game |
| Performance hardening (60fps mobile) | Phase 23 | ✅ Done | — | Vignette/glow caching, adaptive quality tiers, pool cap; on-device profiling still pending |
| Level select screen | Phase 24 | ✅ Done | — | 20-cell grid, lock state + best times; `js/save.js` |
| Achievements (10 total) | Phase 24 | ✅ Done | — | `js/achievements.js`; toast + pause-menu gallery |
| Google Play Store submission | Phase 25 | ⬜ Pending | High | Final commercial goal |

---

## Post-roadmap — Player rendered as animated footsteps (2026-07-20)

The player is drawn **purely as footsteps — there is no dot/glow**. Final implementation after several rounds of feedback:

- **Footstep audio** already existed (`Audio.playFootstepSurface` fires on every step, normal vs water) — confirmed working, unchanged.
- **Recognizable feet**: `drawFoot` renders an actual foot — a rounded sole/ball, a separate heel, and three toe pads — pointing along the heading (`js/renderer.js`).
- **Natural gait (distance-based)**: while walking, discrete footprints are laid every `FOOTPRINT_STRIDE_PX` (22px) of travel, alternating sides, and **stay where they land** — progressing one in front of the other like a real walking trail. The freshest is brightest; each fades over `FOOTPRINT_FADE_MS` (1.5s), giving a clear step rhythm. There is **no gliding foot** — the trail itself is the walking marker. (`js/game.js` accumulates player displacement in `strideAccum`; `prevFoot`/`strideAccum` seeded after the player spawns in `loadLevel`.)
- **Footfall animation**: `footStamp()` eases each print's scale 1.32→1.0 and alpha in over `FOOT_POP_MS` (150ms) so prints press down rather than pop.
- **Standing still**: both feet are planted side by side at the player, oriented to `G.playerHeading` (`drawPlayerFeet`, only when `speed < PLAYER_IDLE_SPEED`).
- **Legibility**: a soft **dark backing disc** under the standing feet + globally **dimmed rays** (active 0.72→0.5, live tip 0.88→0.62, echo trails 0.34→0.24) keep the bright prints readable where the sound rays converge.
- **Wall-aware**: footprints never render on wall/collapsible cells — the trail clamps to the player's cell and live feet in a solid cell are suppressed (`footInWall`/`drawFootClear`).
- Constants: `FOOTPRINT_STRIDE_PX`, `FOOTPRINT_FADE_MS`, `FOOTPRINT_MAX`, `FOOTPRINT_STANCE_OFF`, `PLAYER_IDLE_SPEED`. Verified headless (no errors; walking lays an alternating one-in-front trail ending in two side-by-side feet when stopped).

## Phase 24 — Complete ✅

**Phase 24 summary** (save system + level select + achievements):
- `js/save.js` (new): centralizes the localStorage schema behind guarded helpers — `resonance_progress` (furthest 0-based index reached / unlock cursor), `resonance_act1_complete` / `resonance_act2_complete`, `resonance_best_times` (`{idx: ms}`), `resonance_achievements` (string[]). Also `formatTime(ms)` and `isLevelUnlocked(idx)`. All existing progress/continue logic in `game.js` was refactored onto it.
- `js/achievements.js` (new): 10 achievement definitions (id/glyph/name/desc) + a pure `evaluate(ctx)` mapping a `complete`/`death`/`win` event to qualifying ids. Unit-tested (12/12 cases).
- `js/game.js`: `G.runStats` (`usedPulse`/`patrolAlerted`/`screamerTriggered`/`stalkerHunted`) + `G.levelStartTime`, reset each `loadLevel`. `checkExit` records best time, evaluates + awards achievements, sets Act I/II flags, and persists progress (win sets `progress = TOTAL` so every level shows unlocked in level-select instead of clearing progress). `die()` awards `first_death`. `launchLevel(idx)` + a `play-level:<idx>` action back the level-select cells; `level-select` builds+shows the grid; pausing rebuilds the achievement gallery.
- `js/ui.js`: `buildLevelSelect()` (20-cell grid, lock state + best times, click → `play-level`), `buildAchievementGallery()` (earned/dim glyphs), `showAchievementToast()` (queued ~2.5s each).
- `play/index.html`: title "Level Select" button, `#screen-levelselect`, pause `#achievement-gallery`, `#achievement-toast`. `css/style.css`: grid/gallery/toast styles (responsive 4→3 columns).
- **Verified**: `achievements.evaluate` unit test 12/12; headless browser — level-select lock states from seeded progress (6 unlocked at progress=5, cell 7 locked), best-time formatting ("15.23s"), launching a level, pause gallery earned count (2/10), zero console/page errors.
- Achievement→toast on live level completion (reaching an exit) is wired through the same verified `evaluate` → `Save.unlockAchievement` → `showAchievementToast` path; not driven end-to-end headlessly because it needs in-game navigation to the hidden exit.

## Phase 23 — Complete ✅

**Phase 23 summary** (performance hardening + adaptive quality):
- `js/renderer.js`: vignette gradient pre-rendered once to an offscreen canvas (`buildVignette`) and blitted each frame; player glow pre-rendered to a sprite (`buildPlayerGlow`) — both remove per-frame `createRadialGradient` allocations. `setQualityTier(tier)` sets `_hq`; helper `sb(v)` returns the blur value at `high` and `0` at `medium`/`low`, applied to **every** hot-path `shadowBlur` (rays, glints, entities, exit, doors, keys, triggers, crushers) so blur compositing — the biggest mobile GPU cost — vanishes when quality drops.
- `js/game.js`: `G.qualityMode` (`auto`|`high`|`medium`|`low`, persisted under `resonance_quality`) + effective `G.qualityTier`. Auto mode drops a tier after FPS stays below `QUALITY_DOWNGRADE_FPS (45)` for `QUALITY_SUSTAIN_MS (3s)` (→`medium`, or →`low` under `QUALITY_LOW_FPS (30)`), **downgrade-only** so it never oscillates. `applyQualityTier()` wires tier → renderer, ray-system trail cap, and enemy step-ray budget; reapplied after each `loadLevel()` (fresh `RaySystem`).
- `js/waves.js`: `RaySystem.trailCap` is now configurable (`500`/`250`/`150` by tier); recycled Ray pool capped at `RAY_POOL_CAP (200)`.
- Pause screen gains a **Quality** button (`#quality-btn`, `data-action="cycle-quality"`) cycling Auto→High→Medium→Low (`ui.js` `setQualityLabel`).
- `js/debug.js`: overlay now shows quality tier/mode, ray-pool size, and effective trail cap.
- `js/constants.js`: `RAY_POOL_CAP`, `ECHO_TRAIL_CAP_MEDIUM/LOW`, `ENEMY_STEP_RAYS_LOW`, `QUALITY_DOWNGRADE_FPS`, `QUALITY_LOW_FPS`, `QUALITY_SUSTAIN_MS`.
- **Verified headless** (Chromium/Playwright): game boots and runs with no console/page errors; the Quality button cycles Auto→High→Medium→Low and persists to `localStorage`. On-device 60fps profiling (Galaxy A52-class) and a Lighthouse run remain open — they need real hardware / the deployed URL.

## Phase 22 — Complete ✅

**Phase 22 summary:**
- **Routing (as built):** landing page at `/`, game at `/play/`.
  - `index.html` (repo root) = landing page. Its `<head>` runs a Capacitor-only redirect (`window.Capacitor?.isNativePlatform?.()` → `location.replace('play/index.html')`) so the native Android shell opens straight into the game; web visitors stay on the landing.
  - `play/index.html` = game (moved off root); asset/script refs use `../` so Vite still bundles shared `/assets/*`.
  - `wrangler.jsonc`: `html_handling: "auto-trailing-slash"` (`/play` → `/play/index.html`) + `not_found_handling: "none"` (unknown paths 404, no silent fallback).
  - An earlier iteration kept the game at root / landing at `/landing/`; that made `/`, `/landing`, and `/play` all fall back to the game (indistinguishable), so it was restructured to this layout.
- `landing/style.css`: landing stylesheet (referenced by root `index.html`). Standalone from the game CSS but reuses the color grammar (`#000`, pale `rgba(155,195,235)`, bright `rgba(185,220,255)`). Sections: CSS-animated expanding-pulse hero, mechanic explainer with a CSS wave viz, three feature bullets (6 enemy types / 20 levels), two "Play Now" CTAs → `/play/`, "Google Play — coming soon" badge, footer. Fully self-contained: inline SVG favicon, CSS-only animations, `prefers-reduced-motion` fallback, zero external requests.
- `public/landing/og-cover.svg`: 1200×630 social card, copied verbatim by Vite to `dist/landing/og-cover.svg`; referenced by the OG/Twitter `image` meta on both pages.
- `vite.config.js`: multi-page build via `rollupOptions.input = { main: index.html (landing), game: play/index.html }` (ESM `__dirname` from `import.meta.url`). Shared assets emit to `dist/assets/`.
- **Deferred:** Umami/Plausible analytics and Sentry error tracking — both need external accounts/infra the project doesn't have yet; omitted rather than shipping broken external `<script>`/deps. `og:url`/`og:image` use a `resonance.example.com` placeholder flagged for replacement with the real domain before public launch.
- Build/route verified: `npm run build` → `dist/index.html` (landing) + `dist/play/index.html` (game) + `dist/landing/og-cover.svg`; `npm run preview` → `/` serves landing, `/play/` serves game, Play CTAs link to `/play/`, game assets resolve at `/assets/*`. Android bundle confirmed to contain both `index.html` (landing+redirect) and `play/index.html` (game).

## Phase 21 — Complete ✅

**Phase 21 summary:**
- `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/haptics @capacitor/status-bar typescript` — Capacitor 8 + haptics + status-bar (all at v8.0.2)
- `capacitor.config.ts` created: `appId: 'com.resonance.soundgame'`, `appName: 'Resonance'`, `webDir: 'dist'`, `bundledWebRuntime: false`, StatusBar dark/black plugin config, `androidScheme: 'https'`
- `npx cap add android` — generated `android/` project (gitignored); synced Haptics + StatusBar plugins
- `android/app/src/main/AndroidManifest.xml`: added `android:hardwareAccelerated="true"` + `android:largeHeap="true"` to `<application>`
- `android/app/src/main/java/com/resonance/soundgame/MainActivity.java`: extended with `onCreate()` override calling `getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false)` — required for Web Audio API to auto-play without user gesture on Android WebView
- `js/game.js`: imports `{ Haptics, ImpactStyle }` from `@capacitor/haptics` and `{ StatusBar }` from `@capacitor/status-bar`; `Haptics.impact({ style: ImpactStyle.Medium })` fires on wall collapse (`applyWallHits`) and on death (`die()`); `StatusBar.hide()` called in `init()` — all Capacitor calls have `.catch(() => {})` so they are silently no-ops in the browser
- Build verified: `npm run build` → `75.69 kB` bundle (75KB — includes Capacitor web runtime shims), 0 vulnerabilities; `npx cap sync android` → 2 plugins detected and synced
- **On-device verification (2026-07-03)**: Debug APK built locally on Windows via `cd android && .\gradlew.bat assembleDebug` (required pointing Gradle at Android Studio's bundled JDK 21 via `android/gradle.properties` → `org.gradle.java.home`), then installed via `adb install` / manual sideload. Confirmed: **app installs and launches successfully on a physical Android device.** Signed release APK, multi-device testing, and latency/FPS profiling remain open — tracked in Phase 21's Production Roadmap entry.

## Phase 21.1 — Complete ✅ (post-launch mobile fixes, on-device feedback)

**Phase 21.1 summary:** On-device testing of the Phase 21 APK surfaced two mobile-only issues; both fixed and verified on-device.

**1. Touch controls replaced (joystick + buttons → tap-zone canvas input):**
- Removed `#touch-controls` DOM entirely (`#joystick-zone`, `#joystick-knob`, `#crouch-btn`, `#pulse-btn`) from `index.html` and all associated CSS from `css/style.css`
- `js/input.js` rewritten so the canvas itself is the whole input surface:
  - **Hold** anywhere on canvas → player walks toward the touch point, direction computed as the normalized vector from canvas center (400,300) to the touch — this single mechanic covers left/right/up/down/diagonal without separate zones
  - **Quick tap** (release before `TAP_MAX_HOLD = 200ms`) → crouch-walks the player in that direction for a `CROUCH_TAP_DECAY = 350ms` window; repeated tapping chains into continuous crouch movement, matching physical Shift/C crouch behavior (45% speed, 50% rays, 45% range)
  - **Tap-and-hold on the player** (`PULSE_TOUCH_RADIUS = 42px` canvas-space around the live player position) → fires pulse continuously whenever cooldown allows
  - `game.js` calls `Input.setPlayerScreenPos(G.player.x, G.player.y)` every frame so the pulse hit-test always uses the player's current position
- **Bug fixed post-implementation**: a quick tap originally moved the player at normal speed for the brief ambiguous window before resolving to a tap — fixed by gating movement contribution in `getMove()` behind `elapsed >= TAP_MAX_HOLD`, so a touch contributes nothing until it's either released (→ crouch-walk) or held past the threshold (→ normal walk). A tap now produces crouched movement only, with no normal-speed sliver first.

**2. Canvas cutoff fixed (bottom/right clipped on-device):**
- Root cause: `#wrap` sizing used a fixed `max-width: 820px` breakpoint with `height: calc(100vw * 0.75)` — broke down on landscape phone viewports wider than 820px, where actual device height was far less than `width * 0.75`, clipping the bottom/right of the canvas
- Fixed with orientation-agnostic aspect-fit: `width: min(800px, 100vw, calc(100vh * 4/3))`, `height: min(600px, 100vh, calc(100vw * 3/4))` — always fits the native 4:3 canvas inside the viewport regardless of device size or orientation, no breakpoint needed
- Added `viewport-fit=cover` to the meta viewport tag and `touch-action: none` on the canvas to prevent OS scroll/zoom gestures from fighting the custom touch handlers

**Verified on-device**: user confirmed both fixes work correctly on a physical Android device.

## Phase 20 — Complete ✅

**Phase 20 summary:**
- `js/constants.js`: `SCREAMER_ALERT_RADIUS = 300` (px, enemy alert range), `SCREAMER_BURST_RAYS = 48` (ray count on trigger)
- `js/entities.js`: `ScreamerEnemy` class — stationary; `this.triggered` flag; `alertNearbyEnemies(enemies)` calls `hearSound/hearStep` on all entities within `SCREAMER_ALERT_RADIUS`; `killsPlayer()` proximity kill same as Hazard
- `js/audio.js`: `SOUND_CONFIG.screamer` — sawtooth 2400Hz + sine 3200Hz + square 1800Hz layered over noise burst (gain 0.4, 1.5s); `playScreamer()` export
- `js/game.js`: `G.screamers = []`; screamer spawn from `type:'screamer'` in level def; `processRayEntities()` — any non-step-enemy ray within `HAZARD_RADIUS + 4` triggers screamer: `playScreamer()`, 48-ray burst at screamer position, `alertNearbyEnemies()`; `checkDeath()` loop includes screamers; `spawn_enemy` trigger action implemented — parses `"type,col,row"`, pushes new chaser/stalker/screamer at cell center
- `js/renderer.js`: `drawScreamers()` — orange-red pulsing glow + 4 diagonal spike arms; solid red when triggered
- `js/levels.js`: 10 new Act II levels (11–20):
  - L11 "The Corridor II" — 3 step-aware patrols in parallel corridors
  - L12 "The Chamber II" — 2 screamers + chaser, large open room
  - L13 "The Factory" — 4 horizontal crushers + patrol, industrial gauntlet
  - L14 "The Scream" — 3 screamers + collapsible wall + step-aware patrol
  - L15 "The Archive" — 3 keys + 3 doors + chaser + patrol + hazard, dense maze
  - L16 "The Flood II" — water zone + 2 screamers in water + 2 hazards
  - L17 "The Awakening II" — BlindStalker only, pure stealth test
  - L18 "The Web" — spawn_enemy trigger + remove_wall trigger + patrol + hazard
  - L19 "The Vault" — 2 screamers + crusher + BlindStalker + sentry + key/door
  - L20 "The Deep" — all mechanics combined; largest map; hardest level

## Phase 19 — Complete ✅

**Phase 19 summary:**
- `js/constants.js`: `PLAYER_ACCEL = 12` (velocity lerp factor), `DANGER_NEAR_PX = 100` (proximity threshold)
- `js/entities.js`: Player gains `vx = 0`, `vy = 0` fields; `move()` rewrites position increments as velocity lerp — `this.vx += (targetVx - this.vx) * Math.min(1, accel * dt)` — with crouch reducing accel by 45% for more deliberate feel
- `js/audio.js`: `SOUND_CONFIG.pulseReady` — 1800Hz sine, 0.04s, gain 0.08; `playPulseReady()` export; `setDangerLevel(t)` export — modulates `_ambientGain` via `setTargetAtTime(0.035 + t * 0.05, now, 0.1)` as enemies approach
- `js/game.js`: `G.shake = { x, y, timer, intensity, duration }` state field; `triggerShake(intensity, duration)` helper; shake decays each frame with linear amplitude falloff; collapse → `triggerShake(4, 0.25)`, death → `triggerShake(6, 0.35)`, crusher near-miss (within 12px margin, debounced by shake timer) → `triggerShake(2, 0.15)`; pulse-ready tracking via `prevCooldown` local; danger level calculated as nearest enemy fraction of `DANGER_NEAR_PX`; level entry pulse fires 300ms after `loadLevel()` without consuming cooldown
- `js/renderer.js`: `ctx.save(); ctx.translate(shake.x, shake.y)` wraps all game drawing; `ctx.restore()` before vignette so overlay stays fixed

## Phase 18 — Complete ✅

**Phase 18 summary:**
- `js/audio.js`: `createImpulseResponse(ac, duration, decay)` — stereo noise buffer with exponential decay for ConvolverNode; `initReverb()` — creates `_convolver` + `_reverbSend` (gain 0.25) routed to destination, called from `startAmbient()`; `addReverb(gainNode)` — taps any gain node into the convolver when it exists; `setReverbSize(size)` export — accepts `'small'`/`'medium'`/`'large'`, updates `_pendingReverbSize` and hot-swaps convolver buffer if live; `startEnvironmental()` / `stopEnvironmental()` exports — schedule drip/rumble/creak via setTimeout chains with `_envActive` guard and `clearTimeout` cleanup
- `SOUND_CONFIG.environmental`: `drip` (bandpass 300Hz, 0.04s, random stereo pan), `rumble` (lowpass 60Hz, 1.2s), `creak` (bandpass 800Hz Q=3, 0.3s); each with min/max interval ranges
- Reverb routing: `osc()` gains 7th `reverb` param; `noiseNode()` checks `cfg.reverb`; `playPulse()`, `playCollapse()` updated to use reverb; enemy footstep sounds (`enemyFootstep`, `enemyFootstepHunting`) flagged with `reverb: true`
- `js/game.js`: `Audio.setReverbSize(def.reverb ?? 'medium')` in `loadLevel()`; `Audio.startEnvironmental()` added to `'start'`/`'continue'`/`'restart'`/`'restart-from-1'`/`'next-level'` cases; `Audio.stopEnvironmental()` added to `die()`, `checkExit()` win branch, and `'title'` case
- `js/levels.js`: `reverb` property added to all 10 levels — `'small'` (L1 Awakening, L6 Whisper), `'medium'` (L2 Patrol, L3 Chamber, L4 Hunt, L8 Collapse), `'large'` (L5 Gauntlet, L7 Flooded, L9 Corridor, L10 Gauntlet II)

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
- `.github/workflows/deploy.yml` created — CI build on PR to `main`; deploy via `wrangler deploy` on push to `main`; `wranglerVersion: '4'` pinned (action defaults to 3.x which does not support Workers Static Assets)
- `wrangler.jsonc` — `assets.directory` corrected to `"dist"` (was `"."`); Cloudflare Workers Static Assets confirmed as deploy target (not Pages)
- `js/waves.js` — Wave and WaveManager shim classes deleted (TD-002 resolved)
- `index.html` — `#continue-btn` added to title screen above "New Game" button; hidden by default via `style="display:none"`; "Begin" renamed to "New Game" for clarity
- `js/ui.js` — `showContinueButton(levelNum)` and `hideContinueButton()` exports added
- `js/game.js` — `SAVE_KEY = 'resonance_progress'`; `localStorage.setItem` on level complete; `localStorage.removeItem` on win and restart-from-1; `'continue'` action handler; `refreshContinueButton()` helper called on init and on title screen return

## Next Recommended Task

**Phase 25 (Google Play submission) is deferred by owner decision.** No roadmap phase is
currently active. When submission is resumed, its (unchecked) task list is in
`docs/PRODUCTION_ROADMAP.md` Phase 25 — the key prerequisites still outstanding are a
signed release AAB, on-device 60fps/latency profiling (Phase 23 acceptance), and store
assets + a privacy-policy page. Until then, work is owner-driven polish/enhancements.

---

## Deployment Setup ✅ Live

Deployment is confirmed working. Two parallel pipelines exist; both target the same Cloudflare Workers project (`resonance`).

### Cloudflare Git Integration (primary)

Cloudflare is connected directly to `ChirayuC01/dark-echo` and triggers its own build on every push.

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Non-production deploy command** | `npx wrangler versions upload` |
| **Root directory** | `/` |

### GitHub Actions (`.github/workflows/deploy.yml`)

Runs on push to `main`; also runs a build-only CI check on PRs to catch broken builds before merge.

- Build + deploy on push to `main` via `cloudflare/wrangler-action@v3` with `wranglerVersion: '4'`
- `wranglerVersion: '4'` is required — the action defaults to wrangler 3.x which does not support Workers Static Assets (`assets.directory` config)

### Dev workflow

Develop on `claude/beautiful-fermat-5102bb` → open PR to `main` → CI build runs → merge → both pipelines deploy automatically.

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

**Android APK:** see `docs/ANDROID_BUILD_GUIDE.md` for the full build + install
steps (including the JDK 21 fix and the everyday rebuild loop).
