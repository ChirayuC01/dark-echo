import { RAY_SPEED, MAX_BOUNCES, ENERGY_DECAY, MIN_ENERGY,
         STEP_RAY_MAX, PULSE_RAY_MAX, HAZARD_RAY_MAX,
         RAY_COUNT_STEP, RAY_COUNT_PULSE, RAY_COUNT_HAZARD,
         RAY_TRAIL_MS, ECHO_TRAIL_CAP } from './constants.js';

const NUDGE = 0.8; // px to offset after bounce to avoid re-collision

// ─── Ray ─────────────────────────────────────────────────────────────────────
export class Ray {
  constructor() {
    this.done = true;
    this.segments      = [];   // sealed segments: {x1,y1,x2,y2,energy}
    this.heardEntities = new Set();
  }

  init(ox, oy, dx, dy, energy, type, maxDist, burstX, burstY) {
    this.segments.length = 0;
    this.heardEntities.clear();

    this.segX = ox; this.segY = oy;  // start of current (live) segment
    this.tipX = ox; this.tipY = oy;  // current front of ray
    this.dx = dx;   this.dy = dy;
    this.energy   = energy;
    this.type     = type;
    this.maxDist  = maxDist;
    this.traveled = 0;
    this.bounces  = 0;
    this.burstX   = burstX;  // original sound source (for enemy targeting)
    this.burstY   = burstY;
    this.done     = false;
    return this;
  }

  // Advance the ray by dt seconds using castFn.
  // Returns { x,y,col,row,nx,ny,energy,type } on wall hit, null otherwise.
  // Also pushes sealed segments internally.
  advance(dt, castFn) {
    if (this.done) return null;

    const budget = Math.min(RAY_SPEED * dt, this.maxDist - this.traveled);
    if (budget <= 0) { this._finish(); return null; }

    const hit = castFn(this.tipX, this.tipY, this.dx, this.dy, budget);

    if (hit) {
      // ── Seal segment up to wall ──────────────────────────────────────────
      this._sealSegment(hit.x, hit.y);
      this.traveled += hit.t;

      const hitResult = {
        x: hit.x, y: hit.y,
        col: hit.col, row: hit.row,
        nx: hit.nx,  ny: hit.ny,
        energy: this.energy,
        type: this.type,
      };

      // ── Bounce or die ────────────────────────────────────────────────────
      const nextEnergy = this.energy * ENERGY_DECAY;
      if (this.bounces < MAX_BOUNCES && nextEnergy > MIN_ENERGY) {
        // Reflect: R = D - 2(D·N)N
        const dot = this.dx * hit.nx + this.dy * hit.ny;
        this.dx = this.dx - 2 * dot * hit.nx;
        this.dy = this.dy - 2 * dot * hit.ny;
        this.energy = nextEnergy;
        this.bounces++;

        // Nudge away from wall so DDA doesn't re-collide immediately
        const sx = hit.x + hit.nx * NUDGE;
        const sy = hit.y + hit.ny * NUDGE;
        this.segX = sx; this.segY = sy;
        this.tipX = sx; this.tipY = sy;

        // Use remaining budget in new direction (no second collision check)
        const left = Math.min(budget - hit.t, this.maxDist - this.traveled);
        if (left > 0) {
          this.tipX += this.dx * left;
          this.tipY += this.dy * left;
          this.traveled += left;
        }
        if (this.traveled >= this.maxDist) this._finish();
      } else {
        this.done = true;
      }

      return hitResult;
    }

    // ── Free travel ─────────────────────────────────────────────────────────
    this.tipX += this.dx * budget;
    this.tipY += this.dy * budget;
    this.traveled += budget;
    if (this.traveled >= this.maxDist) this._finish();
    return null;
  }

  _sealSegment(x2, y2) {
    this.segments.push({
      x1: this.segX, y1: this.segY,
      x2, y2,
      energy: this.energy,
    });
  }

