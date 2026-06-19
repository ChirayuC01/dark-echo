# PRODUCTION ROADMAP — RESONANCE

> **This document picks up where IMPLEMENTATION_ROADMAP.md ends.**  
> Phases 0–14 are complete (v1.0.0). Phases 15–25 take the game from local prototype to commercial browser + Android product.  
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
**Status:** ✅ Complete  
**Goal:** Transform the ray visualization from "starburst spokes" to "expanding sonar ring." This is the single highest-impact visual change to close the gap with Dark Echo.  
**Depends on:** Phase 15 complete  
**Estimated effort:** 5–8 days  
**Risk:** Medium (renderer changes affect all visual output)

### Context
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
**Status:** ⬜ Pending  
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
**Status:** ⬜ Pending  
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
**Status:** ⬜ Pending  
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
**Status:** ⬜ Pending  
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
**Status:** ⬜ Pending  
**Goal:** Package the game as a native Android app via Capacitor for Google Play Store submission.  
**Depends on:** Phase 15 complete  
**Estimated effort:** 5–8 days  
**Risk:** Medium (device-specific issues are unpredictable)

### Tasks
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ] `npx cap init "Resonance" "com.resonance.soundgame"` — use a real reverse-domain identifier
- [ ] Update `capacitor.config.ts`: `webDir: 'dist'`, `bundledWebRuntime: false`
- [ ] `npx cap add android`
- [ ] `npm run build && npx cap sync` — builds and syncs web assets to android/
- [ ] In `android/app/src/main/AndroidManifest.xml`: set `android:hardwareAccelerated="true"` (performance), add `android:largeHeap="true"` (memory safety)
- [ ] In `MainActivity.java`: add `getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false)` — required for Web Audio to work on load
- [ ] Add `@capacitor/haptics`: `npm install @capacitor/haptics`. Trigger `Haptics.impact({ style: ImpactStyle.Medium })` on death and collapse in `game.js`.
- [ ] Add `@capacitor/status-bar`: hide status bar on app launch.
- [ ] Test audio latency: if Web Audio latency > 100ms, investigate `AudioContext.baseLatency` and add latency compensation to visual timing.
- [ ] Create app icon: 512×512 PNG, black background, white/blue RESONANCE icon. Generate all required sizes via `npx @capacitor/assets generate`.
- [ ] Create splash screen (optional): same style as title screen.
- [ ] Build release APK: `cd android && ./gradlew assembleRelease`
- [ ] Sign APK with a generated release keystore. Store keystore securely (never commit).
- [ ] Sideload signed APK to a physical device. Confirm all 10 levels work.
- [ ] Test on at least two device types: high-end (Pixel 7) and mid-range (Galaxy A52 or equivalent).
- [ ] Commit + push (`android/` directory should NOT be in git — add to `.gitignore`. Only `capacitor.config.ts` and `package.json` additions are committed.)

### Files Modified
- `package.json` — Capacitor dependencies
- `capacitor.config.ts` (new)
- `.gitignore` — add `android/` and `ios/`
- `js/game.js` — Haptics import + trigger calls
- `android/` directory (gitignored — local only)

### Acceptance Criteria
- [ ] APK installs on a physical Android device
- [ ] All 10 levels are playable with touch controls
- [ ] Audio plays without noticeable latency (< 80ms perceptible threshold)
- [ ] App runs at 60fps on a mid-range 2021 Android (Samsung Galaxy A52 or equivalent)
- [ ] Haptics fire on death and collapse (if device supports it)
- [ ] Status bar hidden during gameplay
- [ ] App does not crash on background/foreground cycle (AudioContext suspend/resume)

---

## Phase 22 — Website + Landing Page
**Status:** ⬜ Pending  
**Goal:** Build a professional landing page that presents RESONANCE as a commercial product.  
**Depends on:** Phase 15 complete (public URL must exist)  
**Estimated effort:** 5–8 days  
**Risk:** Low

