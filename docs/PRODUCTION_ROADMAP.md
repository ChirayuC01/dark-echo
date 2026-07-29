# PRODUCTION ROADMAP — RESONANCE

> **This document picks up where IMPLEMENTATION_ROADMAP.md ends.**  
> Phases 0–14 are complete (v1.0.0). Phases 15–25 take the game from local prototype to commercial browser + Android product.  
> Phases 26–30 close the remaining mechanical gaps against the original *Dark Echo* design spec.  
> Phase 31 fixes the Android full-screen/pillarboxing defect — **highest user impact, recommended next**.  
> Read CURRENT_STATUS.md first in every new session to confirm which phase is active.

---

## Phase Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🔄 | In Progress |
| ⬜ | Pending |
| ⚠️ | Blocked |
| ❌ | Cancelled / Descoped |

---

## Context: Where We Are

RESONANCE v1.0.0 is a fully working 10-level browser game. All core mechanics are implemented and documented. The codebase is clean ES module JavaScript with no build step and no framework. The game runs only locally (`python3 -m http.server 8080`) — there is no public URL, no Android APK, and no deployment pipeline.

**The production gap is not gameplay — it is delivery.** Phases 15–25 address:
1. Build pipeline (Phase 15)
2. Visual identity matching Dark Echo (Phase 16)
3. Audio depth — positional audio + enemy sounds (Phase 17–18)
4. Game feel polish (Phase 19)
5. Content volume — 10 more levels (Phase 20)
6. Android packaging (Phase 21)
7. Website + landing page (Phase 22)
8. Performance hardening (Phase 23)
9. Save system + achievements (Phase 24)
10. Google Play submission (Phase 25)

**Phases 26–30 address a different gap: *mechanical parity* with the original Dark Echo** — see the audit below.

**Phase 31 is a platform/ergonomics fix, not parity** — the Android build pillarboxes
into a 4:3 box and wastes ~40 % of the screen (dead to touch), forcing players to reach
inward. It is independent of 26–30 and is the **recommended next phase**.

---

## Dark Echo Parity Audit (2026-07-27)

Audited the shipped code against the original Dark Echo Game Design Specification
(20 mechanics). Result: **12 fully present · 5 partial · 3 missing.**

Present and requiring no work: `PLR-01` footprint avatar · `PLR-02` sneak ·
`PLR-03` normal walk · `SND-01` specular reflection (`R = D − 2(D·N)N`, 3 bounces) ·
`SND-02` ray decay (energy 0.55/bounce + distance attenuation + time fade) ·
`SND-03/04/05` white/red/blue coding · `AI-02` patrol/idle · `AI-03` instant-kill
contact · `ENV-03` static lethal traps (Hazard/Crusher) · `AUD-01` HRTF spatial audio.

| ID | Mechanic | Status | Gap | Phase |
|---|---|---|---|---|
| PLR-04 | Sprint Run | ❌ Missing | Only two noise tiers exist (crouch + walk). No loud/fast top rung to the risk-reward ladder. | **27** |
| PLR-06 | Sound Noise Throw | ❌ Missing | No throwable decoy at all. Removes the "lure the beast away" puzzle vocabulary. | **29** |
| UI-01 | Zero-HUD Interface | ❌ Missing | `#hud` persistently shows pulse bar, level label, crouch indicator. Original is chrome-free. | **30** |
| PLR-05 | Charge Clap | ⚠️ Partial | 360° burst exists (`RAY_COUNT_PULSE 64`) but is fixed-intensity/binary — no hold-to-charge or variable radius. | **28** |
| AI-01 | Sound Tracking | ⚠️ Partial | Enemies seek `ray.burstX/burstY` but there is **no loudness arbitration** — last-heard-wins, not loudest-wins. | **27** |
| SND-06 | Colour: Yellow | ⚠️ Partial | Doors/keys/switches are yellow, but the **exit renders white** (`drawExit` → `rgba(225,238,255)`). | **26** |
| ENV-01 | Yellow Exit Portal | ⚠️ Partial | Same root cause as SND-06 — exit works, but reads as "your sound" not "objective". | **26** |
| ENV-02 | Switches / Doors | ⚠️ Partial | Triggers fire on **physical presence only** (`dist < 10`). Spec requires "presence **or sound waves**". | **26** |

**Key dependency:** `PLR-04`, `PLR-06` and `PLR-05` are all downstream of `AI-01`.
A decoy is meaningless unless AI arbitrates by *loudness* — otherwise a thrown noise
and your own footstep compete on recency and the lure does nothing. Phase 27 therefore
builds the shared noise-magnitude model first, and Phases 28–29 consume it.

---

## Phase 15 — Build Pipeline + Deployment Foundation
**Status:** ✅ Complete  
**Goal:** Add Vite build tool, deploy to Cloudflare Pages, add localStorage progress persistence.  
**Depends on:** Nothing (start here)  
**Estimated effort:** 3–5 days  
**Risk:** Low

### Why this first
Everything downstream (Android packaging, production performance, public sharing, real feedback) requires a build pipeline and a public URL. This phase has no code-change risk — Vite works natively with vanilla ES modules.

### Tasks
- [ ] `npm init -y` if not already present; `npm install --save-dev vite`
- [ ] Create `vite.config.js`:
  ```javascript
  import { defineConfig } from 'vite';
  export default defineConfig({
    root: '.',
    build: { outDir: 'dist', target: 'es2020' },
    server: { port: 8080 }
  });
  ```
- [ ] Verify `npm run dev` replaces `python3 -m http.server` (same behavior)
- [ ] Verify `npm run build` produces a working `dist/` folder
- [ ] Add `"dev": "vite"` and `"build": "vite build"` to `package.json` scripts
- [ ] Delete `Wave` and `WaveManager` shim classes from `js/waves.js` (TD-002 — unused since prototype, no imports)
- [ ] Add localStorage level persistence to `js/game.js`:
  - On level complete: `localStorage.setItem('resonance_progress', G.levelIndex + 1)`
  - On title screen: if `resonance_progress` exists, show "Continue from Level N" button alongside "Play"
  - On `'restart-from-1'` action: `localStorage.removeItem('resonance_progress')`
- [ ] Add `#continue-btn` to `index.html` title screen; wire in `ui.js` and `game.js`
- [ ] Set up Cloudflare Pages: connect GitHub repo → build command `npm run build` → output dir `dist`
- [ ] Set up GitHub Actions `.github/workflows/deploy.yml`: trigger on push to `main`, run `npm run build`
- [ ] Add `package.json` to `.gitignore` exemptions (it is not currently in the repo)
- [ ] Commit + push

### Files Modified
- `package.json` (new)
- `vite.config.js` (new)
- `.github/workflows/deploy.yml` (new)
- `js/waves.js` — delete Wave/WaveManager shims
- `js/game.js` — localStorage read/write
- `js/ui.js` — show/hide continue button
- `index.html` — add `#continue-btn`

### Acceptance Criteria
- [ ] `npm run dev` starts game at `localhost:8080` with HMR
- [ ] `npm run build` completes with no errors; `dist/index.html` is playable
- [ ] No console errors in built version
- [ ] Level progress survives page refresh (localStorage key `resonance_progress`)
- [ ] "Continue from Level N" button appears on title screen when progress exists
- [ ] Game deploys automatically to Cloudflare Pages URL on push to main
- [ ] `waves.js` has no Wave or WaveManager class references
- [ ] No references to removed Wave/WaveManager in any other JS file

---

## Phase 16 — Wavefront Visual Upgrade
**Status:** ❌ Cancelled / Descoped  
**Goal:** Transform the ray visualization from "starburst spokes" to "expanding sonar ring."  
**Depends on:** Phase 15 complete  
**Estimated effort:** 5–8 days  
**Risk:** Medium (renderer changes affect all visual output)

### Decision
Implemented and reverted. The arc-fill wavefront approach (`drawWavefront()` grouping rays by `burstId`, connecting adjacent tips with `ctx.arc()`) did not look good in practice — the original spoke/starburst rendering was preferred. Phase 16 is permanently skipped. Do not re-attempt this approach in future sessions.

### Context (original)
RESONANCE currently renders active rays as discrete line segments from origin to tip — visually a starburst/spoke pattern. Dark Echo renders sound as a coherent wavefront ring that expands outward. The underlying DDA ray math is equivalent; only the rendering changes.

### Tasks
- [ ] Add `burstId` field to `RaySystem`: module-level `let _nextBurstId = 0`. In `burst()`, increment before emitting; assign `ray.burstId = _nextBurstId` to every ray in the same call.
- [ ] In `renderer.js`, add `drawWavefront(activeRays, now)` function:
  - Group active rays by `burstId`
  - For each group: sort rays by angle `Math.atan2(ray.tipY - ray.burstY, ray.tipX - ray.burstX)`
  - Draw a path connecting adjacent ray tips (sorted by angle) with `arc()` strokes at approximately the median tip radius from burst origin
  - Stroke with `rgba(185,220,255, 0.35)` at `lineWidth: 1.0`
  - Only draw arcs where adjacent ray angles differ by less than `π/16` (avoids arc wrapping around corners incorrectly)
