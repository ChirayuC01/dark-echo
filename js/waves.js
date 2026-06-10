export class Wave {
  constructor(x, y, maxRadius, speed, alpha, type) {
    this.x = x; this.y = y;
    this.radius = 0;
    this.prevRadius = 0;
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.alpha = alpha;
    this.type = type; // 'step' | 'pulse' | 'hazard'
    this.done = false;
  }

  update(dt) {
    this.prevRadius = this.radius;
    this.radius += this.speed * dt;
    if (this.radius >= this.maxRadius) {
      this.radius = this.maxRadius;
      this.done = true;
    }
  }

  // Does the wave ring currently overlap this circle?
  hitsCircle(cx, cy, cr, ringW) {
    const d = Math.sqrt((cx - this.x) ** 2 + (cy - this.y) ** 2);
    return d <= this.radius + cr && d >= Math.max(0, this.radius - ringW - cr);
  }

  // True if wave ring crossed through a point this frame
  passedPoint(px, py, ringW) {
    const d = Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2);
    return d <= this.radius && d >= Math.max(0, this.radius - ringW);
  }

  opacity() {
    const progress = this.radius / this.maxRadius;
    return this.alpha * (1 - progress * 0.7);
  }
}

export class WaveManager {
  constructor() { this.waves = []; }

  add(wave) { this.waves.push(wave); }

  update(dt) {
    for (const w of this.waves) w.update(dt);
    this.waves = this.waves.filter(w => !w.done);
  }

  clear() { this.waves = []; }
}
