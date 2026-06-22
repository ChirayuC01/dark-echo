import { TILE, PLAYER_SPEED, PLAYER_RADIUS, ENEMY_RADIUS,
         CHASER_SPEED_IDLE, CHASER_SPEED_HUNT,
         PATROL_SPEED, HAZARD_RADIUS,
         HAZARD_PULSE_INTERVAL,
         CROUCH_SPEED_MULT,
         WATER_SPEED_MULT,
         SENTRY_SCAN_RANGE, SENTRY_SCAN_ARC,
         SENTRY_SCAN_SPEED, SENTRY_HUNT_DURATION,
         BLIND_STALKER_SPEED_IDLE, BLIND_STALKER_SPEED_HUNT,
         BLIND_STALKER_HUNT_DURATION,
         ENEMY_STEP_INTERVAL_IDLE, ENEMY_STEP_INTERVAL_HUNT,
         BLIND_STALKER_BREATH_MIN, BLIND_STALKER_BREATH_MAX,
         PLAYER_ACCEL, SCREAMER_ALERT_RADIUS } from './constants.js';
import { dist } from './utils.js';
import { resolveWalls } from './collision.js';

// ─── Player ─────────────────────────────────────────────────────────────────
export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = PLAYER_RADIUS;
    this.crouching = false;
    this.dead = false;
  }

  move(dx, dy, dt, grid, crouching = false, inWater = false) {
    this.crouching = crouching;
    this.inWater = inWater;
    const speed = PLAYER_SPEED
      * (crouching ? CROUCH_SPEED_MULT : 1)
      * (inWater   ? WATER_SPEED_MULT  : 1);
    const accel = PLAYER_ACCEL * (crouching ? 0.55 : 1);
    this.vx += (dx * speed - this.vx) * Math.min(1, accel * dt);
    this.vy += (dy * speed - this.vy) * Math.min(1, accel * dt);
    this.x += this.vx * dt;
    let r = resolveWalls(grid, this.x, this.y, this.radius);
    this.x = r.x; this.y = r.y;
    this.y += this.vy * dt;
    r = resolveWalls(grid, this.x, this.y, this.radius);
    this.x = r.x; this.y = r.y;
  }
}

// ─── PatrolEnemy ─────────────────────────────────────────────────────────────
export class PatrolEnemy {
  constructor(x, y, waypoints) {
    this.x = x; this.y = y;
    this.radius = ENEMY_RADIUS;
    this.waypoints = waypoints;
    this.wpIdx = 0;
    this.speed = PATROL_SPEED;
    this.shape = 'patrol';
    this.revealedAt = -Infinity;
    // Pulse stun
    this.pauseTimer = 0;
    // Step-hearing investigation (only when stepAware = true on this instance)
    this.stepAware   = false;
    this.alertTimer  = 0;
    this.alertTargetX = 0;
    this.alertTargetY = 0;
    this.stepTimer   = 0;
  }

  shouldEmitStep(dt) {
    const interval = this.alertTimer > 0 ? ENEMY_STEP_INTERVAL_HUNT : ENEMY_STEP_INTERVAL_IDLE;
    this.stepTimer += dt * 1000;
    if (this.stepTimer >= interval) { this.stepTimer = 0; return true; }
    return false;
  }

  hearStep(srcX, srcY) {
    if (!this.stepAware) return;
    this.alertTimer  = 3.5;
    this.alertTargetX = srcX;
    this.alertTargetY = srcY;
  }

  onPulseHit() { this.pauseTimer = 0.6; }

  update(dt, grid) {
    if (this.pauseTimer > 0) { this.pauseTimer -= dt; return; }

    // Briefly investigate a heard step sound
    if (this.alertTimer > 0) {
      this.alertTimer -= dt;
      const dx = this.alertTargetX - this.x, dy = this.alertTargetY - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 8) {
        this.x += (dx / d) * this.speed * dt;
        this.y += (dy / d) * this.speed * dt;
      }
      const r = resolveWalls(grid, this.x, this.y, this.radius);
      this.x = r.x; this.y = r.y;
      return;
    }

    // Normal waypoint patrol
    if (!this.waypoints.length) return;
    const target = this.waypoints[this.wpIdx];
    const dx = target.x - this.x, dy = target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 4) {
      this.wpIdx = (this.wpIdx + 1) % this.waypoints.length;
      return;
    }
    const nx = dx / d, ny = dy / d;
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
    const r = resolveWalls(grid, this.x, this.y, this.radius);
    this.x = r.x; this.y = r.y;
  }
}