- [ ] Add shockwave origin ring: on the first 200ms of a burst, draw a rapidly-expanding faint circle at `burstX/burstY` that scales from 0 to `~30px` and fades. Uses `ray.startTime` (new field, set on `ray.init()`).
- [ ] Add `ctx.filter = 'blur(1.5px)'` scoped to just the wavefront arc draw pass. Detect support and disable if `fps < 45`.
- [ ] Step bursts (22 rays) produce a partial arc; pulse bursts (64 rays) produce a near-complete ring. Both are correct behavior.
- [ ] Echo trails remain as individual line segments — they already look good as geometric history.
- [ ] Test that the wavefront does not visually persist (it is only drawn while rays are active, not in echoTrails).
- [ ] Commit + push

### Files Modified
- `js/waves.js` — `burstId` field, `startTime` field on Ray
- `js/renderer.js` — `drawWavefront()`, `drawActiveRays()` updated, origin ring

### Acceptance Criteria
- [ ] Pulse burst visually reads as an expanding ring at the active wavefront, not a wheel of spokes
- [ ] Step bursts appear as shorter partial arcs
- [ ] The shockwave origin ring is visible on pulse for ~200ms then fades
- [ ] Echo trails (sealed segments) are unchanged in appearance
- [ ] No visual artifacts where arcs wrap incorrectly through walls
- [ ] FPS does not drop below 45 during full 64-ray pulse burst (disable blur if it does)
- [ ] Players with no prior context describe the pulse as "sonar-like" or "wave-like"

---

## Phase 17 — Positional Audio + Enemy Footstep Visualization
**Status:** ✅ Complete  
**Goal:** Add 3D panned audio and enemy-generated ray bursts. This is the most important missing mechanic for Dark Echo parity.  
**Depends on:** Phase 15 complete  
**Estimated effort:** 8–12 days  
**Risk:** Medium

### Context
Dark Echo's core tension comes from enemies that generate their own sounds. Their footsteps propagate through the visualization system exactly like the player's — you see ghost echoes from unknown sources and must determine if they are yours or something else's. RESONANCE has completely silent enemies unless your own rays find them. This is the most significant gap from the original Dark Echo experience.

### Tasks

**Positional Audio (PannerNode):**
- [ ] In `audio.js`: add `createPositionalSource(x, y)` helper — creates a `PannerNode` at world coords `(x, y)`, connects to `ac.destination`. Returns `{ source, gain }` pair.
- [ ] Update `ac.listener`: add `updateListener(px, py)` export — sets `listener.positionX.value = px`, `listener.positionY.value = py` every frame. Call from `game.js` `update()`.
- [ ] Route `playAlert(x, y)`, `playSentryAlert(x, y)`, `playHazardPulse(x, y)` through `createPositionalSource`. Add `x, y` params to each function signature.
- [ ] Update all callers in `game.js` to pass enemy coordinates.
- [ ] Use `panningModel: 'HRTF'`, `distanceModel: 'inverse'`, `refDistance: 120`, `maxDistance: 600`, `rolloffFactor: 1.2`.

**Enemy Footstep Rays:**
- [ ] Add `'step-enemy'` ray type to the ray system. Rays of this type render in muted red `rgba(180,60,60,α)` rather than the player's pale blue.
- [ ] In `entities.js`, add `stepTimer` to `PatrolEnemy`, `ChaserEnemy`, `BlindStalker`. Default interval: 520ms idle, 340ms hunting.
- [ ] Add `shouldEmitStep(dt)` method on each enemy — increments timer, returns `true` when interval elapses, resets timer.
- [ ] In `game.js` `update()`: after enemy AI update, for each enemy that `shouldEmitStep()`: call `G.raySystem.burst(en.x, en.y, 'step-enemy', G.castFn, 8, 80)` (8 rays, 80px max — subtle, not overwhelming). Also call `Audio.playEnemyFootstep(en.x, en.y)`.
- [ ] Add `playEnemyFootstep(x, y)` to `audio.js` — same noise burst as player footstep but lower gain (0.07), higher cutoff (240Hz), routed through `createPositionalSource`.
- [ ] Add `playEnemyFootstepHunting(x, y)` — louder (gain 0.13), faster, for hunting state (creates "closing in" feel).
- [ ] `RaySystem.burst()` gains optional `countOverride` and `maxDistOverride` params (already has them from Phase 1 — reuse).
- [ ] Enemy step rays: do NOT trigger enemy hearing (they already know where they are). Add guard in `processRayEntities()`: skip `hearSound()` call for `ray.type === 'step-enemy'`.
- [ ] Enemy step rays: DO reveal walls via glints (same as player rays). This is intentional — enemy movement reveals geometry near the enemy, giving the player information about the enemy's surroundings.
- [ ] BlindStalker: add a "breathing" audio cue — `playBlindStalkerBreathing(x, y)` — very quiet (gain 0.03) low-frequency pulse (110Hz triangle, 0.3s), fires every 2–3 seconds regardless of state. No rays, positional audio only. Creates ambient dread when a stalker is nearby.

### Files Modified
- `js/audio.js` — `createPositionalSource`, `updateListener`, `playEnemyFootstep`, `playEnemyFootstepHunting`, `playBlindStalkerBreathing`, updated alert/hazard signatures
- `js/entities.js` — `stepTimer`, `shouldEmitStep()` on PatrolEnemy, ChaserEnemy, BlindStalker
- `js/game.js` — `updateListener()` call, enemy step burst dispatch, updated alert callers
- `js/renderer.js` — `'step-enemy'` ray type color branch in `drawActiveRays` and `drawEchoTrails`
- `js/constants.js` — `ENEMY_STEP_INTERVAL_IDLE`, `ENEMY_STEP_INTERVAL_HUNT`, `ENEMY_STEP_RAYS`, `ENEMY_STEP_MAX`

### Acceptance Criteria
- [ ] Enemy alert sounds pan left/right based on enemy position relative to player
- [ ] Player can close eyes and use headphones to estimate which direction an enemy alerted from
- [ ] Enemy step ray bursts are visible as muted-red echoes, distinct from player's blue echoes
- [ ] Enemy step rays reveal wall geometry (glints) near the enemy
- [ ] Enemy step rays do NOT trigger the enemy's own hearing response
- [ ] Hunting enemies emit faster, louder footsteps than idle ones
- [ ] BlindStalker emits breathing sounds audible within ~200px
- [ ] Enemy footstep echoes are subtle enough not to overwhelm the screen when 3+ enemies are active

---

## Phase 18 — Reverb + Environmental Ambient Sounds
**Status:** ✅ Complete  
**Goal:** Add room acoustics via ConvolverNode and procedural environmental sounds that build atmosphere without providing gameplay information.  
**Depends on:** Phase 17 complete  
**Estimated effort:** 5–7 days  
**Risk:** Low

### Tasks

**Reverb:**
- [ ] In `audio.js`, add `createImpulseResponse(duration, decay)` — generates a stereo noise buffer with exponential amplitude decay: `sample[i] = rand(-1,1) * Math.exp(-i / (sampleRate * decay))`. Duration 2.5s, decay 0.4s for "medium room."
- [ ] Create a module-level `_convolver` node and `_reverbSend` gain node (gain 0.15). Connect: `_reverbSend → _convolver → ac.destination`.
- [ ] Add `addReverb(sourceGain)` helper — taps `sourceGain` output into `_reverbSend`. Call from all sound-creating functions.
- [ ] Add `reverb: bool` flag to `SOUND_CONFIG` per-sound entries. Only sounds with `reverb: true` get the wet send. Enable for: `footstep`, `footstepWater`, `pulse`, `collapse`, `enemyFootstep`.
- [ ] Disable reverb on: `alert` (too washy), `levelComplete` (needs to sound clean), `keyPickup`.
- [ ] Initialize convolver on first `startAmbient()` call (not before — AudioContext may not exist).
- [ ] Per-level reverb size (optional): add `reverb: 'small'|'medium'|'large'` to level definition. `loadLevel()` calls `Audio.setReverbSize(def.reverb ?? 'medium')`. `'large'` uses decay 0.8s (big chamber feel), `'small'` uses decay 0.18s (tight corridor).

**Environmental Sounds:**
- [ ] Add `startEnvironmental(levelDef)` and `stopEnvironmental()` to `audio.js`.
- [ ] `startEnvironmental()` schedules recurring procedural sounds via `setTimeout` chains:
  - **Drip** (all levels): filtered noise burst (300Hz lowpass, 40ms, gain 0.06). Random interval 4–12 seconds. Random pan position.
  - **Distant rumble** (levels 5+): sub-bass filtered noise (60Hz, 1.2s, gain 0.02). Interval 18–35 seconds.
  - **Structural creak** (levels 3+): bandpass noise (800Hz, Q 3, 0.3s, gain 0.04). Interval 12–28 seconds.
- [ ] All environmental sounds use Web Audio API scheduled timing (`AudioContext.currentTime + offset`) not `setTimeout` for accurate timing.
- [ ] Environmental sounds are NOT visualized as rays. They are heard but not seen — ambient dread only.
- [ ] `stopEnvironmental()` cancels pending scheduled nodes. Call from `die()` and win check, alongside `stopAmbient()`.
- [ ] Wire `startEnvironmental()` in `handleAction()` alongside `startAmbient()`.
- [ ] Add `SOUND_CONFIG.environmental` block with all tuning params.

