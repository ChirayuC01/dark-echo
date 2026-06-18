# DEVELOPMENT LOG — RESONANCE

> Append an entry after every completed phase. Most recent entry first.

---

## [Phase 15 — Complete] Vite Build Pipeline + localStorage Persistence

**Date:** 2026-06-18  
**Branch:** `claude/beautiful-fermat-5102bb`  
**Commit:** `45f729d`  
**Version:** v1.1.0

### What was done

Implemented Phase 15 in full: Vite build tooling, Cloudflare Pages CI/CD workflow, localStorage level progress persistence, Continue button on title screen, and deletion of the Wave/WaveManager backward-compat shims.

**New files:**
- `package.json` — Vite 8.0.16 dev dependency; `dev`/`build`/`preview` scripts
- `vite.config.js` — root `.`, outDir `dist`, target `es2020`, server on port 8080
- `package-lock.json` — lockfile; 0 vulnerabilities
- `.gitignore` — standard ignores including `android/` and `ios/` for Phase 21 prep
- `.github/workflows/deploy.yml` — build on push/PR; deploy to Cloudflare Pages on push to main

**Modified files:**
- `js/waves.js` — deleted `Wave` and `WaveManager` classes (TD-002 resolved)
- `index.html` — added `#continue-btn` above "New Game" button; renamed "Begin" → "New Game"
- `js/ui.js` — added `showContinueButton(levelNum)` and `hideContinueButton()`
- `js/game.js` — added `SAVE_KEY`, save on level complete, clear on win/restart, `'continue'` action handler, `refreshContinueButton()` helper called in `init()` and when returning to title
- `docs/CURRENT_STATUS.md` — Phase 15 marked complete; next task = Phase 16
- `docs/PRODUCTION_ROADMAP.md` — Phase 15 status → ✅ Complete
- `docs/IMPLEMENTATION_ROADMAP.md` — Phase 15 tasks marked `[x]`

### Verification

