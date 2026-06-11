import { TILE, COLS, ROWS, W, H, WALL_FADE_MS, RAY_TRAIL_MS } from './constants.js';

let canvas, ctx;
let exposedFaces = null; // Uint8Array[row][col] bitmask: top=1 right=2 bottom=4 left=8

export function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  // Enable sub-pixel antialiasing
  ctx.imageSmoothingEnabled = true;
}

// ─── Wall reveal maps ─────────────────────────────────────────────────────────
export function makeRevealMap(rows, cols) {
  return Array.from({ length: rows }, () => new Float64Array(cols).fill(-Infinity));
}

export function makeEnergyMap(rows, cols) {
  return Array.from({ length: rows }, () => new Float32Array(cols).fill(0));
}

// Precompute which faces of each wall tile are exposed to open space.
// Call once per level load.
export function precomputeWallFaces(grid) {
  const rows = grid.length, cols = grid[0].length;
  exposedFaces = Array.from({ length: rows }, () => new Uint8Array(cols));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 1) continue;
      let bits = 0;
      if (r === 0          || grid[r-1][c] !== 1) bits |= 1;  // top
      if (c === cols - 1   || grid[r][c+1] !== 1) bits |= 2;  // right
      if (r === rows - 1   || grid[r+1][c] !== 1) bits |= 4;  // bottom
      if (c === 0          || grid[r][c-1] !== 1) bits |= 8;  // left
      exposedFaces[r][c] = bits;
    }
  }
}

function wallAlpha(revealTime, now) {
  const age = now - revealTime;
  if (age >= WALL_FADE_MS) return 0;
  // Ease-out: brighter on fresh hit, smooth tail
  const t = 1 - age / WALL_FADE_MS;
  return t * t * (3 - 2 * t); // smoothstep
}

// ─── Main draw ────────────────────────────────────────────────────────────────
export function draw(state, now) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state.screen !== 'playing' && state.screen !== 'paused' && state.screen !== 'levelup') return;

  const { grid, wallReveal, wallRevealEnergy, rays, echoTrails,
          player, enemies, hazards, exit } = state;

  drawWalls(grid, wallReveal, wallRevealEnergy, now);
  drawExit(exit, now);
  drawHazards(hazards, now);
  drawEnemies(enemies, now);
  drawEchoTrails(echoTrails, now);
  drawActiveRays(rays);
  drawPlayer(player);
  drawVignette();
}

