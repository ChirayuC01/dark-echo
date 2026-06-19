import { TILE, COLS, ROWS, W, H, WALL_FADE_MS,
         RAY_TRAIL_MS, IMPACT_FADE_MS,
         HEARING_NEAR, HEARING_FAR, CELL,
         CRUSHER_REVEAL_MS } from './constants.js';
import { segPtDist } from './utils.js';
import * as Debug from './debug.js';

// How loudly the player "hears" something at distance d:
// 1 inside HEARING_NEAR, smoothstep down to 0 at HEARING_FAR
function hearing(d) {
  if (d <= HEARING_NEAR) return 1;
  if (d >= HEARING_FAR) return 0;
  const t = 1 - (d - HEARING_NEAR) / (HEARING_FAR - HEARING_NEAR);
  return t * t * (3 - 2 * t);
}

let canvas, ctx;

export function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = true;
}

// Smoothstep fade used for entity reveals
function revealAlpha(revealTime, now) {
  const age = now - revealTime;
  if (age >= WALL_FADE_MS) return 0;
  const t = 1 - age / WALL_FADE_MS;
  return t * t * (3 - 2 * t);
}

// ─── Main draw ────────────────────────────────────────────────────────────────
export function draw(state, now) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Title screen: show demo pulse to communicate the core mechanic before play
  if (state.screen === 'title') {
    drawEchoTrails(state.echoTrails || [], now, W / 2, H / 2);
    drawActiveRays(state.rays || [], W / 2, H / 2);
    drawVignette();
    if (Debug.isEnabled()) Debug.draw(ctx, state, state.fps || 60);
    return;
  }

  if (state.screen !== 'playing' && state.screen !== 'paused' && state.screen !== 'levelup') return;

  const { impacts, rays, echoTrails, player, enemies, hazards, crushers, doors, keys, triggers, exit, playerInWater, grid, waterReveals, collapsibleReveals } = state;
  const px = player ? player.x : W / 2;
  const py = player ? player.y : H / 2;

  // Walls are intentionally never drawn — the world exists only as sound,
  // and all sound is rendered relative to how close the player is to it.
  drawRevealedWater(grid, waterReveals, now);
  drawRevealedCollapsible(grid, collapsibleReveals, now);
  drawEchoTrails(echoTrails, now, px, py);
  drawImpacts(impacts, now, px, py);
  drawExit(exit, now);
  drawDoors(doors, now, px, py);
  drawKeys(keys, now, px, py);
  drawTriggers(triggers, now, px, py);
  drawCrushers(crushers, now, px, py);
  drawHazards(hazards, now, px, py);
  drawEnemies(enemies, now, px, py);
  drawActiveRays(rays, px, py);
  if (playerInWater) drawWaterZone(player);
  drawPlayer(player);
  drawVignette();
  if (Debug.isEnabled()) Debug.draw(ctx, state, state.fps || 60);
}