### Files Modified
- `js/audio.js` — reverb chain, environmental sound system, all updated
- `js/game.js` — `startEnvironmental`/`stopEnvironmental` wiring, `setReverbSize` call in `loadLevel()`
- `js/levels.js` — add optional `reverb` field to level definitions
- `js/constants.js` — environmental timing constants

### Acceptance Criteria
- [ ] Putting on headphones in Level 1 creates an immediate sense of enclosed, echoey space
- [ ] Footsteps have a subtle reverb tail (not washy or distracting)
- [ ] Dripping sounds occur at random intervals without implying gameplay threat
- [ ] Environmental sounds stop immediately on death and win (no orphaned sounds)
- [ ] Large levels (Level 5, Level 10) feel acoustically bigger than small levels (Level 1)
- [ ] No performance impact (all scheduled via AudioContext time, not setInterval)

---

## Phase 19 — Movement Feel + Micro-Polish
**Status:** ✅ Complete  
**Goal:** Add player velocity inertia, screen-shake, pulse-ready audio cue, and danger proximity feedback.  
**Depends on:** Phase 15 complete (can run in parallel with 17–18)  
**Estimated effort:** 3–4 days  
**Risk:** Low

### Tasks
- [ ] **Player velocity inertia**: In `entities.js` `Player`, add `vx = 0`, `vy = 0`. In `move()`, compute target velocity from input direction, lerp: `this.vx += (targetVx - this.vx) * Math.min(1, PLAYER_ACCEL * dt)` where `PLAYER_ACCEL = 12` (unitless lerp factor, not px/s²). Apply `vx/vy` to position. Add `PLAYER_ACCEL` to `constants.js`.
- [ ] **Screen-shake**: Add `G.shake = { x: 0, y: 0, timer: 0, intensity: 0 }` to game state. Add `triggerShake(intensity, duration)` in `game.js`. Each frame: decay shake timer; compute offset `x = rand(-1,1) * intensity * (timer / duration)`, `y = same`. In `renderer.js`, before any drawing: `ctx.save(); ctx.translate(shake.x, shake.y)`. After all drawing: `ctx.restore()`. Trigger: `triggerShake(4, 0.25)` on collapse; `triggerShake(6, 0.35)` on death; `triggerShake(2, 0.15)` on crusher impact.
- [ ] **Pulse-ready cue**: In `game.js`, track `G.pulsePrevCooldown`. When `G.pulseCooldown` transitions from `> 0` to `<= 0`, call `Audio.playPulseReady()`.
- [ ] Add `playPulseReady()` to `audio.js` and `SOUND_CONFIG.pulseReady`: a brief high-pitched click (1800Hz sine, 0.04s, gain 0.08). Subtle — the player feels it, not hears it.
- [ ] **Danger proximity audio**: In `game.js` `update()`, find the nearest enemy distance. If `< DANGER_NEAR_PX (100)`, call `Audio.setDangerLevel(1 - dist/100)` each frame. In `audio.js`: `setDangerLevel(t)` modulates ambient gain: `_ambientGain.gain.setTargetAtTime(0.035 + t * 0.05, now, 0.1)` — subtly raises drone volume as enemy approaches.
- [ ] **Level entry pulse**: On `loadLevel()`, after 300ms delay, fire one free pulse burst from player start position. Gives player one "free look" at starting geometry.
- [ ] Add `PLAYER_ACCEL`, `DANGER_NEAR_PX` to `constants.js`.
- [ ] Commit + push

### Files Modified
- `js/constants.js` — `PLAYER_ACCEL`, `DANGER_NEAR_PX`
- `js/entities.js` — `Player` velocity fields and move() lerp
- `js/game.js` — shake state, triggerShake(), pulse-ready tracking, danger level, level entry pulse
- `js/renderer.js` — shake translate wrapper
- `js/audio.js` — `playPulseReady()`, `setDangerLevel(t)`, `SOUND_CONFIG.pulseReady`

### Acceptance Criteria
- [ ] Player movement has a subtle feeling of weight — stopping is not instantaneous
- [ ] Crouch mode inertia is lower (player feels more cautious)
- [ ] Screen shakes briefly on wall collapse, death, and crusher kill
- [ ] A soft click plays when pulse cooldown completes
- [ ] Ambient drone audibly intensifies when an enemy is within 100px
- [ ] Level entry pulse fires automatically after 300ms; no HUD confusion (cooldown starts after)
- [ ] Inertia does not break Level 9 crusher timing (test explicitly)

---

## Phase 20 — Level Expansion (Act II)
**Status:** ✅ Complete  
**Goal:** Build 10 additional levels (Levels 11–20) forming Act II with new environmental themes and two new enemy behaviors.  
**Depends on:** Phases 16–18 complete  
**Estimated effort:** 10–15 days  
**Risk:** Medium

### Context
Dark Echo has ~50 levels across 5 chapters. RESONANCE at 10 levels is a strong demo but a thin game. Act II introduces "The Facility" — an industrial setting implied by level geometry (long corridors, large open chambers, maintenance tunnels).

### New Enemy Behaviors
- [ ] **ScreamerEnemy**: stationary, does not move. When a player ray hits it, it emits a loud 48-ray burst from its position AND plays a piercing audio cue. This alerts all other enemies within 300px. Effectively a sound trap — the player must reach it without pulsing or fire a ray near it. `type: 'screamer'` in level def. Kill condition: player proximity (same as Hazard). Does not have its own step rays.
- [ ] **`spawn_enemy` trigger action**: already stubbed in `game.js` `fireTrigger()`. Implement: parse `targetId` as `"type,col,row"`. Spawn the named enemy at that cell. Used in Act II to introduce enemies mid-level.

### Act II Level Plan

| # | Name | Theme | New Element |
|---|---|---|---|
| 11 | The Corridor II | Long linear passage | Enemy step echoes (Phase 17 first showcase) |
| 12 | The Chamber | Large open room with pillar obstacles | Positional audio test level |
| 13 | The Factory | Industrial rhythm — crushers + environmental sounds | Crusher gauntlet with acoustic tells |
| 14 | The Scream | Screamer introduction | ScreamerEnemy, pulse-free challenge |
| 15 | The Archive | Dense maze, many keys | Multiple keys, multiple doors |
| 16 | The Flood II | Large water zone + Screamers | ScreamerEnemy + water = no pulse |
| 17 | The Awakening II | Blind room — no hazards, only a BlindStalker | Pure stealth test |
| 18 | The Web | Trigger network — chain reactions | Multi-trigger chain (trigger → spawn_enemy → open_door) |
| 19 | The Vault | All Act II mechanics combined | ScreamerEnemy + BlindStalker + crushers |
| 20 | The Deep | Final level — Act II climax | Largest map, all mechanics, hardest execution |

### Tasks
- [ ] Add `ScreamerEnemy` class to `entities.js`
- [ ] Add `playScreamer()` to `audio.js` (piercing high-frequency pulse, 1.5s, gain 0.4)
- [ ] Implement `spawn_enemy` action in `game.js` `fireTrigger()`
- [ ] Design and add all 10 level grids to `levels.js` with appropriate enemy defs
- [ ] Write level hints for all 10 new levels
- [ ] Add `reverb` field to each new level def
- [ ] Update `G.totalLevels` (auto-updates from `LEVELS.length`, no change needed)
- [ ] Add `SCREAMER_ALERT_RADIUS`, `SCREAMER_BURST_RAYS` to `constants.js`
- [ ] Playtest all 10 new levels; confirm completability
- [ ] Update `CURRENT_STATUS.md` and `CHANGELOG.md`
- [ ] Commit + push

### Files Modified
- `js/constants.js` — Screamer constants
- `js/entities.js` — `ScreamerEnemy` class
- `js/audio.js` — `playScreamer()`
- `js/game.js` — screamer handling in update + processRayEntities; `spawn_enemy` in fireTrigger; drawScreamers call
- `js/renderer.js` — `drawScreamers()` — distinct from Hazard; pulsing red-orange
- `js/levels.js` — 10 new level definitions

### Acceptance Criteria
- [ ] All 20 levels completable without dying
- [ ] ScreamerEnemy: triggered by ray contact → emits burst → nearby enemies alert
- [ ] ScreamerEnemy: cannot be avoided by crouching (it reacts to any ray type)
- [ ] `spawn_enemy` trigger spawns an enemy mid-level on player proximity
- [ ] Act II levels feel thematically distinct from Act I (larger spaces, more complex enemy interactions)
- [ ] Level 20 is the hardest level in the game

---

## Phase 21 — Android App (Capacitor)
**Status:** ✅ Complete  
**Goal:** Package the game as a native Android app via Capacitor for Google Play Store submission.  
**Depends on:** Phase 15 complete  
**Estimated effort:** 5–8 days  
**Risk:** Medium (device-specific issues are unpredictable)