// ─── ChaserEnemy ─────────────────────────────────────────────────────────────
export class ChaserEnemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = ENEMY_RADIUS;
    this.shape = 'chaser';
    this.state = 'idle';
    this.targetX = x; this.targetY = y;
    this.wanderTimer = 0;
    this.wanderDX = 0; this.wanderDY = 0;
    this.huntTimer = 0;
    this.revealedAt = -Infinity;
    this.stepTimer = 0;
  }

  shouldEmitStep(dt) {
    const interval = this.state === 'hunting' ? ENEMY_STEP_INTERVAL_HUNT : ENEMY_STEP_INTERVAL_IDLE;
    this.stepTimer += dt * 1000;
    if (this.stepTimer >= interval) { this.stepTimer = 0; return true; }
    return false;
  }

  hearSound(sourceX, sourceY) {
    this.state = 'hunting';
    this.targetX = sourceX;
    this.targetY = sourceY;
    this.huntTimer = 6;
  }

  update(dt, grid) {
    if (this.state === 'hunting') {
      this.huntTimer -= dt;
      if (this.huntTimer <= 0) this.state = 'idle';
      const dx = this.targetX - this.x, dy = this.targetY - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 8) { this.state = 'idle'; return; }
      const nx = dx / d, ny = dy / d;
      this.x += nx * CHASER_SPEED_HUNT * dt;
      this.y += ny * CHASER_SPEED_HUNT * dt;
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1.5 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        this.wanderDX = Math.cos(angle);
        this.wanderDY = Math.sin(angle);
      }
      this.x += this.wanderDX * CHASER_SPEED_IDLE * dt;
      this.y += this.wanderDY * CHASER_SPEED_IDLE * dt;
    }
    const r = resolveWalls(grid, this.x, this.y, this.radius);
    if (r.x !== this.x || r.y !== this.y) this.wanderTimer = 0;
    this.x = r.x; this.y = r.y;
  }
}

// ─── Crusher ─────────────────────────────────────────────────────────────────
export class Crusher {
  constructor(x, y, axis, range, period) {
    this.originX = x; this.originY = y;
    this.x = x; this.y = y;
    this.axis    = axis;
    this.range   = range * TILE;   // tiles → px
    this.period  = period;
    this.elapsed = Math.random() * period;
    this.revealedAt = -Infinity;
    this.radius  = TILE * 0.5;
  }

  update(dt) {
    this.elapsed += dt;
    const offset = Math.sin((this.elapsed / this.period) * Math.PI * 2) * this.range;
    if (this.axis === 'h') { this.x = this.originX + offset; }
    else                   { this.y = this.originY + offset; }
  }

  bounds() {
    return {
      x1: this.x - TILE / 2, y1: this.y - TILE / 2,
      x2: this.x + TILE / 2, y2: this.y + TILE / 2,
    };
  }
}

// ─── Sentry ──────────────────────────────────────────────────────────────────
// Visual enemy: rotates a scan cone; transitions to pursuit on player LOS.
// Detects visually only — sound rays cannot trigger detection.
// Stunned by pulse; pursues at ChaserEnemy hunt speed for SENTRY_HUNT_DURATION s.
export class Sentry {
  constructor(x, y, angle = 0) {
    this.x = x; this.y = y;
    this.radius    = ENEMY_RADIUS;
    this.shape     = 'sentry';
    this.angle     = angle;            // current cone facing direction (radians)
    this.scanRange = SENTRY_SCAN_RANGE;
    this.scanArc   = SENTRY_SCAN_ARC;
    this.state     = 'idle';           // 'idle' | 'alert' | 'stunned'
    this.huntTimer = 0;
    this.stunTimer = 0;
    this.revealedAt = -Infinity;
  }

  onPulseHit() {
    this.state     = 'stunned';
    this.stunTimer = 0.6;
  }

  // Returns true once on the frame the sentry spots the player (for audio trigger).
  update(dt, grid, castFn, player) {
    if (this.state === 'stunned') {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = 'idle';
      return false;
    }

    if (this.state === 'alert') {
      this.huntTimer -= dt;
      if (this.huntTimer <= 0) { this.state = 'idle'; return false; }
      const dx = player.x - this.x, dy = player.y - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 8) {
        this.x += (dx / d) * CHASER_SPEED_HUNT * dt;
        this.y += (dy / d) * CHASER_SPEED_HUNT * dt;
      }
      const r = resolveWalls(grid, this.x, this.y, this.radius);
      this.x = r.x; this.y = r.y;
      return false;
    }

    // Idle: rotate scan cone
    this.angle = (this.angle + SENTRY_SCAN_SPEED * dt) % (Math.PI * 2);

