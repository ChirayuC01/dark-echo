export const TILE = 40;
export const COLS = 20;
export const ROWS = 15;
// W/H are the *world* (level grid) size in px — NOT the screen size.
// Screen-space dimensions live in js/viewport.js (`view.w` / `view.h`), which
// adapts to the real device viewport (Phase 31).
export const W = TILE * COLS;   // 800
export const H = TILE * ROWS;   // 600

// ─── Camera ──────────────────────────────────────────────────────────────────
// Player-centered zoom (Dark Echo style): the view is scaled up and follows the
// player so only a local portion of the level is visible at a time.
// This is the *baseline* zoom at the native 800×600 view; at runtime the actual
// zoom is derived per-device so the visible world AREA stays constant regardless
// of screen shape (see js/viewport.js).
export const CAMERA_ZOOM = 2.0; // 1 = whole level on screen; 2 = a quarter, centred on the player

// ─── Viewport / render scaling (Phase 31) ────────────────────────────────────
export const VIEW_ZOOM_MIN = 1.5;   // never zoom out past this (tiny windows)
export const VIEW_ZOOM_MAX = 4.5;   // never zoom in past this (very large displays)
// Backing-store budget. Rendering at full device DPR on a modern phone can cost
// 2–3× the old fixed 800×600 surface, so cap total pixels and the DPR itself.
// The budget is set high enough that a 1080p desktop and a phone at DPR 2 both
// render crisply 1:1; it only bites on very high-density/4K surfaces.
export const RENDER_PIXEL_BUDGET = 2_500_000;
export const RENDER_DPR_MAX      = 2;
// Adaptive resolution: reduced quality tiers also render fewer pixels, which is
// the cheapest way to buy back fill rate on low-end devices (Phase 23 + 31).
export const RENDER_SCALE_MEDIUM = 0.85;
export const RENDER_SCALE_LOW    = 0.7;

export const PLAYER_SPEED = 70;
export const PLAYER_RADIUS = 7;

export const STEP_INTERVAL = 240;
export const PULSE_COOLDOWN = 3500;

export const WALL_FADE_MS = 2800;

// ─── Ray echo system ─────────────────────────────────────────────────────────
export const RAY_SPEED        = 160;   // px / s
export const RAY_COUNT_STEP   = 22;    // rays per footstep
export const RAY_COUNT_PULSE  = 64;    // rays per pulse
export const RAY_COUNT_HAZARD = 28;    // rays per hazard tick
export const STEP_RAY_MAX     = 170;   // max travel distance for step rays (px)
export const PULSE_RAY_MAX    = 340;   // max travel distance for pulse rays (px)
export const HAZARD_RAY_MAX   = 110;   // max travel distance for hazard rays (px)
export const MAX_BOUNCES      = 3;     // max wall reflections per ray
export const ENERGY_DECAY     = 0.55;  // energy multiplied on each bounce
export const MIN_ENERGY       = 0.06;  // ray dies below this energy after bounce
export const RAY_TRAIL_MS     = 4200;  // echo trail persistence (ms)
export const ECHO_TRAIL_CAP   = 500;   // hard cap to prevent unbounded growth
export const IMPACT_FADE_MS   = 3600;  // wall impact glint persistence (ms)
// Hard cap on stored wall glints. A single 64-ray pulse can bounce into ~250
// impacts, each living IMPACT_FADE_MS — with steps and repeated pulses the array
// grew unbounded and every entry was drawn each frame. Bounded like ECHO_TRAIL_CAP.
export const IMPACT_CAP       = 420;
export const IMPACT_CAP_MEDIUM = 260;
export const IMPACT_CAP_LOW    = 160;

// Hearing attenuation: full intensity within NEAR px, silent beyond FAR px
export const HEARING_NEAR = 130;
export const HEARING_FAR  = 420;

export const CHASER_SPEED_IDLE = 35;
export const CHASER_SPEED_HUNT = 80;
export const PATROL_SPEED = 52;
export const ENEMY_RADIUS = 11;

export const HAZARD_RADIUS = 28;
export const HAZARD_PULSE_INTERVAL = 2400;

// ─── Crouch / stealth ────────────────────────────────────────────────────────
export const CROUCH_SPEED_MULT    = 0.45;
export const CROUCH_INTERVAL_MULT = 2.5;
export const CROUCH_RAY_MULT      = 0.5;
export const CROUCH_DIST_MULT     = 0.45;

// ─── Water zone ──────────────────────────────────────────────────────────────
export const WATER_SPEED_MULT    = 0.6;
export const WATER_INTERVAL_MULT = 0.6;
export const WATER_RAY_MULT      = 1.6;
export const WATER_ENERGY_DRAIN  = 0.2; // extra energy loss per water cell traversed

