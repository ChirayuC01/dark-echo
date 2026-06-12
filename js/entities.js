import { TILE, PLAYER_SPEED, PLAYER_RADIUS, ENEMY_RADIUS,
         CHASER_SPEED_IDLE, CHASER_SPEED_HUNT,
         PATROL_SPEED, HAZARD_RADIUS,
         HAZARD_PULSE_INTERVAL,
         CROUCH_SPEED_MULT,
         WATER_SPEED_MULT } from './constants.js';
import { dist } from './utils.js';
import { resolveWalls } from './collision.js';

// ─── Player ─────────────────────────────────────────────────────────────────
export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
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
    this.x += dx * speed * dt;
    this.y += dy * speed * dt;
    const r = resolveWalls(grid, this.x, this.y, this.radius);
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
    this.revealedAt = -Infinity;
    // Pulse stun
    this.pauseTimer = 0;
    // Step-hearing investigation (only when stepAware = true on this instance)
    this.stepAware   = false;
    this.alertTimer  = 0;
    this.alertTargetX = 0;
    this.alertTargetY = 0;
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
    this.state = 'idle';
    this.targetX = x; this.targetY = y;
    this.wanderTimer = 0;
    this.wanderDX = 0; this.wanderDY = 0;
    this.huntTimer = 0;
    this.revealedAt = -Infinity;
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