- `npm run build` passes cleanly: 47KB JS bundle, 82ms cold build, 0 vulnerabilities
- Grep confirmed no remaining `Wave` or `WaveManager` imports/references
- localStorage save/load logic guards against `NaN`, missing key, index 0 (don't show continue from Level 1), and index ≥ TOTAL (game complete)

### Manual steps remaining (user must do)

1. Log into [Cloudflare Pages dashboard](https://dash.cloudflare.com) and connect the `chirayuc01/dark-echo` repo
2. Set build command `npm run build`, output directory `dist`, Node version 20
3. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repo secrets

### Next phase

**Phase 16 — Wavefront Visual Upgrade**: replace starburst ray rendering with arc-fill grouped by `burstId`. Files to modify: `js/waves.js` (add `burstId` + `startTime` to `Ray.init()`), `js/renderer.js` (add `drawWavefront()` replacing individual ray tip rendering).

---

## [Production Audit — Complete] Full Project Audit + Production Roadmap

**Date:** 2026-06-18  
**Branch:** `claude/beautiful-fermat-5102bb`  
**Version:** v1.0.1 (documentation only — no game code changed)

### What was done

Performed a comprehensive audit of the v1.0.0 prototype across all dimensions (architecture, gameplay, audio, visuals, level design, mobile, performance) and produced a full commercial production roadmap for taking RESONANCE from a local prototype to a deployed browser game + Android app.

**New document created:**
- `docs/PRODUCTION_ROADMAP.md` — 11 phases (15–25) with complete task lists, file lists, acceptance criteria, effort estimates, risk ratings, and dependency chains.

**Existing documents updated:**
- `docs/CURRENT_STATUS.md` — Active phase set to Phase 15; production pending systems table; updated branch and run instructions.
- `docs/IMPLEMENTATION_ROADMAP.md` — Phases 15–25 appended as pending with quick-reference summaries.
- `docs/PROJECT_MASTER_SPEC.md` — Deployment targets added to identity table; Out of Scope revised; Sections 14–15 added (Production Scope + New Systems).
- `docs/KNOWN_ISSUES.md` — 8 new tech debt items (TD-007 through TD-014); Future Improvements table extended with 5 new items and target phases.
- `docs/CHANGELOG.md` — v1.0.1 entry added.
- `docs/DEVELOPMENT_LOG.md` — this entry.

### Key audit findings

**What is working well:**
- DDA ray propagation, echo trails, entity reveal — geometrically correct and performant
- 5 distinct enemy types with clear behavioral differences
- 10 levels with correct mechanic introduction curve
- Web Audio synthesis architecture (SOUND_CONFIG) is excellent and extensible
- Codebase is clean, modular, well-documented — zero circular dependencies

**Critical gaps vs Dark Echo (prioritized):**
1. **Silent enemies** (TD-011) — Dark Echo's enemies generate footstep sounds that propagate visually. Completely absent in RESONANCE. Phase 17 fixes this.
2. **No positional/binaural audio** (TD-012) — Sounds do not pan left/right based on source position. Phase 17 fixes this.
3. **Ray visual looks like starburst, not wavefront** (TD-014) — Pulse renders as spokes, not expanding ring. Phase 16 fixes this via arc-fill rendering grouped by burstId.
4. **No reverb** (TD-013) — Sounds feel disconnected from any physical space. Phase 18 fixes this via procedural ConvolverNode.
5. **No public deployment** — Game exists only locally. Phase 15 (Vite + Cloudflare Pages) fixes this.
6. **No Android app** — Phase 21 (Capacitor) fixes this.
7. **Content volume** — 10 levels vs Dark Echo's ~50. Phase 20 adds Act II (levels 11–20).

**What does NOT need to change:**
- DDA ray mechanics — these are correct and performant
- SOUND_CONFIG architecture — correctly extensible for all new sounds
- Module structure — no refactoring needed, only additive changes
- Level format — fully extensible for new mechanics

### Production roadmap summary

```
Phase 15 — Vite build + Cloudflare deploy + localStorage       3–5 days
Phase 16 — Wavefront visual upgrade (arc-fill renderer)        5–8 days
Phase 17 — Positional audio + enemy footstep rays              8–12 days
Phase 18 — Reverb + environmental sounds                       5–7 days
Phase 19 — Movement inertia + screen-shake + micro-polish      3–4 days
Phase 20 — Act II: 10 new levels + ScreamerEnemy               10–15 days
Phase 21 — Android app (Capacitor)                             5–8 days
Phase 22 — Website + landing page                              5–8 days
Phase 23 — Performance hardening (60fps mobile)                4–6 days
Phase 24 — Level select + achievements                         3–5 days
Phase 25 — Google Play Store submission                        3–5 + review
─────────────────────────────────────────────────────────────
Total:                                                         55–83 days
```

### Recommended entry point for next session

> Read `docs/CURRENT_STATUS.md` first, then `docs/PRODUCTION_ROADMAP.md` Phase 15.  
> Phase 15 is entirely standalone — no gameplay changes, only build tooling and deployment. Begin with `npm init -y && npm install --save-dev vite`.

### Decisions

- **Keep vanilla JS** — No migration to React, TypeScript, Phaser, or PixiJS warranted. The codebase is clean and capable. Vite adds a build step without changing the code.
- **Capacitor over PWA** — PWA on Android has audio latency issues in Web Audio. Capacitor wraps the existing web code in a WebView with native audio configuration.
- **Cloudflare Pages over Netlify/Vercel** — Best global CDN, most generous free tier, fastest for a static game.
- **No backend for v1.0** — localStorage handles all persistence. Supabase recommended only if leaderboards are added post-launch.
- **Phase 17 (enemy sounds) is the highest-impact gameplay change** — It is also the most complex. It should be implemented after Phase 15 (build pipeline) and Phase 16 (visual) to avoid shipping complexity before the foundation is solid.

---

## [Phase 14 — Complete] Final Polish & Balance

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`  
**Tag:** `v1.0.0`

### What was done

**`js/entities.js`**: Added `shape` field to all four enemy constructors:
- `PatrolEnemy`: `this.shape = 'patrol'`
- `ChaserEnemy`: `this.shape = 'chaser'`
- `BlindStalker`: `this.shape = 'stalker'`
- `Sentry`: `this.shape = 'sentry'`

**`js/renderer.js`** — two changes:

1. **Title screen rendering path**: Before the main `screen !== 'playing'` guard, added a branch for `screen === 'title'` that calls `drawEchoTrails` + `drawActiveRays` centered at `(W/2, H/2)` + `drawVignette()`. The rest of the draw function (player, enemies, grid, etc.) is skipped since none of that state exists on the title screen.

2. **`drawEnemies()` — shape-based differentiation (DC-004 resolved)**: Replaced the monolithic dot+arrow rendering with per-shape branches switched on `e.shape`:
   - `'patrol'`: filled arrowhead triangle pointing toward `e.waypoints[e.wpIdx]` + small center dot. Communicates directional predictability.
   - `'chaser'`: dot + concentric outer ring; ring uses `1 + 0.18 × sin(now/180)` pulse and `alpha × 0.80` when hunting vs `alpha × 0.22` idle. Communicates aggressive pursuit.
   - `'stalker'`: dot + 3 arcs at 120° spacing, radius growing and rotation speed doubling when hunting. Communicates omnidirectional sound detection.
   - `'sentry'` / default: plain dot (sentry is already distinguished by its rotating scan cone).
   - Outer glow radius and shadow remain shared across all types.

**`js/game.js`** — title screen demo pulse:
- Imported `W`, `H` from `constants.js`
- Added `titleRaySystem`, `titleCastFn`, `titlePulseTimer` to `G`
- `initTitleScreen()`: builds a 20×15 perimeter-wall grid (`CELL.WALL` on all edges, `CELL.EMPTY` inside); creates a `RaySystem` + `castFn` that uses this grid; sets `titlePulseTimer = 500` (half-second delay before first pulse)
- In `loop()`: when `screen === 'title'`, decrements `titlePulseTimer`; fires `G.titleRaySystem.burst(W/2, H/2, 'pulse', G.titleCastFn)` every 4 seconds; calls `G.titleRaySystem.update(dt, G.titleCastFn, timestamp)`
- `Renderer.draw()` call: uses `titleRaySystem.active/echoTrails` when `screen === 'title'`, regular `raySystem` otherwise
- `initTitleScreen()` called in `init()` (initial load) and `handleAction('title')` (return from game)

**`css/style.css`**: Added at end of file:
```css
@keyframes screenFadeIn { from { opacity: 0; } to { opacity: 1; } }
#screen-levelup.visible { animation: screenFadeIn 0.25s ease-out; }
```
The `@keyframes` animation fires each time `.visible` is added, creating a brief fade-in on level completion.

### Balance audit findings
- Level 9 crusher periods: 13.0s / 10.0s / 8.0s — already adjusted (DC-003 was from 5.0s era). Static analysis confirms safe crossing windows.
- Echo trail cap: enforced via `ECHO_TRAIL_CAP = 500` in `RaySystem.update()` since Phase 0. Debug overlay confirms count under cap.
- All 10 levels statically confirmed completable. No gameplay blockers found.

### Decisions
- Title pulse fires visually only — no `Audio.playPulse()` on title screen (would be jarring before player interaction).
- Title pulse uses perimeter-wall grid, not an empty grid, so rays bounce off canvas edges and create a full-screen echo pattern rather than just radiating outward.
- DC-004 shape vocabulary matches the spec from KNOWN_ISSUES.md exactly (proposed → implemented).

---

## [Phase 13 — Complete] Mobile Polish

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`css/style.css`**: Added `@media (max-width: 480px)` block after the existing `@media (max-width: 820px)` block.

**Geometry analysis at 375px viewport:**
- Canvas: `100vw × 75vw = 375 × 281px` (from existing `@media max-width:820px` rule)
- `#wrap`: same 375×281px
- All absolute-positioned elements use pixel values that don't scale — their proportional footprint grows significantly on small screens

**Bugs found and fixed:**

| Bug | Root cause | Fix |
|---|---|---|
| h1 "RESONANCE" clipped | 2.6rem + 0.22em letter-spacing → ~402px panel > 375px viewport | `font-size: 1.7rem; letter-spacing: 0.14em` → ~218px |
| Screen panels overflow | `padding: 44px 52px` (104px horizontal) + content | `padding: 28px 20px` + `max-width: calc(100vw - 16px)` |
| HUD behind joystick | HUD at bottom:14px; `#touch-controls` is later in DOM (renders above); joystick bottom at 20px overlaps HUD | `#hud { bottom: auto; top: 8px }` on mobile |
| Keyboard hint overflow + irrelevant | `<span class="hint">WASD / arrows...` ~300px wide | `#screen-title .hint { display: none }` on mobile |
| Controls too tall (60% canvas) | 110px joystick + 60px bottom = 170px from bottom = 60.5% of 281px | Joystick 90px + bottom 20px = 39%; pulse 56px; crouch 48px |

**Touch target audit after fixes:**
- Joystick: 90×90px ✓ (min: 44px)
- Pulse btn: 56×56px ✓
- Crouch btn: 48×48px ✓

### Design decisions

- **480px breakpoint** (not 375px): iPhone SE is 375px, but 480px catches all narrow portrait phones. The 820px breakpoint already handles medium phones; 480px handles the narrow edge case.
- **HUD to top**: On large screens (800×600), bottom-HUD is clean. On mobile where the game canvas is 281px tall and bottom is dominated by touch controls, top placement is the only position that's guaranteed unobscured.
- **Keyboard hint hidden, not shrunk**: Shrinking the font below 0.72rem produces illegible text. The keyboard hint is simply not relevant on touch — hiding it is cleaner than trying to make it fit.
- **Crouch button at 48px**: Technically just above the 44px minimum. Could go to 44px if needed, but 48px is more comfortable. The joystick's large zone (90px) already provides ample touch area for the most-used control.

---

## [Phase 12 — Complete] Audio Polish

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/audio.js`** — 3 changes:
1. `SOUND_CONFIG.footstep`: added `pitchVariation: 0.05`
2. `SOUND_CONFIG.footstepWater`: added `pitchVariation: 0.05`
3. `noiseNode()`: 2-line pitch variation logic before `filter.frequency.value` assignment:
   ```javascript
   const variation = cfg.pitchVariation ? (Math.random() * 2 - 1) * cfg.pitchVariation : 0;
   filter.frequency.value = cfg.filterFreq * (1 + variation);
   ```
4. `playFootstepSurface(surface)` dispatcher added between `playFootstepWater` and `playPulse`

**`js/game.js`** — footstep call simplified:
- Before: 3-line `if (G.playerInWater) { ... } else { ... }`
- After: `Audio.playFootstepSurface(G.playerInWater ? 'water' : 'normal');`

**Audit result**: all 12 `play*()` functions read exclusively from `SOUND_CONFIG`. The `osc()` helper receives all its parameters from the config objects. No hardcoded audio values remain.

### Design decisions

- **`pitchVariation` in SOUND_CONFIG, not hardcoded in `playFootstep()`**: This keeps variation configurable. Setting `pitchVariation: 0` or removing the field disables it for that sound. Other sounds (collapse, door, keyPickup) don't vary because they're one-shot events where consistency is expected.
- **`Math.random() * 2 - 1`** gives a uniform distribution over [−1, 1], so the cutoff varies uniformly between `filterFreq * 0.95` and `filterFreq * 1.05`. This is subtle enough not to be distracting but distinct enough to eliminate the robotic regularity of identical repeated sounds.
- **Dispatcher replaces callers**: `playFootstepSurface()` is the right long-term API. If a third surface type (e.g., metal grating) is added in the future, only the dispatcher needs updating — no changes needed in game.js.

---

## [Phase 11 — Complete] Debug Overlay

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/debug.js`** (new file):
- `_enabled` bool; `isEnabled()`, `toggle()`, `draw(ctx, state, fps)` exports
- `draw()` builds a string array of diagnostic lines, then renders a semi-transparent panel (306×variable px, top-left at 8,8) using `ctx.font = '12px monospace'`
- Lines: FPS, Screen, separator, Rays active, Echo trails (count / ECHO_TRAIL_CAP), Glints, separator, Player px+tile+crouch+water, separator, Entities list
- Entity type via `en.constructor.name.replace('Enemy', '')` — gives Patrol, Chaser, Sentry, Hazard, Crusher, BlindStalker
- Color rules: FPS line green/yellow/red by threshold; echo trails line orange when ≥85% cap; hunting/alert entity lines coral red; idle entity lines muted rose; all other lines pale blue-white

**`js/input.js`**:
- Added `let _debugToggle = false;` module-level var
- `keydown` handler: `if (e.code === 'Backquote') _debugToggle = true;`
- Exported `consumeDebugToggle()` — same consume pattern as consumePulse/consumePause

**`js/game.js`**:
- `G.fps = 60` added to initial state object
- Import: `import * as Debug from './debug.js';`
- In `loop()`: EMA update `if (dt > 0.001) G.fps = G.fps * 0.85 + (1 / dt) * 0.15;` (guard prevents division by near-zero dt)
- In `loop()`: `if (Input.consumeDebugToggle()) Debug.toggle();` — called every frame before pause check
- State spread to Renderer.draw() now includes `fps: G.fps`

**`js/renderer.js`**:
- Import: `import * as Debug from './debug.js';`
- End of `draw()`: `if (Debug.isEnabled()) Debug.draw(ctx, state, state.fps || 60);` — after `drawVignette()` so overlay renders above all game elements

### Design decisions

- **EMA for FPS**: Exponential moving average with α=0.15 gives smooth readout that tracks real performance without jitter. The `dt > 0.001` guard prevents the first frame (which can have a very small dt) from setting an unrealistically high FPS value.
- **Entity type via `constructor.name`**: Clean approach that requires no imports of entity classes into debug.js and automatically handles new entity types added in the future.
- **Drawn after vignette**: The debug panel is drawn last so the dark vignette doesn't dim it — it reads clearly even at canvas edges where the vignette is darkest.
- **No `shadowBlur` in debug**: Debug panel resets `ctx.shadowBlur = 0` at start of draw to prevent bleed from any game-element shadow settings still on the context.

---

## [Phase 10 — Complete] Ambient Audio Wiring

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/audio.js`**: No changes required — `startAmbient()`, `stopAmbient()`, and `SOUND_CONFIG.ambient` were already implemented from Phase 0:
- `_ambientNode` / `_ambientGain` module-level refs (null initially)
- `startAmbient()`: null guard → creates 55Hz sine oscillator → 1.5s linear fade-in to gain 0.035
- `stopAmbient()`: 0.5s linear fade-out → `nodeToStop.stop(now + 0.55)` → nulls both refs

**`js/game.js`**: 6 wiring additions:
- `die()`: `Audio.stopAmbient()` before `Audio.playDeath()` — drone fades out cleanly as death sound plays
- `checkExit()` win branch: `Audio.stopAmbient()` before `Audio.playLevelComplete()`
- `handleAction('start')`: `Audio.startAmbient()` after loadLevel + UI hide
- `handleAction('resume')`: `Audio.startAmbient()` — resumes drone after pause (null guard makes this a noop if already running, but drone is always stopped by die(), never by pause, so this is effectively always a real start)
- `handleAction('restart')` + `handleAction('restart-from-1')`: `Audio.startAmbient()` after loadLevel — restores drone following death
- `handleAction('next-level')`: `Audio.startAmbient()` — drone was not stopped between levels (level exit → levelup screen doesn't call stopAmbient), so this is a defensive noop; correct behavior either way
- `handleAction('title')`: `Audio.stopAmbient()` — ensures drone stops when returning to title screen from any state

### Design decisions

- **Level-to-level: drone stays running**: Normal level progression (reach exit → levelup screen → next level) does NOT call `stopAmbient()`. The continuous tension drone should persist through the level transition sequence. `startAmbient()` in `'next-level'` is a safety noop via null guard.
- **Death: stop before death sound**: `stopAmbient()` is called before `playDeath()` in `die()`, not after. Both are fire-and-forget; the 0.5s fade-out of the drone overlaps the start of the death sound, creating a smooth transition rather than an abrupt cut.
- **Title return**: Added `stopAmbient()` to `'title'` case even though the spec only mentioned death and win — it would be jarring to hear the gameplay drone on the silent title screen.

---

## [Phase 9 — Complete] Level Audit + Trigger Bug Fix + Entity Differentiation Design

**Date:** 2026-06-17  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/levels.js`**: Fixed critical Level 9 trigger bug:
- Trigger was at `{ col: 3, row: 9 }` — player never reaches col 3 in normal gameplay
- Player enters row 9 at col 14 (gap in row 8 wall) and exits at col 6 (gap in row 10 wall); col 3 is left of the exit
- Fixed to `{ col: 10, row: 9 }` — col 10 is mid-path between col 14 entry and col 6 exit
- Without this fix, the wall at row 13 col 16 is never removed and the exit is permanently blocked

**`docs/KNOWN_ISSUES.md`**: Added DC-004 — entity visual differentiation:
- Documents that PatrolEnemy, ChaserEnemy, and BlindStalker all render as identical muted-red dots
- Proposes shape vocabulary: triangle (patrol), circle+ring (chaser), dot+arcs (stalker)
- Deferred to Phase 14

**`docs/PROJECT_MASTER_SPEC.md`**: Section 3 updated with enemy shape vocabulary table for future implementation

### Level audit results

All 10 levels traced for solvability:
- **Levels 1–5**: Original prototype levels — no issues
- **Level 6 (The Whisper)**: Patrol at row 7 fully traversable via crouch; exits at col 1/18 both reachable
- **Level 7 (Flooded)**: Water rows 6–8 crossable; hazards at col 5/14 patrol inner water, dry path at col 9 forces inside; both hazard locations avoid blocking the path
- **Level 8 (The Collapse)**: Key at col 16 row 3 reachable from start; collapsible at col 9 rows 6 and 8 block downward path until pulsed; door at col 9 row 9 opens on key pickup — confirmed flow works
- **Level 9 (The Corridor)**: ⚠️ **Trigger bug fixed** (see above). After fix: trigger at col 10 row 9 fires mid-traversal; wall at 13,16 removed; sentry at col 12 row 13 has timed gaps; exit at col 18 row 13 reachable
- **Level 10 (The Gauntlet II)**: Forced pulse to destroy col 5 row 5 alerts BlindStalker; key at col 2 row 7 reachable via col 4 gap in row 6; door at col 10 row 10 opens after key; crusher at col 10 row 11 (period 5.5s); sentry at col 14 row 13 has timed gaps; exit at col 18 row 13

### Design decisions

- **Trigger relocation rationale**: Level 9 hint says "Find the switch" — the switch must be findable via natural traversal. The S-path through corridors goes Entry(col 14) → row 9 crossing → Exit(col 6). Col 10 sits naturally in the middle of that crossing and fires without requiring any detour.
- **DC-004 deferred correctly**: Visual differentiation is a UX improvement that requires no gameplay logic change — only renderer shapes. Phase 14 is the right time for polish after all systems are in.

---

## [Phase 8 — Complete] BlindStalker Enemy + Level 10

**Date:** 2026-06-16  
**Commit:** `fe11f7d`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/constants.js`**: Added 3 BlindStalker constants:
- `BLIND_STALKER_SPEED_IDLE = 30` (px/s — slightly slower wander than ChaserEnemy's 35)
- `BLIND_STALKER_SPEED_HUNT = 104` (px/s — CHASER_SPEED_HUNT × 1.3)
- `BLIND_STALKER_HUNT_DURATION = 4` (seconds — shorter window than ChaserEnemy's 6s)

**`js/entities.js`**: Added `BlindStalker` class between `Sentry` and `Hazard`:
- Identical state machine to `ChaserEnemy` (`idle` wander → `hunting` → back to `idle`)
- `hearSound(sourceX, sourceY)`: sets `state = 'hunting'`, `huntTimer = 4` — same signature as ChaserEnemy
- `update(dt, grid)`: uses `BLIND_STALKER_SPEED_HUNT` and `BLIND_STALKER_SPEED_IDLE` instead of CHASER constants
- No `onPulseHit()` — BlindStalker is not stunned by pulse (unlike PatrolEnemy/Sentry)
- Import line extended with 3 new constants

**`js/game.js`**:
- Import extended: `BlindStalker` added from `'./entities.js'`
- `loadLevel()`: `type:'stalker'` → `new BlindStalker(ex, ey)`; added to `G.enemies[]`
- `processRayEntities()`: `instanceof BlindStalker` branch placed BEFORE `instanceof ChaserEnemy` check; calls `en.hearSound(ray.burstX, ray.burstY)` without `!ray.quiet` guard — responds to crouched steps too; runs inside the existing `if (ray.type === 'pulse' || (ray.type === 'step' && isStepLevel))` guard so hazard rays don't trigger it

**`js/levels.js`**: Level 10 "The Gauntlet II" added:
- Grid: water zone in row 3 (cols 2–8, 10–17) with dry corridors at col 9 and col 18
- Row 4/2 gaps align with col 9 and col 18 to create a dry path through the water section
- Collapsible wall at col 5 row 5 — must be pulsed to access left side of row 5/7
- Key at col 2 row 7 (behind collapsible); door at col 10 row 10 (chokepoint to lower section)
- BlindStalker starts col 15 row 5 — hears the required pulse at ~400px, ~3.8s travel time
- Two hazards at col 5 and col 13 in water row (bracket the dry col 9 path)
- Step-aware patrol sweeps row 9 (cols 3–16 waypoints)
- Crusher at col 10 row 11, horizontal range 3 tiles, period 5.5s
- Sentry at col 14 row 13, angle π (faces left), guards exit at col 18

### Design decisions

- **No pulse-stun for BlindStalker**: The mechanic is about sound awareness, not visual threat. Pulsing to stun would be counterproductive — the pulse itself is what alerts it. The only counter is stillness.
- **Hearing all step rays (incl. quiet)**: This is the key differentiator from ChaserEnemy. `ray.quiet = true` (set when crouching) normally prevents re-alerting a ChaserEnemy. BlindStalker ignores this. The player cannot silently crouch-walk past a BlindStalker — only complete stillness works.
- **Hazard rays excluded**: BlindStalker hearing runs inside the `ray.type === 'pulse' || 'step'` guard. Hazard rays do not trigger it. Otherwise the stalker would perpetually home toward hazard locations.
- **Level 10 key mechanic creates forced noise**: The collapsible wall at col 5 row 5 is the only path to the key. Pulsing it is mandatory. The stalker starts ~400px away (3.8s at hunt speed). Player must: pulse → rush 3 tiles left to key → escape south through row 8 col 1 → before stalker closes. A tight but learnable sequence.
- **`instanceof BlindStalker` before `instanceof ChaserEnemy`**: Both inherit nothing (plain classes), but placing BlindStalker first avoids any ambiguity. `instanceof` checks are O(1) and the order is purely defensive.

---

## [Phase 7 — Complete] Sentry Enemy + Trigger Visibility Fix

**Date:** 2026-06-16  
**Commit:** `d1c00f5`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/constants.js`**: Added 4 sentry constants:
- `SENTRY_SCAN_RANGE = 180` (px — cone depth)
- `SENTRY_SCAN_ARC = Math.PI / 2` (90° total, ±45°)
- `SENTRY_SCAN_SPEED = Math.PI / 3` (60°/s rotation)
- `SENTRY_HUNT_DURATION = 8` (seconds in alert/pursuit state)

**`js/entities.js`**: Added `Sentry` class:
- Constructor stores `scanRange` and `scanArc` as instance fields — renderer reads these to detect Sentry type without needing instanceof or imports
- State machine: `'idle'` (rotate + check LOS) → `'alert'` (pursue player, 8s timer) → `'stunned'` (0.6s, then idle)
- `update(dt, grid, castFn, player)` returns `true` exactly once on the frame the player is first spotted, so game.js can play the alert sound
- LOS check: normalize direction to player, cast ray via `castFn(sx, sy, nx, ny, d-PLAYER_RADIUS)`; null result = no wall = player visible
- Cone check: `Math.abs(angleDiff) < scanArc/2` (i.e., within ±45° of current facing)
- Pursuit movement: identical to ChaserEnemy — `resolveWalls` based movement toward player
- `onPulseHit()`: immediately sets state to stunned (even if alert)

**`js/game.js`**:
- Import extended: `Sentry` added from `'./entities.js'`
- `loadLevel()`: `type:'sentry'` → `new Sentry(ex, ey, e.angle ?? 0)`; added to `G.enemies[]` (same kill-check loop as other enemies)
- Enemy update loop: `instanceof Sentry` branch passes `G.castFn` and `G.player` to `update()`; calls `Audio.playSentryAlert()` on `true` return
- `processRayEntities()`: `instanceof Sentry` branch calls `en.onPulseHit()` on pulse ray hit (no sound hearing — Sentry is vision-only)

**`js/audio.js`**: `playSentryAlert()` and `SOUND_CONFIG.sentryAlert` were already implemented in a prior session. No changes needed.

**`js/renderer.js`** — two changes:
1. **Sentry cone**: `drawEnemies()` checks `e.scanRange !== undefined` → draws cone arc (canvas path: moveTo center, arc spanning `e.angle ± e.scanArc/2`, closePath); faint orange `rgba(220,100,50,α×0.14)` in idle, brighter red `rgba(255,55,35,α×0.30)` in alert; thin stroke outline for clarity; drawn BEFORE the enemy dot so dot appears on top
2. **Alert state color**: `const hunting = e.state === 'hunting' || e.state === 'alert'` — Sentry in alert now uses the same bright red glow as ChaserEnemy in hunting mode
3. **Trigger visibility fix**: `drawTriggers()` redesigned — larger glow radius (28px), wider pulse beat (0.35–0.80 amplitude vs old 0.50–0.75), pulsing outer ring stroke, slow-rotating 4-spoke cross indicator (spokes 5–11px from center, rotate at now/4000 rad/ms), brighter center dot (4.5px)

**`js/levels.js`**: Level 9 extended:
- `{ type:'sentry', col:12, row:13, angle:Math.PI }` added to enemies array
- Sentry faces LEFT initially (away from where player arrives at col 14)
- Cone rotates clockwise; danger window (cone pointing east ±45°) = 1.5s; safe window = 4.5s per cycle
- Player sprints 4 tiles (160px) in ~1.07s at PLAYER_SPEED=150 — comfortably fits in safe window once timed
- Hint updated: "Find the switch · Time the crushers · Dodge the sentry at the exit"

### Design decisions

- **`instanceof Sentry` in game.js update loop**: Cleanest approach to pass extra parameters (castFn, player) without changing the base enemy interface. PatrolEnemy and ChaserEnemy's `update(dt, grid)` signature is unchanged.
- **Return value for alert signal**: `update()` returns `true` on the spot frame rather than using a callback or event. Matches the existing `Hazard.update()` pattern (returns pulse event object or null). Single-responsibility: the Sentry manages its own state, game.js handles the audio side effect.
- **`scanRange`/`scanArc` as instance fields**: The renderer detects Sentry type via `e.scanRange !== undefined` without needing to import `Sentry` or `instanceof`. Keeps renderer.js decoupled from entity types.
- **Sentry at col 12 row 13**: Player enters row 13 at col 14 after final crusher. The sentry is 2 tiles LEFT (80px). Player goes RIGHT to exit at col 18. The sentry's cone sweeping rightward is the only danger — clear mechanical puzzle with learnable timing.
- **Trigger cross indicator**: A rotating 4-spoke indicator distinguishes the trigger from other dots (key=gold, exit=green, door=amber). The slow rotation (one full turn ~25s) communicates "switch/interactive" better than a static dot.

---

## [Phase 6 — Complete] Switches / Triggers

**Date:** 2026-06-16  
**Commit:** `fe82322`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/game.js`**:
- `G.triggers: []` added to state object; reset in `loadLevel()`
- `loadLevel()` iterates `def.triggers[]` to build trigger objects: `{col, row, x, y, action, targetId, fired: false, revealedAt: -Infinity}`
- `processRayEntities()`: new trigger reveal loop — `segPtDist(tr.x, tr.y, sx, sy, tx, ty) < REVEAL_D` → `tr.revealedAt = now` (skips `fired` triggers)
- `fireTrigger(tr)` function: `'open_door'` reuses the key-pickup door-open logic (get door from `G.doors`, set `CELL.EMPTY`, remove `doorsByCell` entry, play audio); `'remove_wall'` parses `targetId` as `"row,col"` and sets `G.grid[r][c] = CELL.EMPTY`
- `update()`: trigger proximity loop after key pickup — `dist(player, trigger) < 10px` → `tr.fired = true` → `fireTrigger(tr)` (single-frame one-shot; fired flag prevents re-trigger)

**`js/renderer.js`**:
- `draw()` destructures `triggers` from state; calls `drawTriggers(triggers, now, px, py)` after `drawKeys`
- `drawTriggers()`: bright blue-white `rgba(100,160,255)` pulsing radial gradient dot (16px radius), 3px solid center `rgba(160,210,255)`, `shadowBlur 14 * alpha`; uses `revealAlpha × hearing` attenuation; `sin(now/350)` pulse period differs from key (400ms) and exit (500ms) for distinct visual rhythm; renders nothing for fired triggers

**`js/levels.js`**: Level 9 "The Corridor" extended:
- Row 13 col 16 changed from `0` to `1` — creates a wall blocking the final exit sprint
- `triggers: [{ col: 3, row: 9, action: 'remove_wall', targetId: '13,16' }]` added
- Trigger fires naturally in player flow: after crossing corridor 2 (row 7 via col 14 gap in row 8), player enters row 9 connecting zone and walks LEFT toward col 6 (next corridor entry); passes col 3 during this traversal → trigger fires → exit wall removed
- Hint updated: "A switch unlocks the exit · Watch for the crusher · Wait, then dash"

### Design decisions

- **10px proximity radius**: Tight enough that the player must deliberately walk through the trigger tile (not just pass nearby). At `TILE = 40px`, the trigger center is always ≥ 20px from tile edges — a 10px radius means the player must reach the center area. Natural for left-to-right traversal of a row.
- **Trigger reveals itself via sound**: Same `segPtDist` reveal pattern as keys/exit/doors. No special handling needed — players learn to pulse-reveal before approaching, consistent with the game's sound-is-vision pillar.
- **Level 9 switch placement at row 9, col 3**: The player MUST cross row 9 walking from the right (col 14 area) to the left (col 6 entry) as part of the normal level flow. Col 3 is reached during this walk — the trigger fires at a natural moment, never requiring a detour.
- **Wall at row 13 col 16**: After crossing all three corridors, the player exits through col 14 gap in row 12 and arrives in row 13 around col 14. The wall at col 16 blocks the sprint to exit col 18. Since the trigger already fired in row 9, the wall is already gone — smooth experience if played in order. If the player somehow skips row 9 (impossible in normal flow), they would encounter the blocked exit and need to backtrack.
- **`'spawn_enemy'` action not implemented**: No level in Phase 6 uses it; left as a no-op stub for a future phase if needed. Not worth implementing without a use case.

---

## [Phase 5 — Complete] Doors & Keys

**Date:** 2026-06-12  
**Commit:** `d1e4e23`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/constants.js`**: Added `KEY_PICKUP_RADIUS = 12` (player must walk within 12px of key center to collect).

**`js/game.js`**:
- `G` state extended with `G.doors: new Map()`, `G.keys: new Map()`, `G.doorsByCell: new Map()`
- `loadLevel()` resets all three maps; iterates `def.doors[]` to build door objects and set `G.grid[row][col] = CELL.WALL` (closed door becomes a real wall in the mutable grid copy); iterates `def.keys[]` to build key objects
- Implementation decision: closed doors are written into the grid as `CELL.WALL`, so existing `castRay` DDA and `resolveWalls` block them automatically — no new `castRayDoors` function needed. `G.doorsByCell` keyed `"row,col"` allows `applyWallHits` to identify door hits without a separate ray function
- `applyWallHits()`: checks `G.doorsByCell.get("${h.row},${h.col}")` — if door hit, updates `revealedAt`, stores `cellType: 'door'`
- `processRayEntities()`: key reveal loop (skips collected keys), door reveal loop — both use `segPtDist` with `REVEAL_D = 28px`
- `update()`: key pickup loop — `dist(player, key) < KEY_PICKUP_RADIUS` → mark collected, `Audio.playKeyPickup()`, open matching door: `grid[row][col] = CELL.EMPTY`, `G.doorsByCell.delete(...)`, `Audio.playDoorOpen()`

**`js/renderer.js`**:
- `draw()` destructures `doors` and `keys` from state
- `drawDoors(doors, now, px, py)`: amber `rgba(210,160,50)` fill + stroke when locked (with glow), faint green `rgba(80,210,120)` when open; uses `revealAlpha × hearing` attenuation
- `drawKeys(keys, now, px, py)`: gold `rgba(255,210,80)` pulsing dot with radial gradient (`sin(now/400)` pulse), same fade pattern as exit; skips collected keys
- `drawImpacts()`: new `'door'` branch uses amber color `rgba(210,160,50)` for door-hit glints
- Draw order: doors and keys rendered between collapsible reveals and crushers

**`js/levels.js`**: Level 8 "The Collapse" redesigned to incorporate key/door:
- Row 9 is now all walls (`1`) except col 9 (`0`, the door position) — only passage from middle zone to lower section
- Key at col 16, row 3 (reachable from eastern corridor at col 18; near the chaser at col 14)
- Door at col 9, row 9 — loaded as `CELL.WALL` until key collected
- Lower section simplified: row 10 wide open, row 11 corridor (gaps at cols 1 and 18 only), row 12 wide open, row 13 exit at col 18
- Updated hint: "Find the key · Shatter the walls · The door will open"
- No changes to `audio.js` — `playKeyPickup()` and `playDoorOpen()` were already implemented in Phase 0 via `SOUND_CONFIG`

### Design decisions

- **Grid mutation for closed doors**: Writing `CELL.WALL` into the grid when a door loads means no change to `castRay` or `resolveWalls` — they already handle walls correctly. When the door opens, `CELL.EMPTY` is written back. `G.doorsByCell` is the lookup that identifies which wall hits are door hits (for visual differentiation and `revealedAt` tracking). This is simpler than a separate `castRayDoors` slab function.
- **Level 8 redesign**: The original lower section had too many bypass paths to create a true door chokepoint. Making row 9 all-walls except the door cell creates an absolute chokepoint — the player cannot reach the lower section without having the key. The key is placed near the chaser in the upper section, combining the crouch mechanic (avoid detection while retrieving it) with the new key/door mechanic.
- **Key proximity pickup**: 12px radius is intentionally tight — smaller than the player's footstep radius, so the player must walk toward the key, not just run past it.
- **Open door visual**: The faint green (`rgba(80,210,120)`) for open doors reuses the exit color palette, subconsciously signaling "this is now passable." The reveal fades naturally via `revealAlpha` — no special open-door fade timer needed.

---

## [Phase 4 — Complete] Crushers

**Date:** 2026-06-12  
**Commit:** `03303ff`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/entities.js`**: Added `Crusher` class. Constructor takes `(x, y, axis, range, period)` where `range` is in tiles (converted to px on construction). `elapsed` starts at `Math.random() * period` for random phase so crushers in the same level don't all sync up. `update(dt)` advances elapsed, computes `sin` offset, moves `this.x` or `this.y` along the given axis. `bounds()` returns `{x1,y1,x2,y2}` TILE-sized AABB centered on current position.

**`js/collision.js`**: Added two new exports:
- `castRayCrushers(crushers, ox, oy, dx, dy, maxDist)` — AABB slab method, loops over crusher list, returns closest hit with `{ x,y,t,nx,ny,col:-1,row:-1,crusher:c }`. The `col:-1, row:-1` sentinel ensures `applyWallHits` won't misidentify it as a grid cell.
- `circleOverlapsAABB(cx, cy, cr, x1, y1, x2, y2)` — nearest-point circle vs AABB; used for player kill check.

**`js/game.js`**:
- Imports extended: `castRayCrushers`, `circleOverlapsAABB` from collision; `Crusher` from entities
- `G.crushers: []` added to state object; reset in `loadLevel()`
- Crusher spawn in `loadLevel()` enemy loop: `type: 'crusher'` → `new Crusher(ex, ey, e.axis, e.range, e.period)`
- `castFn` updated: calls both `castRay` (grid) and `castRayCrushers` (crushers), picks whichever has smaller `t`
- `applyWallHits()`: detects `isCrusher = !!h.crusher`; if true, sets `h.crusher.revealedAt = now` and marks impact `cellType: 'crusher'`
- `processRayEntities()`: new inner loop over `G.crushers` using `segPtDist` for proximity-based reveal (same `REVEAL_D = 28px` threshold)
- `checkDeath()`: new loop over `G.crushers`; `circleOverlapsAABB(p.x, p.y, PLAYER_RADIUS, b.x1, b.y1, b.x2, b.y2)` → `die('Crushed.')`
- `update()`: `for (const cr of G.crushers) cr.update(dt)` — crushers advance each frame

**`js/renderer.js`**:
- `draw()` destructures `crushers` from state
- `drawCrushers(crushers, now, px, py)` called after `drawExit` and before `drawHazards`
- `drawCrushers`: orange `rgba(230,105,55)` fill + stroke per crusher, `revealAlpha` + `hearing` attenuation, `shadowBlur` glow
- `drawImpacts()`: added `cellType === 'crusher'` branch (orange, same palette as hazard/crusher) before `'collapsible'` check

**`js/levels.js`**: Level 9 "The Corridor" — S-shaped zigzag path through 3 open corridors (rows 3, 5, 7) connected by single-tile gaps at alternating ends (col 18 / col 1). Three crushers with periods 5.0s / 3.5s / 2.5s sweep horizontally through each corridor. Lower maze (rows 9–13) leads to exit col 18 row 13.

### Design decisions

- Random `elapsed` start phase: avoids all crushers being at the same position when the level loads. Each crusher behaves independently from the start.
- `col:-1, row:-1` in crusher hit result: sentinel that prevents `applyWallHits` from reading `G.grid[-1]?.[-1]` (undefined → not collapsible), so crusher hits never accidentally trigger collapse logic.
- Dual reveal system: proximity reveal (rays passing near crusher) + direct hit reveal (rays bouncing off crusher). Proximity ensures the player detects approaching crushers even if no ray hits them directly.
- Death reason 'Crushed.' — distinct from 'Caught.' (enemy) and 'Disintegrated.' (hazard).
- Visual palette: crushers use orange `rgba(230,105,55)` matching hazard rays — both are lethal; color consistency telegraphs danger.
- Level 9 difficulty scaling: corridor 1 (5s period = slow), corridor 2 (3.5s = medium), corridor 3 (2.5s = fast) — player learns timing before it becomes critical.

---

## [Phase 3 — Complete] Collapsible Walls

**Date:** 2026-06-12  
**Commit:** `e9be4d4`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/collision.js`**: Imported `CELL`. In `castRay`, changed the wall check from `=== 1` to `=== CELL.WALL || === CELL.COLLAPSIBLE` so collapsible cells block rays. In `resolveWalls`, changed `!== 1` guard to exclude both `CELL.WALL` and `CELL.COLLAPSIBLE` so the player cannot walk through them.

**`js/game.js`**:
- Imported `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS` from constants
- `applyWallHits()` checks `G.grid[h.row]?.[h.col] === CELL.COLLAPSIBLE` *before* recording impact (reads cell type before mutation); stores `cellType: 'collapsible'` on the impact object for renderer
- If collapsible + pulse + energy > 0.3: mutates `G.grid[row][col] = CELL.EMPTY`; fires 12-ray burst at hit point (80px maxDist) for glint effect; calls `Audio.playCollapse()`

**`js/renderer.js`**: `drawImpacts()` checks `im.cellType === 'collapsible'` first; uses warm tan `rgba(200,175,120,α)` so collapsible walls are visually distinct from regular walls before and as they are destroyed.

**`js/levels.js`**: Level 8 "The Collapse" — symmetric maze upper + lower, split by two full-row horizontal barriers (rows 6 and 8) each with a single collapsible wall at col 9. Patrol guards middle zone (row 7, col 1–17). Chaser in upper section (col 14, row 3). Two pulses required to break through; enemy pressure punishes hasty pulsing.

**`js/audio.js`**: `playCollapse()` was already implemented in Phase 0. No changes needed.

### Design decisions

- `cellType` field is added to impact objects so only the renderer needs to know about collapsible cell color — `applyWallHits` reads `G.grid` before mutation to capture the correct type.
- Collapse only triggers on `type === 'pulse'` hits — step rays and hazard rays (lower energy) cannot destroy walls. This is intentional: the player must explicitly use the loud pulse, accepting the risk.
- Collapse burst uses 80px `maxDistOverride` — short starburst pattern that reveals the newly opened gap without flooding the screen with geometry.
- Level 8 uses two barriers so the player experiences the mechanic twice: first to learn (row 6), second under enemy pressure (row 8, with patrol already active).

---

## [Phase 2 — Complete] Water Zones

**Date:** 2026-06-11  
**Commit:** `e65bf1b`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/entities.js`**: `Player.move()` gains 6th param `inWater = false`; sets `this.inWater`; speed is `PLAYER_SPEED * (crouching ? CROUCH_SPEED_MULT : 1) * (inWater ? WATER_SPEED_MULT : 1)`. Import line extended to include `WATER_SPEED_MULT`.

**`js/game.js`**:
- `G.playerInWater: false` added to state object
- Imports extended: `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`
- `update()`: tile under player detected before `player.move()` (`Math.floor(player.x / TILE)`, same for row); `G.playerInWater = G.grid[row]?.[col] === CELL.WATER`
- `player.move()` now passes `G.playerInWater` as 6th arg
- Step interval: `STEP_INTERVAL * (crouching ? CROUCH_INTERVAL_MULT : 1) * (G.playerInWater ? WATER_INTERVAL_MULT : 1)` — multipliers stack
- Ray count: `ceil(RAY_COUNT_STEP * crouchMult * waterMult)`, capped at 64
- Plays `Audio.playFootstepWater()` when in water, `Audio.playFootstep()` otherwise

**`js/renderer.js`**: Added `drawWaterZone(player)` — `createRadialGradient` teal wash (0 → 80px radius, `rgba(50,150,160,0.08)` → transparent). Called in `draw()` before `drawPlayer()` only when `state.playerInWater`.

**`js/levels.js`**: Level 7 "Flooded" — 20×15 grid; rows 6–8 cols 2–17 are `CELL.WATER = 5`; walls at cols 0, 1, 18, 19 of water rows force the player to cross entirely through water; two hazards at cols 5 and 14 in row 7.

### Design decisions

- Water detection uses the player's position BEFORE move() is called — 1 frame "late" on entry/exit but imperceptible at water-zone crossing speeds.
- Ray count cap at 64 prevents extreme bursts when crouching in water (0.5 × 1.6 = 0.8 × default; normal in water = 1.6 × default = ~35 rays, within budget).
- Level 7 forces water crossing at cols 2–17 (walls at cols 0, 1, 18, 19) so the player cannot simply run along the edges.
- Hazards placed at cols 5 and 14 (row 7) to bracket the crossing without making it impassable — player path at cols 9–10 is equidistant from both.

---

## [Phase 1 — Complete] Crouch / Stealth Mechanic

**Date:** 2026-06-11  
**Commit:** `3933d22`  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done

**`js/input.js`**: Added `_crouching` state; `isCrouching()` export; Shift/C keydown/keyup tracking; `#crouch-btn` touch event handlers (touchstart/touchend/touchcancel).

**`js/entities.js`**: `Player.move()` now accepts 5th param `crouching = false`; adjusts speed by `CROUCH_SPEED_MULT`. `PatrolEnemy` gains `stepAware` field, `alertTimer`/`alertTarget`, and `hearStep(srcX, srcY)` method that sets a 3.5s investigation mode. Investigation state takes priority over normal waypoint patrol.

**`js/waves.js`**: `RaySystem.burst()` accepts optional `countOverride` and `maxDistOverride` (nullish coalescing with existing defaults). Needed to emit fewer/shorter rays when crouching without adding a new method.

**`js/game.js`**: 
- Imports `RAY_COUNT_STEP`, `STEP_RAY_MAX`, and three CROUCH_* constants
- `update()` reads `Input.isCrouching()`; passes flag to `player.move()`
- Step burst: if crouching, emits `ceil(22 × 0.5) = 11` rays at `170 × 0.7 = 119px` max dist; step interval × 2.5
- `PatrolEnemy` step-hearing in `processRayEntities()`: only triggers `hearStep()` if `en.stepAware === true`
- `loadLevel()` now deep-copies grid with `def.grid.map(row => [...row])` — preparation for Phase 3 collapsibles
- `updateHUD()` call passes `crouching` boolean as 5th arg

**`js/renderer.js`**: `updateHUD()` signature gains `crouching = false`; toggles `.active` class on `#crouch-indicator`.

**`index.html`**: Added `#crouch-btn` button inside `#touch-controls`; added `#crouch-indicator` span in `#hud`.

**`css/style.css`**: `#crouch-btn` styled as 56px circle, bottom-center; `#crouch-indicator` dim by default, brightens to `rgba(200,220,255,0.7)` when `.active`.

**`js/levels.js`**: Level 6 "The Whisper" — 20×15 grid with symmetric upper/lower mazes connected by a fully open patrol corridor at row 7. Walls at rows 6 and 8 have only two crossing gaps (col 1 and col 18). `stepAware: true` patrol patrols col 2–17. Normal steps (170px) reach patrol from within the corridor; crouched steps (119px) do not at the patrol's waypoint extremes.

### Design decisions

- `stepAware` flag on individual `PatrolEnemy` instances (not level-wide flag) allows granular control — future levels can mix step-aware and step-deaf patrols.
- Level 6 crossing design: player must enter the patrol corridor through one of two narrow gaps; the patrol always passes within hearing range of normal steps but the crouched step range (119px) creates a safe zone when the patrol is 3+ columns away.

---

## [Phase 0 — Complete] Cleanup & Foundation

**Date:** 2026-06-11  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was done
- Created `/docs/` directory with all 6 documentation files (this session).
- `js/constants.js` cleaned up:
  - Removed unused legacy wave constants: `STEP_WAVE_MAX`, `STEP_WAVE_SPEED`, `STEP_WAVE_ALPHA`, `PULSE_WAVE_MAX`, `PULSE_WAVE_SPEED`, `PULSE_WAVE_ALPHA`, `WAVE_RING_W`, `HAZARD_PULSE_MAX`, `HAZARD_PULSE_SPEED`
  - Added new cell type constants: `CELL.COLLAPSIBLE = 4`, `CELL.WATER = 5`
  - Added crouch mechanic constants: `CROUCH_SPEED_MULT`, `CROUCH_INTERVAL_MULT`, `CROUCH_RAY_MULT`, `CROUCH_DIST_MULT`
  - Added water zone constants: `WATER_SPEED_MULT`, `WATER_INTERVAL_MULT`, `WATER_RAY_MULT`, `WATER_ENERGY_DRAIN`
  - Added collapse constants: `COLLAPSE_ENERGY_THRESHOLD`, `COLLAPSE_BURST_RAYS`
  - Added `ECHO_TRAIL_CAP = 500`

### Pending (still in Phase 0)
- `audio.js` SOUND_CONFIG — not yet added
- `waves.js` ECHO_TRAIL_CAP enforcement — not yet added
- Final commit + push

---

## [Pre-Phase 0] Prototype Complete (Prior Session)

**Date:** ~2026-06-10  
**Branch:** `claude/sound-vision-game-7pvbo1`

### What was built
Full working prototype from scratch:
- `index.html` — game shell, canvas, 5 overlay screens, HUD, touch controls
- `css/style.css` — responsive layout, 800×600 centered, mobile scaling
- `js/constants.js` — all game parameters
- `js/utils.js` — dist, normalize, clamp, lerp, tileCenter, segPtDist
- `js/audio.js` — Web Audio procedural synthesis (6 sound functions)
- `js/input.js` — keyboard (WASD/arrows/Space/Esc/P) + touch joystick
- `js/entities.js` — Player, PatrolEnemy, ChaserEnemy, Hazard
- `js/waves.js` — Ray class (DDA), RaySystem (burst, update, pool, echoTrails)
- `js/collision.js` — castRay (DDA grid traversal), resolveWalls, circlesOverlap
- `js/levels.js` — 5 hand-crafted levels (20×15 grids)
- `js/game.js` — G state machine, loadLevel, update, game loop, UI handlers
- `js/renderer.js` — draw pipeline, hearing attenuation, all visual elements
- `js/ui.js` — screen show/hide, hint/message setters

### Key design decisions made
- Replaced circular wave system with DDA ray-based propagation (physically plausible reflections)
- Walls are NEVER drawn — only ray impact glints reveal geometry
- Exit hidden until player ray passes within 28px (`revealedAt` guard)
- Ray speed slowed (340 → 160 px/s), trail persistence extended (1600 → 4200ms)
- Distance attenuation via `hearing(d)` smoothstep applied to ALL visual elements
- Per-segment distance calculation via `segPtDist` for hearing falloff

### Known issues at prototype completion
- echoTrails had no hard cap (just time-based pruning) — addressed in Phase 0
- Several legacy constants from old wave system cluttered constants.js — cleaned in Phase 0
- No crouch, water, collapsibles, crushers, doors, keys, sentries, or blind stalkers
- Only 5 of planned 10 levels