### Tasks
- [x] `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [x] `capacitor.config.ts` created directly (init skipped — config authored by hand): `webDir: 'dist'`, `bundledWebRuntime: false`
- [x] `npx cap add android`
- [x] `npm run build && npx cap sync` — builds and syncs web assets to android/
- [x] In `android/app/src/main/AndroidManifest.xml`: set `android:hardwareAccelerated="true"` (performance), add `android:largeHeap="true"` (memory safety)
- [x] In `MainActivity.java`: add `getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false)` — required for Web Audio to work on load
- [x] Add `@capacitor/haptics`: `npm install @capacitor/haptics`. Trigger `Haptics.impact({ style: ImpactStyle.Medium })` on death and collapse in `game.js`.
- [x] Add `@capacitor/status-bar`: hide status bar on app launch.
- [ ] Test audio latency: if Web Audio latency > 100ms, investigate `AudioContext.baseLatency` and add latency compensation to visual timing.
- [ ] Create app icon: 512×512 PNG, black background, white/blue RESONANCE icon. Generate all required sizes via `npx @capacitor/assets generate`.
- [ ] Create splash screen (optional): same style as title screen.
- [ ] Build release APK: `cd android && ./gradlew assembleRelease`
- [ ] Sign APK with a generated release keystore. Store keystore securely (never commit).
- [x] Sideload **debug** APK to a physical device via `./gradlew assembleDebug` + manual install. Confirmed installs and runs on-device. *(Release/signed APK still pending — needed for Phase 25 Play Store submission.)*
- [ ] Test on at least two device types: high-end (Pixel 7) and mid-range (Galaxy A52 or equivalent). *(Verified on one physical device so far.)*
- [x] Commit + push (`android/` directory NOT in git — already in `.gitignore`. Only `capacitor.config.ts` and `package.json` additions committed.)

### Files Modified
- `package.json` — Capacitor dependencies
- `capacitor.config.ts` (new)
- `.gitignore` — `android/` and `ios/` already present
- `js/game.js` — Haptics + StatusBar imports and trigger calls
- `android/` directory (gitignored — local only; regenerated per-machine via `npx cap add android` + `npx cap sync`)

### Local Build Notes (Windows)
Building the debug APK on Windows required two environment fixes not in the original task list:
- **JDK version**: Capacitor 8 / AGP 8.13 requires Java 21 (not 8 or 17). Fixed by pointing Gradle at Android Studio's bundled JDK via `android/gradle.properties`: `org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr`.
- **Build command**: `cd android && .\gradlew.bat assembleDebug` (PowerShell requires the `.\` prefix). Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Install via `adb install app-debug.apk` or by copying the APK to the device and opening it directly (enable "install from unknown sources").

### Acceptance Criteria
- [x] APK installs on a physical Android device — confirmed
- [x] All 20 levels are playable with touch controls (roadmap text says "10 levels" — outdated; game has 20 as of Phase 20)
- [ ] Audio plays without noticeable latency (< 80ms perceptible threshold) — not yet measured
- [ ] App runs at 60fps on a mid-range 2021 Android (Samsung Galaxy A52 or equivalent) — not yet profiled (see Phase 23)
- [ ] Haptics fire on death and collapse (if device supports it) — implemented, not yet confirmed felt on-device
- [ ] Status bar hidden during gameplay — implemented, not yet visually confirmed on-device
- [ ] App does not crash on background/foreground cycle (AudioContext suspend/resume)

---

## Phase 21.1 — Mobile Touch Controls Redesign + Canvas Cutoff Fix
**Status:** ✅ Complete  
**Goal:** Fix two mobile-only issues surfaced by on-device testing of the Phase 21 APK: the joystick/button touch scheme didn't match the desired feel, and the canvas was clipped on-device.  
**Depends on:** Phase 21 complete (on-device testing)  
**Risk:** Low — this is a mobile-input-layer change, no gameplay logic touched

Not part of the original Phase 15–25 sequence — an out-of-order fix driven directly by on-device feedback after shipping Phase 21.

### Tasks
- [x] Remove `#touch-controls` DOM (joystick, crouch button, pulse button) from `index.html` and all associated CSS from `css/style.css`
- [x] Rewrite `js/input.js`: canvas becomes the full input surface — hold anywhere to walk toward that point (direction = vector from canvas center to touch), quick tap to crouch-walk in that direction, tap-and-hold on the player to fire pulse continuously
- [x] `game.js`: call `Input.setPlayerScreenPos(G.player.x, G.player.y)` every frame so the pulse hit-test uses the live player position
- [x] Fix bug where a quick tap briefly moved the player at normal speed before crouch-walk kicked in — gate movement contribution behind the tap/hold threshold
- [x] Fix `#wrap`/canvas sizing: replace the fixed `820px` breakpoint with an orientation-agnostic `min(800px, 100vw, 100vh*4/3)` aspect-fit that works in any orientation/device size
- [x] Add `viewport-fit=cover` to the meta viewport tag; add `touch-action: none` to the canvas
- [x] User rebuilt debug APK and confirmed both fixes on a physical Android device

### Files Modified
- `index.html` — `#touch-controls` DOM removed; `viewport-fit=cover` added
- `css/style.css` — joystick/button CSS removed; `#wrap`/canvas sizing rewritten
- `js/input.js` — rewritten touch handling (tap-zone gestures replace joystick+buttons)
- `js/game.js` — `Input.setPlayerScreenPos()` call added to `update()`

### Acceptance Criteria
- [x] No visible touch control buttons on mobile — canvas is the entire input surface
- [x] Hold anywhere walks the player toward that point; direction covers all 8 compass directions correctly
- [x] Quick tap produces crouched movement only, no normal-speed movement beforehand
- [x] Tap-and-hold on the player fires pulse repeatedly while cooldown allows
- [x] Full level visible with no cutoff in any device orientation

---

## Phase 22 — Website + Landing Page
**Status:** ✅ Complete  
**Goal:** Build a professional landing page that presents RESONANCE as a commercial product.  
**Depends on:** Phase 15 complete (public URL must exist)  
**Estimated effort:** 5–8 days  
**Risk:** Low

### Routing (as built)
Per the original plan and confirmed with the user: **landing page at `/`, game at `/play/`.**

An earlier iteration briefly kept the game at root (landing at `/landing/`) to avoid touching the Android app, but that made `/`, `/landing` (no slash), and `/play` all fall back to the game — the URLs were indistinguishable. Final structure:
- `index.html` (repo root) = **landing page**, served at `/`. Its `<head>` runs a Capacitor-only redirect: `if (window.Capacitor?.isNativePlatform?.()) location.replace('play/index.html')`. The native Android shell therefore opens straight into the game; web visitors never match the check and stay on the landing.
- `play/index.html` = **game**, served at `/play/`. Asset/script refs use `../` so Vite still bundles shared, content-hashed files into `dist/assets/`.
- `wrangler.jsonc`: `html_handling: "auto-trailing-slash"` (so `/play` → `/play/index.html`) and `not_found_handling: "none"` (unknown paths 404 instead of silently serving another page).
- The Android app (Phase 21) still loads `dist/index.html`; the redirect keeps it opening the game, so no Capacitor config change was needed. The APK must be rebuilt to pick up the new bundle.

### Tasks
- [x] Landing page authored as the repo-root `index.html`; game moved to `play/index.html`.
- [x] Serve landing at `/` and game at `/play/` — achieved with pure static-asset paths (no Cloudflare Worker); `wrangler.jsonc` `html_handling`/`not_found_handling` set for deterministic behavior. Native app redirects root→`play/` so it still opens the game.
- [x] Landing page sections (in order):
  1. **Hero**: title "RESONANCE", tagline "Sound is your only vision.", black background, pale-blue title, CSS-animated expanding pulse rings.
  2. **Mechanic preview**: CSS-only animated pulse/wave viz + explainer copy (a screen-recorded GIF/video was not available; a pure-CSS visualization stands in and keeps the page fully self-contained).
  3. **Feature bullets**: "No graphics. Only echoes." / "Six things hunt you by sound." / "20 levels of escalating dark." (updated counts — 6 enemy types, 20 levels, per current game state).
  4. **Play Now**: two CTA buttons linking to `/play/` (the game).
  5. **Mobile / Android**: "Google Play — coming soon" badge.
  6. **Footer**: minimal — title, year.
- [x] Create `landing/style.css` — standalone; same color grammar (`#000`, `rgba(155,195,235)`, `rgba(185,220,255)`).
- [x] Add Open Graph meta tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`.
- [x] Add Twitter Card meta tags.
- [x] Favicon: inline SVG (black square + pale-blue pulse dot) on both pages — no external file needed.
- [ ] ~~Umami/Plausible analytics~~ — **deferred**: requires a hosted analytics instance/account the project doesn't have. Left out rather than adding a dead/broken external `<script>`. Add when an instance exists.
- [ ] ~~Sentry error tracking~~ — **deferred**: requires a Sentry DSN/account. Skipped to avoid a broken dependency; revisit when an account exists.
- [x] `vite.config.js`: multi-page build via `rollupOptions.input = { main: index.html, landing: landing/index.html }`.
- [x] Test landing page on mobile — responsive via `clamp()`/grid/flex; verified layout at narrow widths.
- [x] Commit + push
- [ ] **Follow-up before public launch**: replace the `https://resonance.example.com` placeholder in `og:url`/`og:image` (both `index.html` and `landing/index.html`) with the real production domain; optionally swap the SVG OG cover for a 1200×630 PNG for widest social-scraper support.

### Files Modified / Created
- `index.html` (repo root) — now the landing page (+ Capacitor→game redirect, favicon, OG/Twitter meta)
- `play/index.html` (new) — the game, moved off root; served at `/play/`
- `landing/style.css` — landing stylesheet (referenced by root `index.html`)
- `public/landing/og-cover.svg` (new) — 1200×630 social card, copied verbatim to `dist/landing/og-cover.svg`
- `vite.config.js` — multi-page rollup input (`main` = landing, `game` = play)
- `wrangler.jsonc` — `html_handling` + `not_found_handling` for deterministic routing