    // Check if player is inside cone + has clear LOS
    const dx = player.x - this.x, dy = player.y - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < this.scanRange && d > 1) {
      const angleTo = Math.atan2(dy, dx);
      let diff = angleTo - this.angle;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < this.scanArc / 2) {
        const nx = dx / d, ny = dy / d;
        const hit = castFn(this.x, this.y, nx, ny, d - PLAYER_RADIUS);
        if (!hit) {
          this.state     = 'alert';
          this.huntTimer = SENTRY_HUNT_DURATION;
          return true;  // signal game.js to play alert sound
        }
      }
    }
    return false;
  }
}

// ─── BlindStalker ────────────────────────────────────────────────────────────
// Hears ALL sounds (step, pulse) including crouched steps — ignores quiet flag.
// Faster than ChaserEnemy but hunt timer is shorter (4s vs 6s).
// Re-acquires instantly on any new sound before the timer expires.
export class BlindStalker {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = ENEMY_RADIUS;
    this.shape = 'stalker';
    this.state = 'idle';
    this.targetX = x; this.targetY = y;
    this.wanderTimer = 0;
    this.wanderDX = 0; this.wanderDY = 0;
    this.huntTimer = 0;
    this.revealedAt = -Infinity;
    this.stepTimer = 0;
    this.breathTimer = BLIND_STALKER_BREATH_MIN + Math.random() * (BLIND_STALKER_BREATH_MAX - BLIND_STALKER_BREATH_MIN);
  }

  shouldEmitStep(dt) {
    const interval = this.state === 'hunting' ? ENEMY_STEP_INTERVAL_HUNT : ENEMY_STEP_INTERVAL_IDLE;
    this.stepTimer += dt * 1000;
    if (this.stepTimer >= interval) { this.stepTimer = 0; return true; }
    return false;
  }

  shouldBreathe(dt) {
    this.breathTimer -= dt * 1000;
    if (this.breathTimer <= 0) {
      this.breathTimer = BLIND_STALKER_BREATH_MIN + Math.random() * (BLIND_STALKER_BREATH_MAX - BLIND_STALKER_BREATH_MIN);
      return true;
    }
    return false;
  }

  hearSound(sourceX, sourceY) {
    this.state = 'hunting';
    this.targetX = sourceX;
    this.targetY = sourceY;
    this.huntTimer = BLIND_STALKER_HUNT_DURATION;
  }

  update(dt, grid) {
    if (this.state === 'hunting') {
      this.huntTimer -= dt;
      if (this.huntTimer <= 0) this.state = 'idle';
      const dx = this.targetX - this.x, dy = this.targetY - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 8) { this.state = 'idle'; return; }
      const nx = dx / d, ny = dy / d;
      this.x += nx * BLIND_STALKER_SPEED_HUNT * dt;
      this.y += ny * BLIND_STALKER_SPEED_HUNT * dt;
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1.5 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        this.wanderDX = Math.cos(angle);
        this.wanderDY = Math.sin(angle);
      }
      this.x += this.wanderDX * BLIND_STALKER_SPEED_IDLE * dt;
      this.y += this.wanderDY * BLIND_STALKER_SPEED_IDLE * dt;
    }
    const r = resolveWalls(grid, this.x, this.y, this.radius);
    if (r.x !== this.x || r.y !== this.y) this.wanderTimer = 0;
    this.x = r.x; this.y = r.y;
  }
}

// ─── Hazard ──────────────────────────────────────────────────────────────────
export class Hazard {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = HAZARD_RADIUS;
    this.pulseTimer = HAZARD_PULSE_INTERVAL * Math.random();
    this.revealedAt = -Infinity;
  }

  update(dt) {
    this.pulseTimer -= dt * 1000;
    if (this.pulseTimer <= 0) {
      this.pulseTimer = HAZARD_PULSE_INTERVAL;
      return { x: this.x, y: this.y };
    }
    return null;
  }

  killsPlayer(playerX, playerY) {
    return dist(this.x, this.y, playerX, playerY) < this.radius + PLAYER_RADIUS;
  }
}

// ─── ScreamerEnemy ────────────────────────────────────────────────────────────
// Stationary sound trap. Any ray that passes within its radius triggers a burst
// and alerts all enemies within SCREAMER_ALERT_RADIUS. Kills on player contact.
export class ScreamerEnemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = HAZARD_RADIUS;
    this.shape = 'screamer';
    this.triggered = false;
    this.revealedAt = -Infinity;
  }

  alertNearbyEnemies(enemies) {
    for (const en of enemies) {
      const d = dist(this.x, this.y, en.x, en.y);
      if (d < SCREAMER_ALERT_RADIUS) {
        if (en.hearSound) en.hearSound(this.x, this.y);
        if (en.hearStep)  en.hearStep(this.x, this.y);
      }
    }
  }

  killsPlayer(playerX, playerY) {
    return dist(this.x, this.y, playerX, playerY) < this.radius + PLAYER_RADIUS;
  }
}
