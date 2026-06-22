export const TILE = 40;
export const COLS = 20;
export const ROWS = 15;
export const W = TILE * COLS;   // 800
export const H = TILE * ROWS;   // 600

export const PLAYER_SPEED = 150;
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

// ─── Doors / keys ────────────────────────────────────────────────────────────
export const KEY_PICKUP_RADIUS    = 12;
export const CRUSHER_REVEAL_MS    = 5500;  // crushers stay visible longer than walls

// ─── Movement + polish ───────────────────────────────────────────────────────
export const PLAYER_ACCEL    = 12;   // velocity lerp factor (unitless, not px/s²)
export const DANGER_NEAR_PX  = 100; // enemy proximity threshold for danger audio

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