### Acceptance Criteria
- [x] Landing page loads at the site root `/`
- [x] Game loads at `/play/`; "Play Now" buttons link there
- [x] `/play` (no slash) resolves to the game via `auto-trailing-slash`; unknown paths 404 (no silent fallback)
- [x] Native Android app opens directly into the game (root landing redirects when `Capacitor.isNativePlatform()`)
- [x] Page is lightweight and fast — fully self-contained, ~5.8 kB HTML + ~4.2 kB CSS, zero external requests, CSS-only animations
- [~] Open Graph preview renders when shared — tags present; needs the real domain substituted for the placeholder before it resolves live (SVG cover works on Discord; a PNG is recommended for Twitter/X)
- [x] No cookie consent banner required (no analytics/cookies shipped)
- [x] Landing page is fully usable on a 375px mobile screen (responsive units, single-column collapse)

---

## Phase 23 — Performance Hardening
**Status:** ✅ Complete (mechanisms implemented + verified headless; on-device 60fps profiling still to be done on real hardware)  
**Goal:** Stable 60fps on a mid-range 2021 Android phone and low-end desktop browsers.  
**Depends on:** Phase 21 complete (need device testing data)  
**Estimated effort:** 4–6 days  
**Risk:** Medium

### Profiling targets
Use Chrome DevTools Performance tab. Record a 10-second segment with full pulse spam. Identify:
- Long frames (>16ms)
- GC pauses (gray bars)
- GPU compositing cost (shadowBlur, canvas state changes)

### Tasks
- [x] **Cache vignette gradient**: `_vignetteCanvas` offscreen canvas built once (`buildVignette()`); each frame `ctx.drawImage(_vignetteCanvas, 0, 0)` replaces the per-frame radial gradient. (Canvas is a fixed 800×600 backing store — CSS scales it — so no resize invalidation is needed.)
- [x] **ShadowBlur audit**: The player glow is now a pre-rendered sprite (`buildPlayerGlow()` → `drawImage`), removing its per-frame gradient + shadowBlur. Additionally, every hot-path `shadowBlur` is routed through `sb()`, which forces it to 0 at medium/low tiers — so the blur compositing cost disappears entirely when quality is reduced.
- [x] **Adaptive quality**: `G.qualityTier` (`high`/`medium`/`low`) + user preference `G.qualityMode` (`auto`/forced, persisted to `localStorage`). In auto mode, after FPS stays below `QUALITY_DOWNGRADE_FPS (45)` for `QUALITY_SUSTAIN_MS (3s)` it drops a tier (→medium, or →low if also below `QUALITY_LOW_FPS (30)`), downgrade-only to avoid oscillation. Medium/low reduce the echo-trail cap (500→250→150), disable shadowBlur glow, and cut enemy step rays. A **Quality** button on the pause screen cycles Auto→High→Medium→Low.
- [x] **Ray object pool audit**: Pool size shown in the debug overlay; recycled `Ray` pool capped at `RAY_POOL_CAP (200)` in `RaySystem.update()`.
- [x] **Enemy step ray tuning**: enemy step-ray count is now `G.enemyStepRays` — `ENEMY_STEP_RAYS (8)` at high, `ENEMY_STEP_RAYS_LOW (5)` at reduced tiers.
- [x] **GC pressure**: reviewed — echo-trail pruning already compacts in place (single O(n) sweep, no per-frame `splice`); `splice` only runs in the rare over-cap case. Left as-is; the lower caps at reduced tiers further bound allocation. (Ring buffer not needed.)
- [x] **Offscreen canvas for static layers**: grid is never drawn (confirmed); vignette + player glow are the static layers now pre-rendered offscreen.
- [~] **Android WebView specific**: `willReadFrequently` intentionally **left false** — the game never calls `getImageData`, and enabling it forces software 2D rendering (would *hurt* GPU-accelerated canvas). No change made; documented here so it isn't "tried" later.
- [ ] Run Lighthouse on the production build URL. Target: Performance ≥ 90, Accessibility ≥ 80. *(Not run — needs the deployed URL.)*
- [x] Commit + push

### Files Modified
- `js/renderer.js` — vignette cache, player-glow sprite, `setQualityTier()` + `sb()` shadowBlur gating
- `js/waves.js` — configurable `trailCap`, `RAY_POOL_CAP` pool cap
- `js/game.js` — quality mode/tier state, adaptive logic, pause-menu cycle, persistence
- `js/ui.js` — `setQualityLabel()`
- `js/debug.js` — quality tier/mode, ray-pool size, effective trail cap
- `js/constants.js` — quality-tier tuning constants
- `play/index.html` — `#quality-btn` on the pause screen

### Acceptance Criteria
- [ ] 60fps stable on Samsung Galaxy A52 during full pulse burst — **not yet profiled on hardware** (needs a device + USB DevTools)
- [ ] 60fps stable on low-end desktop (CPU throttle 4×) — not yet profiled
- [x] No GC pause from per-frame allocation in the hot path — vignette/gradient allocs removed; pool + trail caps bound growth
- [ ] Lighthouse Performance ≥ 90 — not run (needs deployed URL)
- [x] Adaptive quality correctly reduces cap and disables blur when FPS degrades — verified: forcing/auto-dropping a tier lowers the trail cap and zeroes shadowBlur via the same `applyQualityTier` path (headless smoke test green, no runtime errors)

---

## Phase 24 — Save System + Achievements
**Status:** ✅ Complete  
**Goal:** Level persistence, best-time tracking, and a lightweight achievement system using localStorage only.  
**Depends on:** Phase 20 complete (all 20 levels must exist before designing achievements)  
**Estimated effort:** 3–5 days  
**Risk:** Low

### Tasks
- [x] localStorage schema centralized in **`js/save.js`** (guarded read/write):
  ```javascript
  resonance_progress: number        // furthest 0-based level index reached (unlock cursor)
  resonance_act1_complete: '1'      // Level 10 completed
  resonance_act2_complete: '1'      // Level 20 completed
  resonance_best_times: object      // { "<idx>": ms } — keyed by 0-based level index
  resonance_achievements: string[]  // earned achievement IDs (deduped on write)
  ```
