import { TILE, COLS, ROWS, W, H, WALL_FADE_MS, WAVE_RING_W,
         PLAYER_RADIUS, ENEMY_RADIUS, HAZARD_RADIUS } from './constants.js';

let canvas, ctx;

export function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
}

// ─── Wall reveal map ────────────────────────────────────────────────────────
// wallReveal[row][col] = last reveal timestamp (ms)
export function makeRevealMap(rows, cols) {
  return Array.from({ length: rows }, () => new Float64Array(cols).fill(-Infinity));
}

function wallAlpha(revealTime, now) {
  const age = now - revealTime;
  if (age >= WALL_FADE_MS) return 0;
  return 1 - age / WALL_FADE_MS;
}

// ─── Main draw call ─────────────────────────────────────────────────────────
export function draw(state, now) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state.screen !== 'playing' && state.screen !== 'paused' && state.screen !== 'levelup') return;

  const { grid, wallReveal, waves, player, enemies, hazards, exit } = state;

  // 1 – walls (revealed by waves)
  drawWalls(grid, wallReveal, now);

  // 2 – exit marker (faint glow, always slightly visible)
  drawExit(exit, now);

  // 3 – hazard zones (revealed by waves)
  drawHazards(hazards, now);

  // 4 – enemies (revealed by waves)
  drawEnemies(enemies, now);

  // 5 – wave rings
  drawWaves(waves);

  // 6 – player (always visible)
  drawPlayer(player);

  // 7 – dim vignette to add tension
  drawVignette();
}

function drawWalls(grid, wallReveal, now) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] !== 1) continue;
      const alpha = wallAlpha(wallReveal[row][col], now);
      if (alpha <= 0.01) continue;
      ctx.fillStyle = `rgba(72,80,92,${alpha * 0.9})`;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      // Subtle edge highlight
      ctx.strokeStyle = `rgba(130,145,165,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(col * TILE + 0.5, row * TILE + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawExit(exit, now) {
  if (!exit) return;
  const pulse = 0.4 + 0.2 * Math.sin(now / 600);
  const grd = ctx.createRadialGradient(exit.x, exit.y, 2, exit.x, exit.y, 22);
  grd.addColorStop(0, `rgba(80,220,120,${pulse})`);
  grd.addColorStop(1, 'rgba(80,220,120,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(160,255,180,${pulse * 0.8})`;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 4, 0, Math.PI * 2); ctx.fill();
}

function drawHazards(hazards, now) {
  for (const h of hazards) {
    const alpha = wallAlpha(h.revealedAt, now);
    if (alpha <= 0.01) continue;
    // Danger zone
    const grd = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.radius + 6);
    grd.addColorStop(0, `rgba(200,60,30,${alpha * 0.5})`);
    grd.addColorStop(1, 'rgba(180,50,20,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius + 6, 0, Math.PI * 2); ctx.fill();
    // Core
    ctx.fillStyle = `rgba(240,80,40,${alpha * 0.8})`;
    ctx.beginPath(); ctx.arc(h.x, h.y, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawEnemies(enemies, now) {
  for (const e of enemies) {
    const alpha = wallAlpha(e.revealedAt, now);
    if (alpha <= 0.01) continue;
    const isHunting = e.state === 'hunting';
    const baseColor = isHunting ? '220,40,40' : '180,50,50';
    const grd = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.radius + 8);
    grd.addColorStop(0, `rgba(${baseColor},${alpha * 0.6})`);
    grd.addColorStop(1, `rgba(${baseColor},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${baseColor},${alpha * 0.9})`;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    // Direction indicator
    if (e.waypoints) {
      const wp = e.waypoints[e.wpIdx || 0];
      if (wp) {
        const dx = wp.x - e.x, dy = wp.y - e.y;
        const len = Math.sqrt(dx*dx+dy*dy);
        if (len > 0.01) {
          ctx.strokeStyle = `rgba(${baseColor},${alpha * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + dx/len * 14, e.y + dy/len * 14); ctx.stroke();
        }
      }
    }
  }
}

function drawWaves(waves) {
  for (const w of waves) {
    if (w.radius <= 0) continue;
    const op = w.opacity();
    if (op <= 0.005) continue;
    let color;
    if (w.type === 'hazard') {
      color = `rgba(210,100,50,${op})`;
    } else if (w.type === 'pulse') {
      color = `rgba(190,210,255,${op})`;
    } else {
      color = `rgba(160,185,220,${op * 0.75})`;
    }
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = w.type === 'pulse' ? 2.5 : 1.5;
    ctx.stroke();
  }
}

function drawPlayer(player) {
  if (!player) return;
  const grd = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 18);
  grd.addColorStop(0, 'rgba(255,255,255,0.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(player.x, player.y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
}

function drawVignette() {
  const grd = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
export function updateHUD(pulseCooldown, maxCooldown, levelIndex, totalLevels) {
  const hud = document.getElementById('hud');
  const fill = document.getElementById('pulse-fill');
  const label = document.getElementById('level-label');
  if (!hud || !fill || !label) return;
  const progress = 1 - pulseCooldown / maxCooldown;
  fill.style.right = `${(1 - Math.max(0, Math.min(1, progress))) * 100}%`;
  label.textContent = `LEVEL ${levelIndex + 1} / ${totalLevels}`;
}

export function setHUDVisible(visible) {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.toggle('visible', visible);
}