### Tasks
- [ ] Create `landing/index.html` (separate from game's `index.html`).
- [ ] Set Cloudflare Pages root to serve `landing/` at `/` and game at `/play/`.
- [ ] Landing page sections (in order):
  1. **Hero**: Game title "RESONANCE", tagline "Sound is your only vision.", black background, pale blue title matching game color grammar, pulsing animated dot.
  2. **Mechanic preview**: Short looping GIF or `<video autoplay muted loop>` of a pulse burst in-game (30s screen recording, compressed).
  3. **Feature bullets**: "No graphics. Only echoes." / "5 enemy types, all hunting by sound." / "10 levels of escalating darkness." (3 lines max.)
  4. **Play Now**: Large CTA button linking to `/play/` (game embed or new tab).
  5. **Mobile / Android**: "Also on Android" badge (once Play Store link exists).
  6. **Footer**: minimal — title, year, no analytics disclosure needed (using cookieless analytics).
- [ ] Create `landing/style.css` — standalone from game CSS; uses same color grammar (`#000`, `rgba(155,195,235)`, `rgba(185,220,255)`).
- [ ] Add Open Graph meta tags: `og:title`, `og:description`, `og:image` (1200×630 screenshot of game), `og:url`.
- [ ] Add Twitter Card meta tags.
- [ ] Favicon: 32×32 icon (black square with small blue pulse dot).
- [ ] Add `<script defer src="https://analytics.example.com/script.js">` for Umami or Plausible (self-hosted or cloud free tier, cookieless).
- [ ] Add Sentry JS error tracking to `js/game.js` for the production build: `import * as Sentry from "@sentry/browser"` — only in built bundle (Vite env check).
- [ ] `vite.config.js`: configure multi-page build: `{ input: { main: 'index.html', landing: 'landing/index.html' } }`.
- [ ] Test landing page on mobile — it must be responsive and fast.
- [ ] Commit + push

### Files Modified / Created
- `landing/index.html` (new)
- `landing/style.css` (new)
- `vite.config.js` — multi-page build config
- `js/game.js` — Sentry initialization (production only)
- `package.json` — `@sentry/browser` dev dependency

### Acceptance Criteria
- [ ] Landing page loads at the Cloudflare Pages root URL
- [ ] "Play Now" button links to the working game
- [ ] Page loads in under 2 seconds on a 4G connection
- [ ] Open Graph preview renders correctly when URL is shared on Twitter/Discord
- [ ] No cookie consent banner required (Umami/Plausible are cookieless)
- [ ] Landing page is fully usable on a 375px mobile screen

---

## Phase 23 — Performance Hardening
**Status:** ⬜ Pending  
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
- [ ] **Cache vignette gradient**: Create `_vignetteCanvas = null` offscreen canvas in `renderer.js`. On first call or canvas resize, draw the radial gradient to `_vignetteCanvas`. Each frame: `ctx.drawImage(_vignetteCanvas, 0, 0)` instead of re-creating the gradient. Expected saving: ~0.5ms/frame on mobile.
- [ ] **ShadowBlur audit**: Profile `shadowBlur` cost. If contributing > 1ms, replace player dot and exit glow with pre-rendered radial gradient instead of `ctx.shadowBlur`. A 32×32 offscreen canvas with a pre-drawn radial gradient is `drawImage()`-based and avoids compositing cost.
- [ ] **Adaptive quality**: Add `G.qualityTier = 'high'` to game state. Monitor rolling FPS (already tracked via EMA). If FPS drops below 45 for more than 3 consecutive seconds: set `qualityTier = 'medium'` — reduce `ECHO_TRAIL_CAP` from 500 to 250, disable blur filter (Phase 16), disable shadow glow on enemies. If below 30fps: `qualityTier = 'low'` — reduce further. Add a "Quality" setting to the settings/pause screen.
- [ ] **Ray object pool audit**: Confirm pool reuse rate in debug overlay. If pool grows unbounded, cap pool size at 200.
- [ ] **Enemy step ray tuning**: Enemy step rays (Phase 17) add N×8 rays per frame per enemy. At 5 enemies, this is 40 extra ray traces/frame. Verify this stays within frame budget on mobile. Tune `ENEMY_STEP_RAYS` down to 5 if needed.
- [ ] **GC pressure**: Profile allocation rate. If echo trail pruning creates GC pressure, switch to a ring buffer (fixed-size array with head/tail pointers) instead of `splice()`. `splice()` on arrays > 200 elements creates GC pressure.
- [ ] **Offscreen canvas for static layers**: Move grid (which is never drawn — confirmed) and any static elements to an offscreen canvas if needed.
- [ ] **Android WebView specific**: Test `willReadFrequently: true` on canvas context creation — can help on some Android WebView versions.
- [ ] Run Lighthouse on the production build URL. Target: Performance ≥ 90, Accessibility ≥ 80.
- [ ] Commit + push

### Files Modified
- `js/renderer.js` — vignette cache, shadowBlur replacement, quality tier checks
- `js/waves.js` — ring buffer if GC is an issue, pool cap
- `js/game.js` — quality tier state, adaptive logic
- `js/constants.js` — tuning constants for quality tiers
- `index.html` — canvas context `willReadFrequently`

### Acceptance Criteria
- [ ] 60fps stable on Samsung Galaxy A52 during full pulse burst (verify with DevTools USB debug)
- [ ] 60fps stable on low-end desktop (test with CPU throttling 4x in DevTools)
- [ ] No GC pause visible as long frame in performance trace during normal gameplay
- [ ] Lighthouse Performance score ≥ 90
- [ ] Adaptive quality correctly reduces cap and disables blur when FPS degrades

---

## Phase 24 — Save System + Achievements
**Status:** ⬜ Pending  
**Goal:** Level persistence, best-time tracking, and a lightweight achievement system using localStorage only.  
**Depends on:** Phase 20 complete (all 20 levels must exist before designing achievements)  
**Estimated effort:** 3–5 days  
**Risk:** Low

### Tasks
- [ ] Extend localStorage schema (established in Phase 15):
  ```javascript
  resonance_progress: number        // highest level reached (1–20)
  resonance_act1_complete: bool     // Level 10 completed
  resonance_act2_complete: bool     // Level 20 completed
  resonance_best_times: object      // { "1": 45200, "2": 67100, ... } ms per level
  resonance_achievements: string[]  // list of earned achievement IDs
  ```
- [ ] Add **level select screen**: accessible from title. Shows all 20 levels as a grid. Unlocked levels show best time. Locked levels show a lock icon. Click unlocked level → load it. `type: 'level-select'` screen state.
- [ ] Add best time recording: start timer on level load, stop on exit trigger, compare to stored best.
- [ ] Design 10 achievements:
  - `act1_complete` — "Darkness Survived" — Complete all Act I levels
  - `act2_complete` — "Into the Deep" — Complete all Act II levels  
  - `silent_runner` — "The Silent" — Complete Level 6 (Whisper) without triggering the patrol
  - `speedrun_1` — "Quick Echo" — Complete Level 1 in under 20 seconds
  - `no_pulse_1` — "Blind Faith" — Complete Level 1 without using the pulse
  - `water_survivor` — "Waterlogged" — Complete Level 7 without dying
  - `screamer_avoided` — "Muffled" — Complete Level 14 without triggering any Screamer
  - `stalker_proof` — "Ghost" — Complete Level 17 without the BlindStalker ever entering hunting state
  - `all_levels` — "Complete Darkness" — Complete all 20 levels
  - `first_death` — "It Heard You" — Die for the first time (tutorial completion)
- [ ] Achievement unlock: save to localStorage. Show a toast notification at bottom of screen (2.5s, smooth fade). Draw after HUD, before debug overlay.
- [ ] Add achievement gallery to pause menu (small icon grid; earned = full opacity, unearned = dim).
- [ ] Commit + push

### Files Modified
- `js/game.js` — timer tracking, achievement checks, level select loading
- `js/ui.js` — level select screen show/hide, achievement toast, achievement gallery
- `js/renderer.js` — achievement toast draw, level select grid render
- `index.html` — `#screen-levelselect`, `#achievement-toast` elements
- `css/style.css` — level select grid layout, toast animation, achievement icons

### Acceptance Criteria
- [ ] Level select screen shows all 20 levels; locked/unlocked state is correct
- [ ] Best times display next to completed levels
- [ ] All 10 achievements unlock correctly on first qualification (not re-trigger)
- [ ] Achievement toast appears for 2.5s and fades smoothly
- [ ] All save data persists across page refresh and app close/reopen
- [ ] `resonance_achievements` array never contains duplicate IDs

---

## Phase 25 — Google Play Store Submission
**Status:** ⬜ Pending  
**Goal:** Submit the Android app to Google Play and reach public availability.  
**Depends on:** Phases 21 and 24 complete  
**Estimated effort:** 3–5 days + 3–7 days Play review time  
**Risk:** Medium-High (Play review can reject for unexpected reasons)

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
