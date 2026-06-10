import { TILE, PLAYER_SPEED, PLAYER_RADIUS, ENEMY_RADIUS,
         CHASER_SPEED_IDLE, CHASER_SPEED_HUNT,
         PATROL_SPEED, HAZARD_RADIUS,
         HAZARD_PULSE_INTERVAL, HAZARD_PULSE_MAX, HAZARD_PULSE_SPEED,
         PULSE_WAVE_MAX } from './constants.js';
import { dist, normalize } from './utils.js';
import { resolveWalls } from './collision.js';
import { Wave } from './waves.js';

// ─── Player ─────────────────────────────────────────────────────────────────
export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = PLAYER_RADIUS;
    this.dead = false;
  }

  move(dx, dy, dt, grid) {
    this.x += dx * PLAYER_SPEED * dt;
    this.y += dy * PLAYER_SPEED * dt;
    const r = resolveWalls(grid, this.x, this.y, this.radius);
    this.x = r.x; this.y = r.y;
  }
}

// ─── PatrolEnemy ─────────────────────────────────────────────────────────────
export class PatrolEnemy {
  constructor(x, y, waypoints) {
    this.x = x; this.y = y;
    this.radius = ENEMY_RADIUS;
    this.waypoints = waypoints; // [{x,y},...]
    this.wpIdx = 0;
    this.speed = PATROL_SPEED;
    // Visibility tracking for renderer
    this.revealedAt = -Infinity;
    // Brief pause when hit by a player pulse
    this.pauseTimer = 0;
  }

  update(dt, grid) {
    if (this.pauseTimer > 0) { this.pauseTimer -= dt; return; }
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

  onPulseHit() { this.pauseTimer = 0.6; }
}

// ─── ChaserEnemy ─────────────────────────────────────────────────────────────
export class ChaserEnemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = ENEMY_RADIUS;
    this.state = 'idle';      // 'idle' | 'hunting'
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
    this.huntTimer = 6; // seconds before giving up
  }

  update(dt, grid) {
    if (this.state === 'hunting') {
      this.huntTimer -= dt;
      if (this.huntTimer <= 0) {
        this.state = 'idle';
      }
      const dx = this.targetX - this.x, dy = this.targetY - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 8) {
        this.state = 'idle';
        return;
      }
      const nx = dx / d, ny = dy / d;
      this.x += nx * CHASER_SPEED_HUNT * dt;
      this.y += ny * CHASER_SPEED_HUNT * dt;
    } else {
      // Slow wander
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
    // If movement got blocked, randomize wander direction
    if (r.x !== this.x || r.y !== this.y) {
      this.wanderTimer = 0;
    }
    this.x = r.x; this.y = r.y;
  }
}

// ─── Hazard ──────────────────────────────────────────────────────────────────
export class Hazard {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = HAZARD_RADIUS;
    this.pulseTimer = HAZARD_PULSE_INTERVAL * Math.random(); // stagger start
    this.revealedAt = -Infinity;
  }

  // Returns a Wave if it's time to pulse, null otherwise
  update(dt) {
    this.pulseTimer -= dt * 1000;
    if (this.pulseTimer <= 0) {
      this.pulseTimer = HAZARD_PULSE_INTERVAL;
      return new Wave(this.x, this.y, HAZARD_PULSE_MAX, HAZARD_PULSE_SPEED, 0.55, 'hazard');
    }
    return null;
  }

  // Returns true if the hazard scan wave has killed the player
  killsPlayer(playerX, playerY) {
    return dist(this.x, this.y, playerX, playerY) < this.radius + PLAYER_RADIUS;
  }
}