// ─── Wall impact glints ───────────────────────────────────────────────────────
// A short bright line along the wall surface where a ray struck,
// fading slowly — this is the only way the player ever "sees" a wall.
function drawImpacts(impacts, now, px, py) {
  if (!impacts || impacts.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';

  for (const im of impacts) {
    const age = now - im.createdAt;
    if (age >= IMPACT_FADE_MS) continue;
    const heard = hearing(Math.hypot(im.x - px, im.y - py));
    if (heard <= 0) continue;
    const t = 1 - age / IMPACT_FADE_MS;
    const fade = t * t * (3 - 2 * t); // smoothstep out
    const alpha = im.energy * fade * heard;
    if (alpha < 0.008) continue;

    // Tangent of the wall face = perpendicular to the normal
    const txv = -im.ny, tyv = im.nx;
    const len = 3 + im.energy * 6; // brighter hits leave longer marks

    if (im.cellType === 'crusher') {
      ctx.strokeStyle = `rgba(230,105,55,${(alpha * 0.95).toFixed(3)})`;
      ctx.shadowColor = 'rgba(230,105,55,0.5)';
    } else if (im.cellType === 'collapsible') {
      ctx.strokeStyle = `rgba(200,175,120,${(alpha * 0.95).toFixed(3)})`;
      ctx.shadowColor = 'rgba(200,175,120,0.5)';
    } else if (im.cellType === 'door') {
      ctx.strokeStyle = `rgba(210,160,50,${(alpha * 0.95).toFixed(3)})`;
      ctx.shadowColor = 'rgba(210,160,50,0.5)';
    } else if (im.type === 'hazard') {
      ctx.strokeStyle = `rgba(225,100,50,${(alpha * 0.85).toFixed(3)})`;
      ctx.shadowColor = 'rgba(225,100,50,0.5)';
    } else {
      ctx.strokeStyle = `rgba(225,238,255,${(alpha * 0.95).toFixed(3)})`;
      ctx.shadowColor = 'rgba(170,205,255,0.55)';
    }
    ctx.shadowBlur = 6 * fade;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(im.x - txv * len, im.y - tyv * len);
    ctx.lineTo(im.x + txv * len, im.y + tyv * len);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Exit marker — only visible after sound has touched it ──────────────────
function drawExit(exit, now) {
  if (!exit) return;
  const alpha = revealAlpha(exit.revealedAt, now);
  if (alpha < 0.004) return;
  const pulse = (0.5 + 0.25 * Math.sin(now / 500)) * alpha;
  ctx.save();
  ctx.shadowBlur = 14 * alpha;
  ctx.shadowColor = 'rgba(60,220,110,0.5)';
  const grd = ctx.createRadialGradient(exit.x, exit.y, 2, exit.x, exit.y, 20);
  grd.addColorStop(0, `rgba(80,220,120,${pulse.toFixed(3)})`);
  grd.addColorStop(1, 'rgba(80,220,120,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(160,255,180,${(pulse * 0.95).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── Hazards ──────────────────────────────────────────────────────────────────
function drawHazards(hazards, now, px, py) {
  ctx.save();
  for (const h of hazards) {
    const heard = hearing(Math.hypot(h.x - px, h.y - py));
    if (heard <= 0) continue;
    const alpha = revealAlpha(h.revealedAt, now) * heard;
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
// Each enemy type has a distinct shape to aid identification under pressure:
//   patrol  → directional arrowhead triangle (movement cue)
//   chaser  → dot + concentric ring (brightens when hunting)
//   stalker → dot + 3 rotating arcs at 120° (sound-detection cue)
//   sentry  → scan cone + plain dot (cone is its own distinctive mark)
function drawEnemies(enemies, now, px, py) {
  ctx.save();
  for (const e of enemies) {
    const heard = hearing(Math.hypot(e.x - px, e.y - py));
    if (heard <= 0) continue;
    const alpha = revealAlpha(e.revealedAt, now) * heard;
    if (alpha < 0.004) continue;

    // Sentry scan cone — drawn before dot so dot appears on top
    if (e.scanRange !== undefined) {
      const alerting = e.state === 'alert';
      const coneColor = alerting ? '255,55,35' : '220,100,50';
      const coneAlpha = alerting ? alpha * 0.30 : alpha * 0.14;
      if (e.state !== 'stunned') {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, e.scanRange, e.angle - e.scanArc / 2, e.angle + e.scanArc / 2);
        ctx.closePath();
        ctx.fillStyle = `rgba(${coneColor},${coneAlpha.toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${coneColor},${(coneAlpha * 1.8).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
    }

    const hunting = e.state === 'hunting' || e.state === 'alert';
    const base = hunting ? '230,45,45' : '185,55,55';

    // Outer glow (shared by all types)
    ctx.shadowBlur = hunting ? 14 * alpha : 8 * alpha;
    ctx.shadowColor = `rgba(${base},${alpha * 0.7})`;
    const grd = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.radius + 9);
    grd.addColorStop(0, `rgba(${base},${alpha * 0.55})`);
    grd.addColorStop(1, `rgba(${base},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 9, 0, Math.PI * 2); ctx.fill();

    if (e.shape === 'patrol') {
      // Arrowhead triangle pointing toward current waypoint target
      const wp = e.waypoints && e.waypoints[e.wpIdx || 0];
      if (wp) {
        const dx = wp.x - e.x, dy = wp.y - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1) {
          const nx = dx / d, ny = dy / d;
          const tx = -ny, ty = nx; // perpendicular tangent
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${base},${alpha * 0.92})`;
          ctx.beginPath();
          ctx.moveTo(e.x + nx * 10,                    e.y + ny * 10);
          ctx.lineTo(e.x + tx * 5  - nx * 3,           e.y + ty * 5  - ny * 3);
          ctx.lineTo(e.x - tx * 5  - nx * 3,           e.y - ty * 5  - ny * 3);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(${base},${(alpha * 0.7).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill();

    } else if (e.shape === 'chaser') {
      // Dot + pulsing outer ring that brightens rapidly when hunting
      ctx.fillStyle = `rgba(${base},${alpha * 0.92})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      const ringPulse = hunting ? (1 + 0.18 * Math.sin(now / 180)) : 1;
      const ringAlpha = hunting ? alpha * 0.80 : alpha * 0.22;
      ctx.strokeStyle = `rgba(${base},${ringAlpha.toFixed(3)})`;
      ctx.lineWidth = hunting ? 1.8 : 1.0;
      ctx.beginPath();
      ctx.arc(e.x, e.y, (e.radius + 6) * ringPulse, 0, Math.PI * 2);
      ctx.stroke();

    } else if (e.shape === 'stalker') {
      // Dot + 3 rotating arcs at 120° — communicates sound detection
      ctx.fillStyle = `rgba(${base},${alpha * 0.92})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      const arcRot   = now / (hunting ? 1200 : 1800);
      const arcR     = hunting ? e.radius + 11 : e.radius + 7;
      const arcAlpha = hunting ? alpha * 0.72 : alpha * 0.36;
      ctx.strokeStyle = `rgba(${base},${arcAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        const a = arcRot + (i * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(e.x, e.y, arcR, a - 0.38, a + 0.38);
        ctx.stroke();
      }

    } else {
      // Sentry / fallback: plain dot (sentry is already distinguished by its cone)
      ctx.fillStyle = `rgba(${base},${alpha * 0.92})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Echo trails — long, slow fade so the map lingers in memory ──────────────
function drawEchoTrails(trails, now, px, py) {
  if (!trails || trails.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.7;
  for (const t of trails) {
    const age = now - t.createdAt;
    if (age >= RAY_TRAIL_MS) continue;
    const heard = hearing(segPtDist(px, py, t.x1, t.y1, t.x2, t.y2));
    if (heard <= 0) continue;
    const p = 1 - age / RAY_TRAIL_MS;
    const fade = p * p * (3 - 2 * p); // smooth ease-out
    const alpha = t.energy * fade * 0.34 * heard;
    if (alpha < 0.005) continue;

    if (t.type === 'hazard') {
      ctx.strokeStyle = `rgba(215,95,45,${alpha.toFixed(3)})`;
    } else if (t.type === 'pulse') {
      ctx.strokeStyle = `rgba(175,210,255,${alpha.toFixed(3)})`;
    } else {
      ctx.strokeStyle = `rgba(145,180,225,${alpha.toFixed(3)})`;
    }
    ctx.beginPath();
    ctx.moveTo(t.x1, t.y1);
    ctx.lineTo(t.x2, t.y2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Active rays ──────────────────────────────────────────────────────────────
function drawActiveRays(rays, px, py) {
  if (!rays || rays.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';

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

      for (const seg of ray.segments) {
        const heard = hearing(segPtDist(px, py, seg.x1, seg.y1, seg.x2, seg.y2));
        const alpha = seg.energy * 0.72 * heard;
        if (alpha < 0.01) continue;
        ctx.strokeStyle = rayColor(type, alpha);
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      const heard = hearing(segPtDist(px, py, ray.segX, ray.segY, ray.tipX, ray.tipY));
      const liveAlpha = ray.energy * 0.88 * heard;
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

// ─── Doors — amber when locked, faint green when open ────────────────────────
function drawDoors(doors, now, px, py) {
  if (!doors || !doors.size) return;
  ctx.save();
  for (const [, door] of doors) {
    const alpha = revealAlpha(door.revealedAt, now) * hearing(Math.hypot(door.x - px, door.y - py));
    if (alpha < 0.004) continue;
    const x = door.col * TILE, y = door.row * TILE;
    if (door.open) {
      ctx.fillStyle = `rgba(80,210,120,${(alpha * 0.18).toFixed(3)})`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = `rgba(80,210,120,${(alpha * 0.4).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    } else {
      ctx.fillStyle = `rgba(210,160,50,${(alpha * 0.32).toFixed(3)})`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = `rgba(230,175,60,${(alpha * 0.85).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8 * alpha;
      ctx.shadowColor = 'rgba(220,160,50,0.55)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  ctx.restore();
}

// ─── Keys — gold pulsing dot, only visible when revealed by sound ─────────────
function drawKeys(keys, now, px, py) {
  if (!keys || !keys.size) return;
  ctx.save();
  for (const [, key] of keys) {
    if (key.collected) continue;
    const alpha = revealAlpha(key.revealedAt, now) * hearing(Math.hypot(key.x - px, key.y - py));
    if (alpha < 0.004) continue;
    const pulse = (0.5 + 0.25 * Math.sin(now / 400)) * alpha;
    ctx.shadowBlur = 12 * alpha;
    ctx.shadowColor = 'rgba(255,210,80,0.65)';
    const grd = ctx.createRadialGradient(key.x, key.y, 1, key.x, key.y, 14);
    grd.addColorStop(0, `rgba(255,225,100,${pulse.toFixed(3)})`);
    grd.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(key.x, key.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,240,130,${(pulse * 1.1 > 1 ? 1 : pulse * 1.1).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(key.x, key.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── Switches / Triggers — bright blue-white pulsing dot, hidden until sound finds it ─
function drawTriggers(triggers, now, px, py) {
  if (!triggers || triggers.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const tr of triggers) {
    if (tr.fired) continue;
    const alpha = revealAlpha(tr.revealedAt, now) * hearing(Math.hypot(tr.x - px, tr.y - py));
    if (alpha < 0.004) continue;
    const beat = (0.35 + 0.45 * Math.sin(now / 350)) * alpha;  // wider swing than keys

    // Outer glow
    ctx.shadowBlur = 22 * alpha;
    ctx.shadowColor = 'rgba(100,160,255,0.75)';
    const grd = ctx.createRadialGradient(tr.x, tr.y, 2, tr.x, tr.y, 28);
    grd.addColorStop(0, `rgba(140,200,255,${beat.toFixed(3)})`);
    grd.addColorStop(1, 'rgba(100,160,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, 28, 0, Math.PI * 2); ctx.fill();

    // Pulsing outer ring
    ctx.strokeStyle = `rgba(120,180,255,${(alpha * 0.6).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, 14 + beat * 6, 0, Math.PI * 2); ctx.stroke();

    // 4-point cross indicator
    ctx.strokeStyle = `rgba(170,220,255,${(alpha * 0.8).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8 * alpha;
    ctx.shadowColor = 'rgba(140,200,255,0.9)';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI / 2) + (now / 4000);
      const r0 = 5, r1 = 11;
      ctx.beginPath();
      ctx.moveTo(tr.x + Math.cos(a) * r0, tr.y + Math.sin(a) * r0);
      ctx.lineTo(tr.x + Math.cos(a) * r1, tr.y + Math.sin(a) * r1);
      ctx.stroke();
    }

    // Bright center dot
    ctx.shadowBlur = 12 * alpha;
    ctx.fillStyle = `rgba(200,230,255,${Math.min(1, beat * 1.2).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── Crushers — orange lethal moving blocks, revealed only by ray contact ─────
function crusherRevealAlpha(revealTime, now) {
  const age = now - revealTime;
  if (age >= CRUSHER_REVEAL_MS) return 0;
  const t = 1 - age / CRUSHER_REVEAL_MS;
  return t * t * (3 - 2 * t);
}

function drawCrushers(crushers, now, px, py) {
  if (!crushers || crushers.length === 0) return;
  ctx.save();
  for (const c of crushers) {
    const alpha = crusherRevealAlpha(c.revealedAt, now) * hearing(Math.hypot(c.x - px, c.y - py));
    if (alpha < 0.004) continue;
    const b = c.bounds();
    ctx.fillStyle = `rgba(230,105,55,${(alpha * 0.55).toFixed(3)})`;
    ctx.fillRect(b.x1, b.y1, TILE, TILE);
    ctx.strokeStyle = `rgba(240,120,65,${(alpha * 0.85).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8 * alpha;
    ctx.shadowColor = 'rgba(230,105,55,0.6)';
    ctx.strokeRect(b.x1 + 0.5, b.y1 + 0.5, TILE - 1, TILE - 1);
  }
  ctx.restore();
}

// ─── Revealed collapsible walls — warm tan block where sound has touched ──────
function drawRevealedCollapsible(grid, collapsibleReveals, now) {
  if (!collapsibleReveals || !collapsibleReveals.size) return;
  ctx.save();
  for (const [key, revealTime] of collapsibleReveals) {
    const alpha = revealAlpha(revealTime, now);
    if (alpha < 0.004) continue;
    const [r, c] = key.split(',').map(Number);
    if (grid[r]?.[c] !== CELL.COLLAPSIBLE) continue; // already collapsed
    const x = c * TILE, y = r * TILE;
    ctx.fillStyle = `rgba(200,175,120,${(alpha * 0.45).toFixed(3)})`;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = `rgba(220,195,140,${(alpha * 0.7).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }
  ctx.restore();
}

// ─── Revealed water tiles — faint teal where sound waves have passed ─────────
function drawRevealedWater(grid, waterReveals, now) {
  if (!waterReveals || !waterReveals.size) return;
  ctx.save();
  for (const [key, revealTime] of waterReveals) {
    const alpha = revealAlpha(revealTime, now);
    if (alpha < 0.004) continue;
    const [r, c] = key.split(',').map(Number);
    ctx.fillStyle = `rgba(50,150,160,${(alpha * 0.4).toFixed(3)})`;
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
  ctx.restore();
}

// ─── Player water ambient — tiny glow from the player's own splash ────────────
function drawWaterZone(player) {
  if (!player) return;
  ctx.save();
  const grd = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 28);
  grd.addColorStop(0, 'rgba(50,180,190,0.45)');
  grd.addColorStop(1, 'rgba(50,150,160,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
export function updateHUD(pulseCooldown, maxCooldown, levelIndex, totalLevels, crouching = false) {
  const fill      = document.getElementById('pulse-fill');
  const label     = document.getElementById('level-label');
  const crouchInd = document.getElementById('crouch-indicator');
  if (!fill || !label) return;
  const progress = 1 - pulseCooldown / maxCooldown;
  fill.style.right = `${(1 - Math.max(0, Math.min(1, progress))) * 100}%`;
  label.textContent = `LEVEL ${levelIndex + 1} / ${totalLevels}`;
  if (crouchInd) crouchInd.classList.toggle('active', crouching);
}

export function setHUDVisible(visible) {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.toggle('visible', visible);
}