// ─── Collapsible walls ───────────────────────────────────────────────────────
export const COLLAPSE_ENERGY_THRESHOLD = 0.3;
export const COLLAPSE_BURST_RAYS       = 12;

// ─── Sentry ───────────────────────────────────────────────────────────────────
export const SENTRY_SCAN_RANGE    = 180;          // px — detection cone depth
export const SENTRY_SCAN_ARC      = Math.PI / 2; // 90° total (±45° each side)
export const SENTRY_SCAN_SPEED    = Math.PI / 3; // 60°/s rotation
export const SENTRY_HUNT_DURATION = 8;           // seconds in alert / pursuit

// ─── BlindStalker ─────────────────────────────────────────────────────────────
export const BLIND_STALKER_SPEED_IDLE     = 30;  // px/s when wandering
export const BLIND_STALKER_SPEED_HUNT     = 104; // px/s when hunting (CHASER × 1.3)
export const BLIND_STALKER_HUNT_DURATION  = 4;   // seconds — shorter window than ChaserEnemy

// ─── Enemy footsteps + breathing ─────────────────────────────────────────────
export const ENEMY_STEP_INTERVAL_IDLE = 520;  // ms between step ray bursts (idle)
export const ENEMY_STEP_INTERVAL_HUNT = 340;  // ms between step ray bursts (hunting)
export const ENEMY_STEP_RAYS          = 8;    // rays per enemy step burst
export const ENEMY_STEP_MAX           = 80;   // max travel distance for enemy step rays (px)
export const BLIND_STALKER_BREATH_MIN = 2000; // ms min interval between breathing cues
export const BLIND_STALKER_BREATH_MAX = 3000; // ms max interval between breathing cues

// ─── Switches / triggers ─────────────────────────────────────────────────────
// Triggers marked `soundActivated` fire when a loud enough sound wave passes
// within this radius — you can clap a switch open from across a gap instead of
// having to physically stand on it (Dark Echo ENV-02, Phase 26).
export const TRIGGER_ACTIVATE_D   = 26;   // px — ray-to-switch distance that trips it
// Min ray energy to trip a switch. Deliberately above a footstep's 0.42 so only a
// PULSE opens these — direct pulse rays are 1.0 and survive one bounce at 0.55, but
// footsteps and faint multi-bounce tails never trip a switch by accident.
export const TRIGGER_SOUND_ENERGY = 0.5;

// ─── Doors / keys ────────────────────────────────────────────────────────────
export const KEY_PICKUP_RADIUS    = 12;
export const CRUSHER_REVEAL_MS    = 5500;  // crushers stay visible longer than walls

// ─── Movement + polish ───────────────────────────────────────────────────────
export const PLAYER_ACCEL    = 12;   // velocity lerp factor (unitless, not px/s²)
export const DANGER_NEAR_PX  = 100; // enemy proximity threshold for danger audio

// ─── Footprints ──────────────────────────────────────────────────────────────
export const FOOTPRINT_FADE_MS   = 1500; // how long a footprint lingers before it's gone (ms)
export const FOOTPRINT_STRIDE_PX  = 22;   // distance travelled between successive footprints (px)
export const FOOTPRINT_MAX        = 48;   // cap on stored footprints
export const FOOTPRINT_STANCE_OFF = 5;    // px lateral offset of each foot from the walking line
export const PLAYER_IDLE_SPEED    = 6;    // px/s below which the player counts as standing still

// ─── Screamer ────────────────────────────────────────────────────────────────
export const SCREAMER_ALERT_RADIUS = 300; // px — enemies within this radius go alert
export const SCREAMER_BURST_RAYS   = 48;  // rays emitted when screamer triggers

// ─── Performance / adaptive quality (Phase 23) ────────────────────────────────
export const RAY_POOL_CAP           = 200;  // max recycled Ray instances retained
export const ECHO_TRAIL_CAP_MEDIUM  = 250;  // trail cap at 'medium' quality tier
export const ECHO_TRAIL_CAP_LOW     = 150;  // trail cap at 'low' quality tier
export const ENEMY_STEP_RAYS_LOW    = 5;    // enemy step rays at reduced tiers
export const QUALITY_DOWNGRADE_FPS  = 45;   // sustained below this → drop a tier
export const QUALITY_LOW_FPS        = 30;   // sustained below this → jump to 'low'
// How long FPS must stay low before dropping a tier. Kept short enough that a
// player doesn't sit through seconds of visible jank before the game reacts —
// the adaptor is downgrade-only, so a brief spike can't make it oscillate.
export const QUALITY_SUSTAIN_MS     = 1200;

// ─── Cell types ──────────────────────────────────────────────────────────────
export const CELL = {
  EMPTY:       0,
  WALL:        1,
  START:       2,
  EXIT:        3,
  COLLAPSIBLE: 4,
  WATER:       5,
  HAZARD:      6,
};
