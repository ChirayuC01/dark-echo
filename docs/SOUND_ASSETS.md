# SOUND ASSETS — RESONANCE

> Reference for sourcing real recorded sound effects for the game.
>
> **Current state:** every sound in the game is **procedurally synthesized** in
> Web Audio (`js/audio.js`) — there are no audio files yet. This document lists
> every sound the game plays (mapped to the function that plays it) and where to
> legally source copyright-free replacements/additions.

---

## Required sound list

Every entry maps to a `play…()` function in `js/audio.js`.

### Player
| # | Sound | Function | Character / search terms |
|---|-------|----------|--------------------------|
| 1 | Footstep (normal) | `playFootstep` | soft single footstep on stone/concrete — "footstep stone single", "foot step soft" |
| 2 | Footstep (water) | `playFootstepWater` | wet step / small splash — "water footstep", "wet step splash" |
| 3 | Pulse / sonar ping | `playPulse` | the loud echolocation blast (SPACE / stomp) — "sonar ping", "sonar pulse", "sub bass boom" |
| 4 | Pulse ready | `playPulseReady` | subtle "ready" cue when cooldown ends — "soft UI blip", "subtle chime" |

### Enemies
| # | Sound | Function | Character / search terms |
|---|-------|----------|--------------------------|
| 5 | Enemy footstep (idle) | `playEnemyFootstep` | heavier/creepier step, positional — "monster footstep", "heavy step" |
| 6 | Enemy footstep (hunting) | `playEnemyFootstepHunting` | faster, aggressive step — "running footsteps monster", "chase footsteps" |
| 7 | Alert (patrol/chaser heard you) | `playAlert` | short "!" detection sting — "enemy alert", "detected sting" |
| 8 | Sentry alert (spotted you) | `playSentryAlert` | alarm/scan-lock tone — "alarm beep", "robot detect alarm" |
| 9 | Blind Stalker breathing | `playBlindStalkerBreathing` | slow raspy breathing loop — "creepy breathing", "monster breathing loop" |
| 10 | Screamer trap burst | `playScreamer` | loud shriek/screech jump-scare — "horror scream screech", "jump scare stinger" |

### Objects / hazards
| # | Sound | Function | Character / search terms |
|---|-------|----------|--------------------------|
| 11 | Hazard scan pulse | `playHazardPulse` | rhythmic ticking scan — "radar tick", "scanner pulse" |
| 12 | Collapsible wall breaking | `playCollapse` | rubble / stone crumble — "wall collapse rubble", "rock crumble" |
| 13 | Door open | `playDoorOpen` | stone/metal door slide — "stone door open", "dungeon door" |
| 14 | Key pickup | `playKeyPickup` | positive pickup chime — "item pickup", "key collect chime" |

### Feedback / meta
| # | Sound | Function | Character / search terms |
|---|-------|----------|--------------------------|
| 15 | Death / caught | `playDeath` | dark impact / failure sting — "death sting", "horror hit low" |
| 16 | Level complete | `playLevelComplete` | short ascending win arpeggio — "level complete", "success jingle" |

### Ambience (looping / random)
| # | Sound | Function | Character / search terms |
|---|-------|----------|--------------------------|
| 17 | Ambient drone (loop) | `startAmbient` | low, unsettling room drone — "dark ambient drone loop", "horror atmosphere loop" |
| 18 | Water drip | `environmental.drip` | occasional cave drip — "water drip cave" |
| 19 | Distant rumble | `environmental.rumble` | low far-off rumble — "distant rumble", "underground rumble" |
| 20 | Structural creak | `environmental.creak` | wood/metal creak — "creak wood", "metal creak" |

### Optional (not wired yet, but the game has menus/landing)
- **UI click / menu select** — "UI click", "menu button" (for level-select, buttons)
- **Reverb impulse responses** — the game fakes reverb procedurally. For *real*
  room reverb per level (`small` / `medium` / `large`) you'd load impulse-response
  WAVs into the `ConvolverNode`. Sources below.

---

## Where to get them (copyright-free)

Ordered by **licensing safety**. The safest is **CC0 / public domain** (use
freely, even commercially, with no attribution).

### Best / safest — CC0, no attribution needed
- **Kenney.nl** (kenney.nl → Assets → Audio) — **CC0**, game-ready packs.
  *Interface Sounds*, *Impact Sounds*, *Sci-Fi Sounds* cover UI, pickup, impacts,
  alerts. Perfect for #4, #8, #11, #14, #15, #16.
- **Pixabay** (pixabay.com/sound-effects) — Pixabay Content License, free for
  commercial use, **no attribution**. Great for ambience, drones, footsteps, screams.
- **Mixkit** (mixkit.co/free-sound-effects) — free license, commercial OK, **no attribution**.
- **Freesound.org** — huge, but **mixed licenses** → in the search sidebar
  **filter License = "Creative Commons 0"** to stay attribution-free. (CC-BY files
  are fine too but require crediting.)
- **OpenGameArt.org** — filter by **CC0**; built for games.

### Excellent, but read the terms
- **Sonniss – GDC Game Audio Bundle** (sonniss.com/gameaudiogdc) — massive **pro,
  royalty-free** packs released free every year; usable in commercial games. Ideal
  for footsteps, ambience, impacts.
- **99Sounds** (99sounds.org) — free pro packs, royalty-free.
- **ZapSplat** (zapsplat.com) — big library, free with account; free tier
  **requires attribution** (paid tier removes it).
- **SoundBible** (soundbible.com) — mix of public-domain and CC-BY; check each file.

### Impulse responses for reverb
- **OpenAIR** (openair.hull.ac.uk / openairlib.net) — real measured IRs; mostly CC-BY.
- **EchoThief** (echothief.com) — free IR library of real spaces.

### ⚠️ Avoid for this game
- **BBC Sound Effects** (sound-effects.bbcrewind.co.uk) — free but the **RemArc
  license is personal/educational/research only — NOT commercial**. Don't ship
  these unless you're strictly non-commercial.
- Anything from YouTube-to-MP3 rips, "free sound" blogs without a clear license, or
  SFX labeled "royalty-free" without a stated license — those are the ones that
  cause "issues" later.

---

## Practical tips
- **Formats:** Web Audio (`decodeAudioData`) handles **`.ogg`, `.mp3`, `.wav`**.
  Use **OGG or MP3** for the web build (small); the ambient loop especially should
  be compressed. Keep short SFX as WAV only if size isn't a concern.
- **Loops (#17–20, breathing #9):** make sure they're **seamless loops**
  (Freesound/Pixabay often tag "loop"). Trim in Audacity if there's a click at the seam.
- **Trim to what you use:** if a download is a long recording (e.g. a continuous
  walking take) and the game only needs one footfall, trim it — otherwise you ship
  megabytes you never play.
- **Keep a license record:** maintain a `docs/AUDIO_CREDITS.md` listing each file →
  source URL → license, so you're covered even for CC0.

---

## How sounds are wired (for when you add files)
All sounds live in `js/audio.js`:
- `SOUND_CONFIG` centralizes every sound's tunable parameters.
- Each `play*()` function reads its config and builds the sound in Web Audio.
- To swap a synth for a real file, load/decode the file into an `AudioBuffer` once,
  then play it from a `BufferSource` inside the matching `play*()` (keeping the synth
  as a fallback is recommended). Positional sounds route through the existing
  `createPositionalSource(x, y)` (HRTF panner); reverbed sounds connect via `addReverb()`.
