export const TILE = 40;
export const COLS = 20;
export const ROWS = 15;
export const W = TILE * COLS;   // 800
export const H = TILE * ROWS;   // 600

export const PLAYER_SPEED = 150;
export const PLAYER_RADIUS = 7;

export const STEP_INTERVAL = 240;
export const STEP_WAVE_MAX = 130;
export const STEP_WAVE_SPEED = 110;
export const STEP_WAVE_ALPHA = 0.45;

export const PULSE_WAVE_MAX = 280;
export const PULSE_WAVE_SPEED = 190;
export const PULSE_WAVE_ALPHA = 0.9;
export const PULSE_COOLDOWN = 3500;

export const WALL_FADE_MS = 2800;
export const WAVE_RING_W = 12; // kept for backward compat (unused by new ray system)

// ─── Ray echo system ─────────────────────────────────────────────────────────
export const RAY_SPEED        = 340;   // px / s
export const RAY_COUNT_STEP   = 22;    // rays per footstep
export const RAY_COUNT_PULSE  = 64;    // rays per pulse
export const RAY_COUNT_HAZARD = 28;    // rays per hazard tick
export const STEP_RAY_MAX     = 170;   // max travel distance for step rays (px)
export const PULSE_RAY_MAX    = 340;   // max travel distance for pulse rays (px)
export const HAZARD_RAY_MAX   = 110;   // max travel distance for hazard rays (px)
export const MAX_BOUNCES      = 3;     // max wall reflections per ray
export const ENERGY_DECAY     = 0.55;  // energy multiplied on each bounce
export const MIN_ENERGY       = 0.06;  // ray dies below this energy after bounce
export const RAY_TRAIL_MS     = 1600;  // echo trail persistence (ms)

export const CHASER_SPEED_IDLE = 35;
export const CHASER_SPEED_HUNT = 80;
export const PATROL_SPEED = 52;
export const ENEMY_RADIUS = 11;

export const HAZARD_RADIUS = 28;
export const HAZARD_PULSE_INTERVAL = 2400;
export const HAZARD_PULSE_MAX = 80;
export const HAZARD_PULSE_SPEED = 55;

export const CELL = {
  EMPTY: 0,
  WALL:  1,
  START: 2,
  EXIT:  3,
  HAZARD: 6,
};