  _finish() {
    // Seal the final live segment
    this.segments.push({
      x1: this.segX, y1: this.segY,
      x2: this.tipX, y2: this.tipY,
      energy: this.energy,
    });
    this.done = true;
  }
}

// ─── RaySystem ───────────────────────────────────────────────────────────────
export class RaySystem {
  constructor() {
    this.active     = [];
    this._pool      = [];
    this.echoTrails = []; // {x1,y1,x2,y2,energy,type,createdAt}
  }

  // Emit a burst of rays from (x,y).
  // countOverride and maxDistOverride let callers reduce output (e.g. when crouching).
  burst(x, y, type, castFn, countOverride, maxDistOverride) {
    const count   = countOverride  ?? (type === 'pulse'  ? RAY_COUNT_PULSE
                                     : type === 'step'   ? RAY_COUNT_STEP
                                     : RAY_COUNT_HAZARD);
    const energy  = type === 'pulse'  ? 1.0
                  : type === 'step'   ? 0.42
                  : 0.58;
    const maxDist = maxDistOverride ?? (type === 'pulse'  ? PULSE_RAY_MAX
                                      : type === 'step'   ? STEP_RAY_MAX
                                      : HAZARD_RAY_MAX);

    // Random phase offset so successive bursts don't align
    const phase = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = phase + (i / count) * Math.PI * 2;
      const ray = this._pool.length ? this._pool.pop() : new Ray();
      ray.init(x, y,
               Math.cos(angle), Math.sin(angle),
               energy, type, maxDist, x, y);
      this.active.push(ray);
    }
  }

  // Advance all rays. Returns array of wall-hit events.
  // castFn = (ox,oy,dx,dy,maxDist) => hit|null
  update(dt, castFn, now) {
    const hits = [];
    let wi = 0;

    for (let i = 0; i < this.active.length; i++) {
      const ray = this.active[i];
      const hit = ray.advance(dt, castFn);

      if (hit) {
        hits.push(hit);
        // When a segment is sealed on bounce, record echo trail
        if (!ray.done) {
          const seg = ray.segments[ray.segments.length - 1];
          if (seg) this.echoTrails.push({ ...seg, type: ray.type, createdAt: now });
        }
      }

      if (!ray.done) {
        this.active[wi++] = ray;
      } else {
        // On final completion, record all segments as trails
        for (const seg of ray.segments) {
          this.echoTrails.push({ ...seg, type: ray.type, createdAt: now });
        }
        this._pool.push(ray);
      }
    }
    this.active.length = wi;

    // Prune stale echo trails (time-based) then enforce hard cap
    if (this.echoTrails.length > 0) {
      let ri = 0;
      for (let i = 0; i < this.echoTrails.length; i++) {
        if (now - this.echoTrails[i].createdAt < RAY_TRAIL_MS) {
          this.echoTrails[ri++] = this.echoTrails[i];
        }
      }
      this.echoTrails.length = ri;
      // If still over cap after time prune, drop oldest (front of array)
      if (this.echoTrails.length > ECHO_TRAIL_CAP) {
        this.echoTrails.splice(0, this.echoTrails.length - ECHO_TRAIL_CAP);
      }
    }

    return hits;
  }

  clear() {
    for (const r of this.active) this._pool.push(r);
    this.active.length = 0;
    this.echoTrails.length = 0;
  }
}

// ─── Backward-compat shim (used only by Hazard in entities.js if not yet updated) ──
export class Wave {
  constructor(x, y, _max, _speed, _alpha, type) {
    this.x = x; this.y = y; this.type = type;
    this.radius = 0; this.prevRadius = 0; this.done = false;
    this._shim = true;
  }
  update() { this.done = true; }
  opacity() { return 0; }
}
export class WaveManager {
  constructor() { this.waves = []; }
  add(w) { this.waves.push(w); }
  update() { this.waves = this.waves.filter(w => !w.done); }
  clear()  { this.waves = []; }
}