// ─── Wall edge lines ──────────────────────────────────────────────────────────
function drawWalls(grid, wallReveal, wallRevealEnergy, now) {
  if (!exposedFaces) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.3;
  ctx.shadowBlur = 7;
  ctx.shadowColor = 'rgba(120,165,240,0.35)';

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] !== 1) continue;
      const alpha = wallAlpha(wallReveal[row][col], now);
      if (alpha < 0.004) continue;

      const faces = exposedFaces[row][col];
      if (!faces) continue;

      // Tint brighter for high-energy hits (pulse vs footstep)
      const en  = wallRevealEnergy ? wallRevealEnergy[row][col] : 0.5;
      const r   = Math.round(145 + 70 * en);
      const g   = Math.round(170 + 45 * en);
      const b   = Math.round(235 + 20 * en);

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      const x = col * TILE, y = row * TILE;

      ctx.beginPath();
      if (faces & 1) { ctx.moveTo(x,        y);        ctx.lineTo(x + TILE, y);        }
      if (faces & 2) { ctx.moveTo(x + TILE,  y);        ctx.lineTo(x + TILE, y + TILE); }
      if (faces & 4) { ctx.moveTo(x,        y + TILE); ctx.lineTo(x + TILE, y + TILE); }
      if (faces & 8) { ctx.moveTo(x,        y);        ctx.lineTo(x,        y + TILE); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ─── Exit marker ─────────────────────────────────────────────────────────────
function drawExit(exit, now) {
  if (!exit) return;
  const pulse = 0.35 + 0.18 * Math.sin(now / 600);
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = 'rgba(60,220,110,0.5)';
  const grd = ctx.createRadialGradient(exit.x, exit.y, 2, exit.x, exit.y, 22);
  grd.addColorStop(0, `rgba(80,220,120,${pulse})`);
  grd.addColorStop(1, 'rgba(80,220,120,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(160,255,180,${pulse * 0.9})`;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── Hazards ──────────────────────────────────────────────────────────────────
function drawHazards(hazards, now) {
  ctx.save();
  for (const h of hazards) {
    const alpha = wallAlpha(h.revealedAt, now);
    if (alpha < 0.004) continue;
    ctx.shadowBlur = 10 * alpha;
    ctx.shadowColor = `rgba(220,80,40,${alpha * 0.5})`;
    const grd = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.radius + 8);
    grd.addColorStop(0, `rgba(200,60,30,${alpha * 0.45})`);
    grd.addColorStop(1, 'rgba(180,50,20,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius + 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,100,60,${alpha})`;
    ctx.beginPath(); ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── Enemies ──────────────────────────────────────────────────────────────────
function drawEnemies(enemies, now) {
  ctx.save();
  for (const e of enemies) {
    const alpha = wallAlpha(e.revealedAt, now);
    if (alpha < 0.004) continue;
    const hunting = e.state === 'hunting';
    const base = hunting ? '230,45,45' : '185,55,55';
    ctx.shadowBlur = hunting ? 14 * alpha : 8 * alpha;
    ctx.shadowColor = `rgba(${base},${alpha * 0.7})`;
    const grd = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.radius + 9);
    grd.addColorStop(0, `rgba(${base},${alpha * 0.55})`);
    grd.addColorStop(1, `rgba(${base},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${base},${alpha * 0.92})`;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    // Direction tick
    if (e.waypoints) {
      const wp = e.waypoints[e.wpIdx || 0];
      if (wp) {
        const dx = wp.x - e.x, dy = wp.y - e.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0.01) {
          ctx.strokeStyle = `rgba(${base},${alpha * 0.35})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + dx/len * 13, e.y + dy/len * 13);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

// ─── Echo trails (fading ray paths after a ray completes) ────────────────────
function drawEchoTrails(trails, now) {
  if (!trails || trails.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.7;
  // No shadow on trails – they should be subtle
  for (const t of trails) {
    const age = now - t.createdAt;
    if (age >= RAY_TRAIL_MS) continue;
    const fade = 1 - age / RAY_TRAIL_MS;
    const alpha = t.energy * fade * 0.38;
    if (alpha < 0.005) continue;

    if (t.type === 'hazard') {
      ctx.strokeStyle = `rgba(215,95,45,${alpha})`;
    } else if (t.type === 'pulse') {
      ctx.strokeStyle = `rgba(175,210,255,${alpha})`;
    } else {
      ctx.strokeStyle = `rgba(145,180,225,${alpha})`;
    }
    ctx.beginPath();
    ctx.moveTo(t.x1, t.y1);
    ctx.lineTo(t.x2, t.y2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Active rays (live, bright) ───────────────────────────────────────────────
function drawActiveRays(rays) {
  if (!rays || rays.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';

  // Batch by type to minimize shadow state changes
  for (let pass = 0; pass < 3; pass++) {
    const type = pass === 0 ? 'step' : pass === 1 ? 'pulse' : 'hazard';

    if (type === 'step') {
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(140,185,245,0.5)';
    } else if (type === 'pulse') {
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 9;
      ctx.shadowColor = 'rgba(160,210,255,0.75)';
    } else {
      ctx.lineWidth = 1.1;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(230,100,55,0.6)';
    }

    for (const ray of rays) {
      if (ray.type !== type) continue;

      // Draw sealed segments (bounced portions)
      for (const seg of ray.segments) {
        const alpha = seg.energy * 0.72;
        if (alpha < 0.01) continue;
        ctx.strokeStyle = rayColor(type, alpha);
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      // Draw live segment (tip currently advancing)
      const liveAlpha = ray.energy * 0.88;
      if (liveAlpha < 0.01) continue;
      ctx.strokeStyle = rayColor(type, liveAlpha);
      ctx.beginPath();
      ctx.moveTo(ray.segX, ray.segY);
      ctx.lineTo(ray.tipX, ray.tipY);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function rayColor(type, alpha) {
  if (type === 'hazard') return `rgba(230,105,55,${alpha.toFixed(3)})`;
  if (type === 'pulse')  return `rgba(185,220,255,${alpha.toFixed(3)})`;
  return                        `rgba(155,195,235,${alpha.toFixed(3)})`;
}

// ─── Player ───────────────────────────────────────────────────────────────────
function drawPlayer(player) {
  if (!player) return;
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  const grd = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 18);
  grd.addColorStop(0, 'rgba(255,255,255,0.1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(player.x, player.y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── Vignette ─────────────────────────────────────────────────────────────────
function drawVignette() {
  const grd = ctx.createRadialGradient(W/2, H/2, H * 0.28, W/2, H/2, H * 0.82);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
export function updateHUD(pulseCooldown, maxCooldown, levelIndex, totalLevels) {
  const fill  = document.getElementById('pulse-fill');
  const label = document.getElementById('level-label');
  if (!fill || !label) return;
  const progress = 1 - pulseCooldown / maxCooldown;
  fill.style.right = `${(1 - Math.max(0, Math.min(1, progress))) * 100}%`;
  label.textContent = `LEVEL ${levelIndex + 1} / ${totalLevels}`;
}

export function setHUDVisible(visible) {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.toggle('visible', visible);
}
