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

export const WALL_FADE_MS = 2200;
export const WAVE_RING_W = 12;

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