- [x] **Level select screen** (`#screen-levelselect`): reached from the title's "Level Select" button. 20-cell grid; unlocked cells show best time, locked cells show a ◊ lock and are disabled. Click unlocked → `launchLevel(idx)`. Built dynamically in `ui.js buildLevelSelect()`. (Implemented as a DOM screen rather than a `type:` state — consistent with the other overlay screens.)
- [x] **Best-time recording**: `G.levelStartTime` set on `loadLevel`; on exit, `Save.recordTime(idx, performance.now() - start)` keeps the min.
- [x] **10 achievements** (`js/achievements.js`) — ids/names as specified. Notes on interpretation: `water_survivor` awards on completing Level 7 (death restarts the level, so a completion is inherently the deathless attempt); the rest use per-run flags (`usedPulse`, `patrolAlerted`, `screamerTriggered`, `stalkerHunted`).
- [x] Achievement unlock: persisted via `Save.unlockAchievement` (returns true only on a genuinely new unlock). **Toast** shown via a DOM element `#achievement-toast` (queued, ~2.5s each, CSS fade). *(Implemented as a DOM toast rather than a canvas draw — the game's HUD/screens are all DOM, so this is consistent and crisper. Deviation from the "draw after HUD" wording, same result.)*
- [x] **Achievement gallery** in the pause menu (`#achievement-gallery`): 10-cell glyph grid, earned = full opacity, unearned = dim with `???` tooltip. Rebuilt each time the pause screen opens.
- [x] Commit + push

### Files Modified
- `js/save.js` (new) — localStorage schema + helpers + `formatTime`
- `js/achievements.js` (new) — 10 definitions + pure `evaluate(ctx)`
- `js/game.js` — per-run tracking, best-time + achievement wiring, level-select launch, progress refactored onto Save
- `js/ui.js` — `buildLevelSelect`, `buildAchievementGallery`, `showAchievementToast`
- `play/index.html` — Level Select button, `#screen-levelselect`, `#achievement-gallery`, `#achievement-toast`
- `css/style.css` — level-select grid, gallery, toast styles (responsive)

(Note: no `renderer.js` change was needed — the toast/gallery/grid are DOM, not canvas.)

### Acceptance Criteria
- [x] Level select shows all 20 levels; locked/unlocked state correct — verified (seeded progress=5 → 6 unlocked, cell 7 locked)
- [x] Best times display next to completed levels — verified ("15.23s" from a seeded time)
- [x] All 10 achievements unlock correctly on first qualification (not re-trigger) — evaluator unit-tested (12/12); `Save.unlockAchievement` dedupes
- [x] Achievement toast appears for ~2.5s and fades smoothly — DOM element + CSS transition; queued for multiple simultaneous unlocks
- [x] Save data persists across refresh — verified via seeded localStorage reflected in UI after boot
- [x] `resonance_achievements` never contains duplicate IDs — `unlockAchievement` checks membership before push

---

## Phase 25 — Google Play Store Submission
**Status:** ⏸️ Deferred (by owner decision, 2026-07-20)  
**Goal:** Submit the Android app to Google Play and reach public availability.  
**Depends on:** Phases 21 and 24 complete  
**Estimated effort:** 3–5 days + 3–7 days Play review time  
**Risk:** Medium-High (Play review can reject for unexpected reasons)

> **Deferred:** the owner has chosen to hold off on Play Store submission for now —
> the game is feature-complete for the roadmap's gameplay scope but not yet
> considered fully production-ready for a public store launch (no signed release
> build, no on-device 60fps/latency profiling, no store assets/privacy page).
> Everything below remains the plan for when submission is picked back up; nothing
> here is started. The tasks are unchecked intentionally.

### Tasks
- [ ] Open Google Play Console at `play.google.com/console` ($25 one-time developer fee).
- [ ] Create new app: "RESONANCE — Sound Vision Game" (check name availability).
- [ ] Set up production release track.
- [ ] Build signed release APK: `cd android && ./gradlew bundleRelease` (produce AAB, not APK — Play prefers AAB). Sign with release keystore.
- [ ] Fill Play Store listing:
  - Short description (80 chars): "Navigate in total darkness. Sound is your only vision."
  - Full description: explain the mechanic, no spoilers. 4000 char limit.
  - Screenshots: 2 phone screenshots (1080×1920), 2 7-inch tablet screenshots (1200×1920). Capture pulse visualization, enemy encounter, level completion.
  - Feature graphic: 1024×500. Black background, RESONANCE title in pale blue, glowing echo rings.
  - Privacy policy URL: a `/privacy` page on the Cloudflare Pages site. Template: "This app does not collect any personal data. No accounts, no analytics."
- [ ] Complete IARC content rating questionnaire. Expected result: Everyone or Everyone 10+ (mild horror-adjacent).
- [ ] Set price: Free (no IAP). Monetization deferred indefinitely per spec.
- [ ] Set target countries: Worldwide.
- [ ] Submit for review. Expected review time: 3–7 business days.
- [ ] Monitor pre-launch report (Play's automated test on real devices). Fix any flagged crashes.
- [ ] Respond to review rejection if any (common issues: privacy policy missing, target API too low).
- [ ] After approval: announce on Reddit (`r/gamedev`, `r/indiegaming`, `r/AndroidGaming`).
- [ ] Monitor Play Console for crash reports and ANRs (App Not Responding). Fix critical issues within 48 hours.

### Files Created
- `landing/privacy.html` (new) — privacy policy page

### Acceptance Criteria
- [ ] App is publicly visible in Google Play search
- [ ] App installs cleanly from Play Store (not just sideload)
- [ ] No crash-on-launch on any device in pre-launch report
- [ ] Rating/review section is live
- [ ] Privacy policy URL resolves and contains accurate statement
- [ ] No in-app purchases or ads are present (matches listing description)

---

## Phase 26 — Sound Grammar Fixes (Yellow Exit + Sound-Activated Switches)
**Status:** ⬜ Pending  
**Goal:** Close the three colour/interaction spec violations: make the exit yellow, and let sound waves — not just the player's body — activate switches.  
**Covers:** `SND-06`, `ENV-01`, `ENV-02`  
**Depends on:** Nothing (fully independent — safe to do first)  
**Estimated effort:** 1–2 days  
**Risk:** Low

### Why this first
It is the cheapest parity win in the list and it fixes a *grammar* bug: today the
exit is drawn in the same white as the player's own sound, so the objective reads
as "you" instead of "goal". Every other yellow object already follows the rule.

### Tasks
- [ ] **Yellow exit** — `drawExit()` in `js/renderer.js`: swap the white
      `rgba(225,238,255,…)` gradient + core dot for the canonical objective yellow
      (`rgba(240,215,70,…)` fill, `rgba(245,225,110,…)` core), matching the existing
      key/door/trigger palette. Keep the pulsing animation and the `revealedAt` hide.
- [ ] Update the exit row in **`docs/PROJECT_MASTER_SPEC.md` §3** (currently documents
      the exit as a white beacon) so the colour table stays truthful.
- [ ] Update the **How to Play** legend (`play/index.html`): the "White — you" row
      currently claims the exit is white; move the exit into the yellow row.
- [ ] **Sound-activated switches** — in `processRayEntities()` (`js/game.js`), the
      trigger loop currently only sets `tr.revealedAt`. Add activation: if a ray of
      type `pulse` (and optionally `step` when loud enough) passes within
      `TRIGGER_ACTIVATE_D` of an unfired trigger **and** the trigger is marked
      `soundActivated: true`, fire it via the existing `fireTrigger(tr)` path.
- [ ] Add `soundActivated` as an opt-in flag on trigger defs in `js/levels.js` so
      existing presence-triggers keep working unchanged (no level regressions).
- [ ] Author/retune at least one level to use a sound-activated switch — a switch
      behind a gap the player cannot reach, opened by clapping at it. This is the
      puzzle type the mechanic exists to enable.
- [ ] Add `TRIGGER_ACTIVATE_D` + colour constants to `js/constants.js`.
- [ ] Build, verify headless (exit renders yellow; sound-fired trigger opens its door), commit + push.

### Files Modified
- `js/renderer.js` — `drawExit()` colour
- `js/game.js` — trigger activation from rays in `processRayEntities()`
- `js/levels.js` — `soundActivated` flag + one puzzle using it
- `js/constants.js` — activation radius
- `play/index.html`, `docs/PROJECT_MASTER_SPEC.md` — legend/colour-table truth

### Acceptance Criteria
- [ ] Exit renders in objective-yellow, distinct from player sound, still hidden until revealed
- [ ] All four colour classes are unambiguous on screen: white = you, blue = water, yellow = objective, red = danger
- [ ] A pulse aimed at a `soundActivated` switch fires it without the player touching it
- [ ] Presence-activated triggers still fire exactly as before (no level regressions across all 20 levels)
- [ ] A trigger fires at most once (`tr.fired` guard holds under multi-ray bursts)

---

## Phase 27 — Noise Magnitude Model + Sprint
**Status:** ⬜ Pending  
**Goal:** Replace binary "heard / not heard" AI with a graded loudness model, and add the missing top rung of the movement ladder — sprint.  
**Covers:** `PLR-04`, `AI-01`  
**Depends on:** Nothing — but **Phases 28 and 29 depend on this**  
**Estimated effort:** 4–6 days  
**Risk:** Medium (touches enemy AI and the core movement/stealth balance of all 20 levels)

### Why this is the keystone
Right now every sound is equal to the AI and the *most recent* one wins. That makes
loudness meaningless: a sprint can't be riskier than a walk, and a thrown decoy
(Phase 29) can't out-compete the player's own footsteps. A single shared
`loudness` value fixes all three mechanics at once.

### Tasks
- [ ] **Noise scale** — add a canonical loudness ladder to `js/constants.js`:
      `NOISE_SNEAK` < `NOISE_WALK` < `NOISE_SPRINT` < `NOISE_CLAP`, with decoys
      (Phase 29) slotting in. One number per emission, normalized 0–1.
- [ ] Thread `loudness` through the emission path: `RaySystem.burst()` → `Ray.init()`
      → the ray's `heardEntities` reporting, alongside the existing `quiet` flag
      (`js/waves.js`). Loudness should be carried per-ray, like `burstX/burstY`.
- [ ] **Loudest-wins arbitration** — give sound-hunting enemies (`ChaserEnemy`,
      `BlindStalker`, step-aware `PatrolEnemy`) a `currentNoiseLevel`. On
      `hearSound(x, y, loudness)`, only retarget if
      `loudness >= this.currentNoiseLevel` **or** the previous cue has decayed.
      Decay `currentNoiseLevel` over time so old loud sounds stop masking new ones.
- [ ] **Sprint** — third movement tier in `js/entities.js` `Player.move()`:
      `SPRINT_SPEED_MULT` (~1.6×), `SPRINT_INTERVAL_MULT` (more frequent steps),
      `SPRINT_RAY_MULT` + `SPRINT_DIST_MULT` (more rays, travelling further),
      emitting at `NOISE_SPRINT`.
- [ ] **Sprint input** — keyboard: hold <kbd>Ctrl</kbd> (or double-tap a direction).
      Touch: extend the Dark Echo model in `js/input.js` — hold *far* from the feet
      = sprint, near = walk (radial distance already drives direction, so distance
      is the natural intensity axis and needs no new gesture). Add `isSprinting()`
      alongside `isCrouching()`.
- [ ] Feed sprint into the footprint gait (`FOOTPRINT_STRIDE_PX` scales with speed
      so sprint prints are spaced further apart) and into `Audio.playFootstepSurface`.
- [ ] Rebalance: verify Act I levels are still passable and Act II is still hard —
      sprint must be a *risk*, not a free win. Re-check the Phase 23 ray budget:
      sprint raises peak ray counts, so confirm the pool cap and quality tiers hold.
- [ ] Update **How to Play** with the third tier + the risk/reward framing.
- [ ] Build, verify headless, commit + push.

### Files Modified
- `js/constants.js` — noise ladder + sprint tuning constants
- `js/waves.js` — carry `loudness` per ray/burst
- `js/entities.js` — sprint tier in `Player.move()`; `currentNoiseLevel` + decay on hunting enemies
- `js/game.js` — pass loudness on every emission; sprint step interval/ray counts
- `js/input.js` — sprint gesture (keyboard + touch), `isSprinting()`
- `js/renderer.js` — stride spacing scales with speed
- `play/index.html` — tutorial update

### Acceptance Criteria
- [ ] Three distinct, *felt* noise tiers: sneak (quiet, short reveal) → walk → sprint (loud, long reveal)
- [ ] Sprinting reliably draws enemies from further away than walking; sneaking reliably does not
- [ ] A louder sound overrides a quieter one already being tracked; a quieter one does **not** override a louder recent cue
- [ ] Noise level decays so an enemy eventually re-acquires new, quieter sounds
- [ ] All 20 levels remain completable; Act II remains harder than Act I
- [ ] Frame rate holds at sprint-peak ray counts on the `low` quality tier

---

## Phase 28 — Charge Clap (Variable-Intensity Pulse)
**Status:** ⬜ Pending  
**Goal:** Turn the fixed binary pulse into a true *charge* clap — hold to build intensity, release to emit, trading loudness for reveal distance.  
**Covers:** `PLR-05`  
**Depends on:** **Phase 27** (consumes the noise-magnitude model)  
**Estimated effort:** 2–3 days  
**Risk:** Low-Medium (changes a core verb players already know)

### Tasks
- [ ] **Charge state** — hold <kbd>Space</kbd> (keyboard) / hold on the feet (touch,
      the gesture already exists in `js/input.js`) to accumulate charge over
      `CLAP_CHARGE_MS`; release to fire. Expose `getClapCharge()` (0–1).
- [ ] Scale the burst by charge: `RAY_COUNT_PULSE`, `PULSE_RAY_MAX` and the Phase 27
      `NOISE_CLAP` loudness all interpolate from a weak tap to a full-power clap.
      A minimum charge floor prevents accidental zero-value taps.
- [ ] **Charge feedback** without breaking the zero-HUD goal (Phase 30): show charge
      *diegetically* — a tightening ring of light at the player's feet that brightens
      as it builds, rather than a HUD meter.
- [ ] Cooldown reform: scale `PULSE_COOLDOWN` with the charge actually spent, so
      small taps recover fast and full claps cost the current 3.5s.
- [ ] Audio: pitch/gain of `playPulse()` scales with charge; add a rising charge tone.
- [ ] Reconcile with the touch model — `STOMP_MIN_HOLD` becomes the charge floor;
      confirm walk/sneak/stomp disambiguation still holds (Phase 21.1 behaviour).
- [ ] Update **How to Play**; build, verify headless, commit + push.

### Files Modified
- `js/input.js` — charge accumulation + `getClapCharge()`
- `js/game.js` — charge-scaled burst, loudness, cooldown
- `js/waves.js` — accept count/distance overrides from charge (already parameterized)
- `js/renderer.js` — diegetic charge ring
- `js/audio.js` — charge tone + charge-scaled clap
- `js/constants.js` — charge timing/scaling constants

### Acceptance Criteria
- [ ] Holding longer produces a visibly larger reveal and a proportionally louder AI response
- [ ] A minimum-charge tap is cheap and low-risk; a full clap is expensive and dangerous
- [ ] Charge level is readable on screen without a HUD element
- [ ] Touch controls still cleanly separate walk / sneak / clap (no misfires)
- [ ] Cooldown feels proportional — no "spam tiny claps for free vision" exploit

---

## Phase 29 — Throwable Noise Decoy
**Status:** ⬜ Pending  
**Goal:** Add the missing distraction verb — throw a noise-maker to lure enemies away from your path.  
**Covers:** `PLR-06`  
**Depends on:** **Phase 27** (a decoy is inert without loudest-wins arbitration)  
**Estimated effort:** 4–6 days  
**Risk:** Medium (new entity + new aiming interaction on two input schemes)

### Tasks
- [ ] **`NoiseDecoy` entity** (`js/entities.js`): travels from the player to a target
      point (arc or straight, wall-collision aware via `castRay`), lands, then emits
      one or more bursts at `NOISE_DECOY` loudness — loud enough to out-compete the
      player's own footsteps under the Phase 27 model.
- [ ] Emission on landing routes through the normal `RaySystem.burst()` path so the
      decoy reveals geometry *and* is heard by AI exactly like any other sound —
      no special-case AI code.
- [ ] **Aiming** — keyboard: hold a throw key to show an arc, release to throw.
      Touch: needs a gesture that does not collide with walk/sneak/clap — evaluate
      two-finger tap or a dedicated hold-then-drag; this is the main design risk and
      should be prototyped before committing.
- [ ] **Economy** — decoys must be finite or they trivialize stealth. Per-level
      allowance (`def.decoys`) starting at ~2, or a slow recharge. Decide before
      authoring levels.
- [ ] Render the decoy in white (it is *your* sound, per the colour grammar), with
      its in-flight position revealed only by the sound it makes.
- [ ] Author decoy-dependent puzzles in late Act II — a corridor that is impossible
      to cross until the stalker is pulled off it. This is the mechanic's purpose;
      without a level that requires it, it is decoration.
- [ ] Surface remaining decoy count diegetically (respect Phase 30's zero-HUD goal).
- [ ] Update **How to Play**; build, verify headless, commit + push.

### Files Modified
- `js/entities.js` — `NoiseDecoy` class
- `js/game.js` — throw handling, decoy update/emission, per-level allowance
- `js/input.js` — aim + throw (keyboard and touch)
- `js/renderer.js` — decoy + aiming arc rendering
- `js/levels.js` — `decoys` allowance + decoy-gated puzzles
- `js/audio.js` — impact/landing sound
- `js/constants.js` — decoy speed, range, loudness, count

### Acceptance Criteria
- [ ] A thrown decoy reliably pulls sound-hunting enemies (Chaser, BlindStalker, step-aware Patrol) to its landing point
- [ ] While enemies investigate the decoy, the player can cross a route that is otherwise impassable
- [ ] The decoy out-competes the player's own quiet movement, but a player who then sprints re-takes AI attention (validates Phase 27)
- [ ] Throwing cannot be triggered accidentally by walk/sneak/clap gestures on touch
- [ ] Decoys are finite; the count is discoverable without a HUD meter
- [ ] At least one late-Act-II level genuinely requires a decoy to solve

---

## Phase 30 — Zero-HUD Immersion Mode
**Status:** ⬜ Pending — **needs an explicit owner decision before starting**  
**Goal:** Match the original's chrome-free presentation by removing the persistent HUD, replacing each readout with a diegetic cue.  
**Covers:** `UI-01`  
**Depends on:** Phases 28–29 (their charge/decoy feedback must already be diegetic, or removing the HUD strands them)  
**Estimated effort:** 1–2 days  
**Risk:** Low technically — **but it is a deliberate usability trade**

> **Decision required.** The current HUD (pulse cooldown bar, `LEVEL n / 20`, crouch
> indicator) is a genuine usability gain that the original forgoes for immersion.
> Recommended resolution: ship it as a **toggle** (default on for new players,
> off for purists) rather than deleting the HUD outright — that satisfies the spec
> without regressing readability. Confirm the approach before implementing.

### Tasks
- [ ] Decide: full removal vs. **toggle** (recommended) vs. auto-fade after N seconds.
- [ ] **Pulse cooldown → diegetic**: replace `#pulse-bar` with the Phase 28 charge
      ring at the player's feet; readiness shown by the ring reaching full brightness
      (the existing `playPulseReady()` audio cue already covers the audio half).
- [ ] **Crouch indicator → diegetic**: stance is already visible in the footprints
      (crouched prints can be drawn smaller/fainter) — remove the text label.
- [ ] **Level label → transient**: show `LEVEL n` only as a brief fade-in at level
      start, then clear it.
- [ ] Add the toggle to the pause menu + persist it in `js/save.js`
      (`resonance_zero_hud`), consistent with the existing quality toggle.
- [ ] Verify nothing becomes *unknowable*: charge state, pulse readiness, crouch
      state and level identity must each still be discoverable in-game.
- [ ] Build, verify headless, commit + push.

### Files Modified
- `play/index.html`, `css/style.css` — HUD toggle/removal
- `js/renderer.js` — diegetic charge ring, crouched footprint styling, transient level title
- `js/save.js` — persisted preference
- `js/game.js`, `js/ui.js` — pause-menu toggle wiring

### Acceptance Criteria
- [ ] With zero-HUD active, no persistent UI overlays the play field
- [ ] Pulse readiness, charge level, crouch state and current level all remain discoverable without the HUD
- [ ] Preference persists across sessions and applies immediately when toggled
- [ ] Achievement toasts and pause/death/level-complete screens are unaffected

---

## Phase 31 — Full-Screen Mobile Viewport (Android)
**Status:** ⬜ Pending — **Priority: High. Recommended before Phases 26–30.**  
**Goal:** Make the game fill the entire device screen on Android instead of pillarboxing into a 4:3 box, so the touch controls sit under the player's thumbs at the real screen edges.  
**Covers:** Reported on-device usability defect (not a Dark Echo parity item)  
**Depends on:** Nothing — independent of the parity phases  
**Estimated effort:** 3–5 days  
**Risk:** Medium (touches the render transform, input mapping, and every screen-space constant)

> **Why this jumps the queue.** This is the only item in the backlog that makes the
> shipped Android build actively uncomfortable to play. Parity mechanics (26–30)
> add depth to a game people can already play; this one fixes a game people are
> *straining* to play. Do it first.

### The defect (measured)

`css/style.css` locks the play area to the game's native 4:3:

```css
#wrap {
  width:  min(800px, 100vw, calc(100vh * 4 / 3));
  height: min(600px, 100vh, calc(100vw * 3 / 4));
}
```

Modern phones are ~19.5:9 in landscape, so 4:3 pillarboxes hard:

| Device (landscape) | Viewport | Game area | Dead bar each side | Screen used |
|---|---|---|---|---|
| Pixel 7 | 915×412 | 549×412 | **183 px** | 60 % |
| Galaxy S23 | 854×393 | 524×393 | **165 px** | 61 % |
| iPhone-class | 932×430 | 573×430 | **179 px** | 62 % |
| Pixel 7 **portrait** | 412×915 | 412×309 | 303 px top/bottom | 34 % |

Two consequences, both reported:
1. **Ergonomics** — the player must reach inward to the centre-left / centre-right of
   the *canvas* rather than resting their thumbs at the natural screen edges.
2. **Dead zones** — touch listeners are bound to `canvasEl` (`js/input.js`), so the
   black bars are entirely unresponsive. Roughly 40 % of the screen does nothing.

### Approach — widen the field of view, do **not** stretch

The camera is already player-centred and only shows a slice of the level
(`CAMERA_ZOOM`), so rendering a wider view is natural and non-distorting.

- ❌ **Stretch to fill** — distorts circles into ellipses; breaks the visual language. Rejected.
- ❌ **Zoom-to-fill / crop** — preserves aspect but silently removes vertical play area. Rejected.
- ✅ **Aspect-adaptive viewport** — size the canvas backing store to the *device*
  aspect and let the camera reveal the correct world area for that shape.

**Fairness constraint:** a 20:9 phone must not see meaningfully more of the level
than a 4:3 tablet, or the game gets easier on wider hardware. Scale `CAMERA_ZOOM`
by aspect so the *visible world area* stays roughly constant, letting shape — not
area — change with the device.

### Tasks
- [ ] Replace the fixed `canvas.width = W; canvas.height = H` in `Renderer.init()`
      with a `resizeCanvas()` that sets the backing store from the real viewport
      (× `devicePixelRatio`, clamped for perf) and runs on load, `resize`, and
      `orientationchange`.
- [ ] **Refactor screen-space `W`/`H` off the 800×600 constants.** They are imported
      widely for the camera transform, vignette, HUD and title screen. Introduce
      runtime `viewW`/`viewH` (screen space) and keep `W`/`H` meaning *world/level*
      size only. Audit every current use of `W`/`H` and classify it as one or the other.
- [ ] `js/renderer.js` camera block: derive the view rect from the live viewport
      instead of `W / CAMERA_ZOOM`, `H / CAMERA_ZOOM`.
- [ ] Aspect-compensated zoom so visible world **area** is constant across devices
      (wide screens see wider but proportionally shorter). Add the constant + rationale.
- [ ] `buildVignette()` is pre-rendered at a fixed size — rebuild it on resize
      (it is cached offscreen from Phase 23; a stale cache will smear or letterbox).
- [ ] **`js/input.js`**: `CANVAS_W`/`CANVAS_H` are hardcoded `800`/`600` and used by
      `canvasToLocal()`. Read live canvas dimensions instead, or the entire touch
      model mis-maps once the canvas is no longer 800×600.
- [ ] `js/game.js` currently feeds `Input.setPlayerScreenPos(W / 2, H / 2)` — must
      become the live viewport centre, or "walk toward finger" aims at the wrong point.
- [ ] Make the whole screen touch-active: move listeners to a full-bleed element (or
      ensure the canvas genuinely covers the viewport) so there are no dead margins.
- [ ] **Safe-area insets** — `viewport-fit=cover` is already set in `play/index.html`;
      add `env(safe-area-inset-*)` padding for HUD/overlay screens so nothing sits
      under a notch, punch-hole, or the gesture bar.
- [ ] Decide portrait behaviour: portrait wastes 66 % of the screen today. Either
      support it properly via the same adaptive viewport, or lock the Android app to
      landscape in `AndroidManifest.xml` (`android:screenOrientation="sensorLandscape"`).
      Recommend locking to landscape — the control scheme assumes two thumbs at the edges.
- [ ] Re-verify Phase 21.1's canvas-cutoff fix and Phase 23's quality tiers still hold
      (a larger backing store raises fill cost; confirm the `low` tier still holds frame rate).
- [ ] Rebuild the APK (`docs/ANDROID_BUILD_GUIDE.md`) and confirm on a real device.
- [ ] Build, verify headless at several viewport aspects, commit + push.

### Files Modified
- `css/style.css` — `#wrap` sizing; safe-area padding
- `js/renderer.js` — `resizeCanvas()`, camera from live viewport, aspect-compensated zoom, vignette rebuild
- `js/constants.js` — world vs. view separation, aspect-compensation constant
- `js/input.js` — live canvas dimensions in `canvasToLocal()`
- `js/game.js` — live viewport centre for `setPlayerScreenPos`
- `play/index.html` — safe-area / full-bleed container
- `android/app/src/main/AndroidManifest.xml` — orientation lock (if adopted; `android/` is gitignored — document in the build guide)

### Acceptance Criteria
- [ ] Game fills 100 % of the screen on a real Android device — no black bars in landscape
- [ ] Touch works at the extreme left and right screen edges; no dead margins anywhere
- [ ] Nothing is stretched or distorted — circles stay circular at every aspect ratio
- [ ] A 20:9 phone does not see materially more level area than a 4:3 display
- [ ] Rotating / resizing re-lays out cleanly with no stale vignette or mis-mapped touch
- [ ] HUD and overlay screens clear notches and the gesture bar
- [ ] Frame rate holds at the larger backing store on the `low` quality tier
- [ ] Desktop browser at 800×600 is visually unchanged from today

---

## Summary: Effort Estimate and Sequence

```
Phase 15 — Build pipeline + deploy    3–5 days    [START HERE]
Phase 16 — Wavefront visual           5–8 days    [after 15]
Phase 17 — Positional audio + enemy   8–12 days   [after 15, parallel with 16]
Phase 18 — Reverb + environment       5–7 days    [after 17]
Phase 19 — Movement + micro-polish    3–4 days    [after 15, parallel with 16–18]
Phase 20 — Act II levels              10–15 days  [after 16–18]
Phase 21 — Android (Capacitor)        5–8 days    [after 15]
Phase 22 — Website + landing page     5–8 days    [after 15]
Phase 23 — Performance hardening      4–6 days    [after 21]
Phase 24 — Save + achievements        3–5 days    [after 20]
Phase 25 — Google Play submission     3–5 days    [after 21 + 24]
─────────────────────────────────────────────────
Total estimate:                       55–83 days  (~12–17 focused weeks)
```

**Recommended parallel tracks:**
- Track A (Gameplay): 15 → 16 → 17 → 18 → 19 → 20 → 24
- Track B (Platform): 15 → 21 → 23 → 25
- Track C (Web): 15 → 22

All tracks can proceed independently after Phase 15 is done.

---

## Summary: Parity + Platform (Phases 26–31)

```
Phase 31 — Full-screen mobile viewport 3–5 days   [independent — DO FIRST]
Phase 26 — Sound grammar fixes        1–2 days    [independent — cheapest parity win]
Phase 27 — Noise magnitude + sprint   4–6 days    [independent — KEYSTONE]
Phase 28 — Charge clap                2–3 days    [after 27]
Phase 29 — Throwable noise decoy      4–6 days    [after 27]
Phase 30 — Zero-HUD immersion mode    1–2 days    [after 28 + 29 · needs decision]
─────────────────────────────────────────────────
Parity total (26–30):                 12–19 days  (~3–4 focused weeks)
Including Phase 31:                   15–24 days  (~4–5 focused weeks)
```

**Dependency graph:**

```
31 (full-screen viewport) ──── independent · highest user impact
26 (grammar) ───────────────── independent, cheapest win
27 (noise + sprint) ──┬── 28 (charge clap)
                      └── 29 (decoy)  ──┬── 30 (zero-HUD)
                          28 ───────────┘
```

**Recommended order:** **31** → 26 → 27 → 28 → 29 → 30.

- **31 first** — it is the only item that makes the shipped Android build actively
  uncomfortable: ~40 % of the screen is wasted black bar *and* dead to touch, forcing
  players to reach inward. Everything else adds depth to a game people can already
  play; this fixes a game people are straining to play.
- **26 next** — 1–2 days, depends on nothing, and fixes a colour-grammar bug that
  actively misleads players today (the exit reads as "your sound").
- **27 is the keystone** — 28, 29 and the *meaning* of sprint all collapse without
  loudness arbitration. Do not start 28 or 29 before it.
- **30 last, and only after an owner decision** — it trades usability for immersion,
  and it depends on 28/29 having already moved their feedback on-screen diegetically.

After Phase 30, all 20 mechanics in the original Dark Echo design spec are covered.
Phase 31 is orthogonal to parity — it is a platform/ergonomics fix, tracked here
because it gates how playable the Android build actually is.
