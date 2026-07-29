import { TILE, COLS, ROWS, W, H, WALL_FADE_MS,
         RAY_TRAIL_MS, IMPACT_FADE_MS,
         HEARING_NEAR, HEARING_FAR, CELL,
         CRUSHER_REVEAL_MS,
         FOOTPRINT_FADE_MS, FOOTPRINT_STANCE_OFF,
         PLAYER_IDLE_SPEED,
         RENDER_SCALE_MEDIUM, RENDER_SCALE_LOW } from './constants.js';
import { segPtDist } from './utils.js';
import * as Debug from './debug.js';
import { view, updateViewport, containScale, setRenderScale } from './viewport.js';

// How loudly the player "hears" something at distance d:
// 1 inside HEARING_NEAR, smoothstep down to 0 at HEARING_FAR
function hearing(d) {
  if (d <= HEARING_NEAR) return 1;
  if (d >= HEARING_FAR) return 0;
  const t = 1 - (d - HEARING_NEAR) / (HEARING_FAR - HEARING_NEAR);
  return t * t * (3 - 2 * t);
}

let canvas, ctx;

// ─── Adaptive quality (Phase 23) ──────────────────────────────────────────────
// _hq true = full effects (shadowBlur glows). medium/low tiers set it false so
// the per-frame shadowBlur compositing cost — the biggest GPU hit on mobile — is
// skipped entirely. `sb(v)` returns the blur value at high quality, 0 otherwise.
let _hq = true;
export function setQualityTier(tier) {
  _hq = (tier === 'high');
  // Reduced tiers also render fewer pixels — the cheapest fill-rate win now that
  // the canvas covers the whole screen at native resolution (Phase 31).
  const scale = tier === 'low'    ? RENDER_SCALE_LOW
              : tier === 'medium' ? RENDER_SCALE_MEDIUM
              : 1;
  if (setRenderScale(scale) && canvas) {
    // Re-derive the backing store at the new scale.
    const { w, h } = measure();
    updateViewport(w, h);
    applyCanvasSize();
    buildVignette();
  }
}
function sb(v) { return _hq ? v : 0; }

// Pre-rendered offscreen layer (built once) to avoid per-frame gradient allocation.
let _vignetteCanvas = null;   // full-screen vignette

// Built at the live view size — must be rebuilt whenever the viewport changes,
// or a stale cache smears/letterboxes across the new surface.
function buildVignette() {
  const vw = view.w, vh = view.h;
  const c = document.createElement('canvas');
  c.width = vw; c.height = vh;
  const g = c.getContext('2d');
  // Radius follows the shorter axis so the falloff reads the same on any aspect.
  const short = Math.min(vw, vh);
  const grd = g.createRadialGradient(vw/2, vh/2, short * 0.28, vw/2, vh/2, short * 0.82);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = grd;
  g.fillRect(0, 0, vw, vh);
  _vignetteCanvas = c;
}

// Size the backing store to the canvas's laid-out CSS size × the (clamped) DPR,
// then scale the context so all drawing stays in CSS-pixel logical space.
// CSS owns layout (#wrap is 100vw × 100dvh); we only measure it — that avoids the
// scrollbar / mobile-browser-chrome mismatches you get from window.innerWidth.
function applyCanvasSize() {
  canvas.width  = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

function measure() {
  const r = canvas.getBoundingClientRect();
  // Fall back to the window if layout hasn't resolved yet (e.g. display:none).
  return {
    w: r.width  || window.innerWidth,
    h: r.height || window.innerHeight,
  };
}

// Recompute viewport + resize the surface. Safe to call on every resize event.
export function handleResize() {
  const { w, h } = measure();
  if (!updateViewport(w, h)) return false;
  applyCanvasSize();
  buildVignette();
  return true;
}

export function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  const { w, h } = measure();
  updateViewport(w, h);
  applyCanvasSize();
  buildVignette();

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    // Some Android browsers report stale dimensions on the event itself.
    handleResize();
    setTimeout(handleResize, 150);
  });
  // Catches container-driven size changes that don't fire window resize.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(handleResize).observe(canvas);
  }
}

// ─── Segment batching + culling (perf) ────────────────────────────────────────
// Draw-call count and string churn dominated the frame when the screen filled
// with sound: ~500 echo trails plus a 64-ray pulse meant ~800 individual
// stroke() calls AND ~800 freshly-allocated `rgba(...)` strings (each with a
// toFixed(3)) every single frame.
//
// Two fixes, neither of which changes what you see:
//   1. Cull segments outside the visible camera rect. The camera shows only a
//      slice of the level, so a large share of trails were being submitted just
//      for the rasterizer to clip them away.
//   2. Quantize alpha into buckets and batch. Every segment sharing a colour and
//      bucket goes into ONE path stroked ONCE, with its colour looked up from a
//      table built at module load. ~800 draw calls collapse to a few dozen.
const ALPHA_BUCKETS = 64;
const SEG_TYPES = ['step', 'pulse', 'hazard', 'step-enemy'];

function typeIndex(t) {
  return t === 'pulse' ? 1 : t === 'hazard' ? 2 : t === 'step-enemy' ? 3 : 0;
}

function buildLut(rgb) {
  const lut = new Array(ALPHA_BUCKETS);
  for (let i = 0; i < ALPHA_BUCKETS; i++) {
    lut[i] = `rgba(${rgb},${((i + 0.5) / ALPHA_BUCKETS).toFixed(3)})`;
  }
  return lut;
}

// Trail palette and (slightly brighter) active-ray palette, indexed by SEG_TYPES.
const TRAIL_LUT = ['200,215,235', '225,238,255', '220,60,55', '190,55,50'].map(buildLut);
const RAY_LUT   = ['210,225,245', '230,240,255', '225,60,55', '210,60,55'].map(buildLut);

// Reusable coordinate bins — cleared per frame, never reallocated after warm-up.
const _bins = SEG_TYPES.map(() => Array.from({ length: ALPHA_BUCKETS }, () => []));

// Impact glints get their own bins: 4 colour classes (wall / danger / collapsible / door).
const IMPACT_CLASSES = ['wall', 'danger', 'collapsible', 'door'];
const IMPACT_LUT = ['225,238,255', '225,60,55', '185,200,220', '240,215,70'].map(buildLut);
const IMPACT_GLOW = ['rgba(210,225,250,0.55)', 'rgba(225,60,55,0.5)',
                     'rgba(185,200,220,0.5)', 'rgba(240,215,70,0.5)'];
const _impactBins = IMPACT_CLASSES.map(() => Array.from({ length: ALPHA_BUCKETS }, () => []));

// Visible world rect (set each frame from the camera), used for cheap AABB culls.
let _cullX1 = -Infinity, _cullY1 = -Infinity, _cullX2 = Infinity, _cullY2 = Infinity;

function setCullRect(x1, y1, x2, y2) {
  const m = 8; // margin so wide strokes near the edge aren't popped
  _cullX1 = x1 - m; _cullY1 = y1 - m; _cullX2 = x2 + m; _cullY2 = y2 + m;
}
function resetCullRect() {
  _cullX1 = _cullY1 = -Infinity; _cullX2 = _cullY2 = Infinity;
}

function segVisible(x1, y1, x2, y2) {
  if (x1 < _cullX1 && x2 < _cullX1) return false;
  if (x1 > _cullX2 && x2 > _cullX2) return false;
  if (y1 < _cullY1 && y2 < _cullY1) return false;
  if (y1 > _cullY2 && y2 > _cullY2) return false;
  return true;
}

function binInto(bins, ti, alpha, x1, y1, x2, y2) {
  let b = (alpha * ALPHA_BUCKETS) | 0;
  if (b < 0) b = 0; else if (b >= ALPHA_BUCKETS) b = ALPHA_BUCKETS - 1;
  bins[ti][b].push(x1, y1, x2, y2);
}
function binSeg(ti, alpha, x1, y1, x2, y2) {
  binInto(_bins, ti, alpha, x1, y1, x2, y2);
}

// Stroke every non-empty bucket of one class as a single batched path.
// `setup` runs once per class (lineWidth / shadow), only if that class has work.
function flushBinsOf(bins, names, lutSet, setup) {
  for (let t = 0; t < names.length; t++) {
    const buckets = bins[t];
    let any = false;
    for (let b = 0; b < ALPHA_BUCKETS; b++) if (buckets[b].length) { any = true; break; }
    if (!any) continue;
    if (setup) setup(names[t], t);
    const lut = lutSet[t];
    for (let b = 0; b < ALPHA_BUCKETS; b++) {
      const arr = buckets[b];
      if (arr.length === 0) continue;
      ctx.strokeStyle = lut[b];
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 4) {
        ctx.moveTo(arr[i], arr[i + 1]);
        ctx.lineTo(arr[i + 2], arr[i + 3]);
      }
      ctx.stroke();
      arr.length = 0;
    }
  }
}

function flushBins(lutSet, setup) {
  flushBinsOf(_bins, SEG_TYPES, lutSet, setup);
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
  ctx.clearRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, view.w, view.h);

  // Title screen: show demo pulse to communicate the core mechanic before play.
  // This one shows the whole 800×600 world, so it is contain-fitted and centred
  // rather than player-centred.
  if (state.screen === 'title') {
    const s = containScale();
    ctx.save();
    ctx.translate((view.w - W * s) / 2, (view.h - H * s) / 2);
    ctx.scale(s, s);
    resetCullRect();   // the title shows the whole world — nothing to cull
    drawEchoTrails(state.echoTrails || [], now, W / 2, H / 2);
    drawActiveRays(state.rays || [], W / 2, H / 2);
    ctx.restore();
    drawVignette();
    if (Debug.isEnabled()) Debug.draw(ctx, state, state.fps || 60);
    return;
  }

  if (state.screen !== 'playing' && state.screen !== 'paused' && state.screen !== 'levelup') return;

  const { impacts, rays, echoTrails, player, enemies, hazards, screamers, crushers, doors, keys, triggers, exit, playerInWater, grid, waterReveals, collapsibleReveals, shake, footprints, playerHeading } = state;
  const px = player ? player.x : W / 2;
  const py = player ? player.y : H / 2;

  // Player-centered camera: zoom in and follow the player so only a local portion
  // of the level is visible. Shake is applied in screen space, then the world is
  // scaled and translated so the player sits at the centre of the screen.
  // Zoom is derived per-device (viewport.js) so the visible world AREA is constant
  // across screen shapes — a wide phone sees wider but proportionally shorter.
  const zoom = view.zoom;
  const viewW = view.w / zoom, viewH = view.h / zoom;
  const camX = px - viewW / 2;
  const camY = py - viewH / 2;
  const shakeActive = shake && shake.timer > 0;
  // Everything outside this rect is off-screen; the draw helpers reject against it
  // before doing any per-segment maths (big win now that the camera shows only a
  // slice of the level while trails persist across the whole of it).
  setCullRect(camX, camY, camX + viewW, camY + viewH);
  ctx.save();
  if (shakeActive) ctx.translate(shake.x, shake.y);
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

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
  drawScreamers(screamers, now, px, py);
  drawEnemies(enemies, now, px, py);
  drawActiveRays(rays, px, py);
  if (playerInWater) drawWaterZone(player);
  drawFootprintTrail(footprints, now);   // the walking marker (prints that stay put)
  drawPlayerFeet(player, playerHeading || { x: 0, y: -1 }, grid);   // planted feet when standing

  ctx.restore();

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
    if (!segVisible(im.x, im.y, im.x, im.y)) continue;   // off-screen glints cost nothing
    const heard = hearing(Math.hypot(im.x - px, im.y - py));
    if (heard <= 0) continue;
    const t = 1 - age / IMPACT_FADE_MS;
    const fade = t * t * (3 - 2 * t); // smoothstep out
    const alpha = im.energy * fade * heard;
    if (alpha < 0.008) continue;

    // Tangent of the wall face = perpendicular to the normal
    const txv = -im.ny, tyv = im.nx;
    const len = 3 + im.energy * 6; // brighter hits leave longer marks

    let cls, mul;
    if (im.cellType === 'crusher')          { cls = 1; mul = 0.95; }
    else if (im.cellType === 'collapsible') { cls = 2; mul = 0.95; }
    else if (im.cellType === 'door')        { cls = 3; mul = 0.95; }
    else if (im.type === 'hazard')          { cls = 1; mul = 0.85; }
    else                                    { cls = 0; mul = 0.95; }

    binInto(_impactBins, cls, alpha * mul,
            im.x - txv * len, im.y - tyv * len,
            im.x + txv * len, im.y + tyv * len);
  }

  // One state change + one stroke per colour/alpha bucket instead of per glint.
  ctx.lineWidth = 1.4;
  flushBinsOf(_impactBins, IMPACT_CLASSES, IMPACT_LUT, (_name, i) => {
    ctx.shadowColor = IMPACT_GLOW[i];
    ctx.shadowBlur  = sb(6);
  });
  ctx.restore();
}

// ─── Exit marker — only visible after sound has touched it ──────────────────
function drawExit(exit, now) {
  if (!exit) return;
  const alpha = revealAlpha(exit.revealedAt, now);
  if (alpha < 0.004) return;
  const pulse = (0.5 + 0.25 * Math.sin(now / 500)) * alpha;
  ctx.save();
  ctx.shadowBlur = sb(14 * alpha);
  ctx.shadowColor = 'rgba(210,225,250,0.5)';
  const grd = ctx.createRadialGradient(exit.x, exit.y, 2, exit.x, exit.y, 20);
  grd.addColorStop(0, `rgba(225,238,255,${pulse.toFixed(3)})`);
  grd.addColorStop(1, 'rgba(225,238,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(exit.x, exit.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(245,250,255,${(pulse * 0.95).toFixed(3)})`;
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
    ctx.shadowBlur = sb(10 * alpha);
    ctx.shadowColor = `rgba(225,60,55,${alpha * 0.5})`;
    const grd = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.radius + 8);
    grd.addColorStop(0, `rgba(220,55,50,${alpha * 0.45})`);
    grd.addColorStop(1, 'rgba(220,55,50,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius + 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,80,70,${alpha})`;
    ctx.beginPath(); ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── Screamers ────────────────────────────────────────────────────────────────
function drawScreamers(screamers, now, px, py) {
  if (!screamers || !screamers.length) return;
  ctx.save();
  for (const s of screamers) {
    const heard = hearing(Math.hypot(s.x - px, s.y - py));
    if (heard <= 0) continue;
    const alpha = revealAlpha(s.revealedAt, now) * heard;
    if (alpha < 0.004) continue;
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    const r = s.triggered ? 'rgba(255,40,40' : 'rgba(230,70,60';
    ctx.shadowBlur = sb(14 * alpha * (s.triggered ? 1 : pulse));
    ctx.shadowColor = `${r},${(alpha * 0.6).toFixed(3)})`;
    // Outer glow ring
    const grd = ctx.createRadialGradient(s.x, s.y, 3, s.x, s.y, s.radius + 10);
    grd.addColorStop(0, `${r},${(alpha * 0.5).toFixed(3)})`);
    grd.addColorStop(1, `${r},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.radius + 10, 0, Math.PI * 2); ctx.fill();
    // Core dot
    ctx.fillStyle = `${r},${alpha.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill();
    // Radiating spikes (4 lines at 45° offsets) to distinguish from Hazard
    ctx.strokeStyle = `${r},${(alpha * 0.7).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 4) + i * (Math.PI / 2);
      const len = (s.triggered ? 12 : 8 + 4 * pulse);
      ctx.beginPath();
      ctx.moveTo(s.x + Math.cos(a) * 6, s.y + Math.sin(a) * 6);
      ctx.lineTo(s.x + Math.cos(a) * len, s.y + Math.sin(a) * len);
      ctx.stroke();
    }
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
      const coneColor = alerting ? '255,55,35' : '210,70,60';
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
    ctx.shadowBlur = sb(hunting ? 14 * alpha : 8 * alpha);
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
  ctx.shadowBlur = 0;
  for (let i = 0; i < trails.length; i++) {
    const t = trails[i];
    const age = now - t.createdAt;
    if (age >= RAY_TRAIL_MS) continue;
    // Cheap rejects first — cull before the sqrt in segPtDist.
    if (!segVisible(t.x1, t.y1, t.x2, t.y2)) continue;
    const heard = hearing(segPtDist(px, py, t.x1, t.y1, t.x2, t.y2));
    if (heard <= 0) continue;
    const p = 1 - age / RAY_TRAIL_MS;
    const fade = p * p * (3 - 2 * p); // smooth ease-out
    const alpha = t.energy * fade * 0.24 * heard;   // dimmed so the bright feet read (2026-07-20)
    if (alpha < 0.005) continue;
    binSeg(typeIndex(t.type), alpha, t.x1, t.y1, t.x2, t.y2);
  }
  flushBins(TRAIL_LUT, null);   // uniform width/no glow for trails — one setup for all
  ctx.restore();
}

// ─── Active rays ──────────────────────────────────────────────────────────────
function drawActiveRays(rays, px, py) {
  if (!rays || rays.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';

  // Single pass over the rays, binning by type + alpha; the batched flush then
  // applies each type's width/glow once instead of per segment.
  for (let r = 0; r < rays.length; r++) {
    const ray = rays[r];
    const ti = typeIndex(ray.type);
    const segs = ray.segments;
    for (let s = 0; s < segs.length; s++) {
      const seg = segs[s];
      if (!segVisible(seg.x1, seg.y1, seg.x2, seg.y2)) continue;
      const heard = hearing(segPtDist(px, py, seg.x1, seg.y1, seg.x2, seg.y2));
      const alpha = seg.energy * 0.5 * heard;   // dimmed so the bright feet read (2026-07-20)
      if (alpha < 0.01) continue;
      binSeg(ti, alpha, seg.x1, seg.y1, seg.x2, seg.y2);
    }
    // The live leading edge of the ray
    if (!segVisible(ray.segX, ray.segY, ray.tipX, ray.tipY)) continue;
    const heard = hearing(segPtDist(px, py, ray.segX, ray.segY, ray.tipX, ray.tipY));
    const liveAlpha = ray.energy * 0.62 * heard;
    if (liveAlpha < 0.01) continue;
    binSeg(ti, liveAlpha, ray.segX, ray.segY, ray.tipX, ray.tipY);
  }

  flushBins(RAY_LUT, type => {
    if (type === 'step') {
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = sb(4);
      ctx.shadowColor = 'rgba(210,225,250,0.5)';
    } else if (type === 'pulse') {
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = sb(9);
      ctx.shadowColor = 'rgba(220,235,255,0.75)';
    } else if (type === 'hazard') {
      ctx.lineWidth = 1.1;
      ctx.shadowBlur = sb(6);
      ctx.shadowColor = 'rgba(225,65,58,0.6)';
    } else {
      ctx.lineWidth = 0.9;
      ctx.shadowBlur = sb(4);
      ctx.shadowColor = 'rgba(210,60,55,0.5)';
    }
  });

  ctx.restore();
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
      ctx.fillStyle = `rgba(200,215,235,${(alpha * 0.18).toFixed(3)})`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = `rgba(200,215,235,${(alpha * 0.4).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    } else {
      ctx.fillStyle = `rgba(240,215,70,${(alpha * 0.32).toFixed(3)})`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = `rgba(245,220,80,${(alpha * 0.85).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = sb(8 * alpha);
      ctx.shadowColor = 'rgba(240,215,70,0.55)';
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
    ctx.shadowBlur = sb(12 * alpha);
    ctx.shadowColor = 'rgba(245,220,80,0.65)';
    const grd = ctx.createRadialGradient(key.x, key.y, 1, key.x, key.y, 14);
    grd.addColorStop(0, `rgba(245,225,90,${pulse.toFixed(3)})`);
    grd.addColorStop(1, 'rgba(245,220,80,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(key.x, key.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(250,235,120,${(pulse * 1.1 > 1 ? 1 : pulse * 1.1).toFixed(3)})`;
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
    ctx.shadowBlur = sb(22 * alpha);
    ctx.shadowColor = 'rgba(240,215,70,0.75)';
    const grd = ctx.createRadialGradient(tr.x, tr.y, 2, tr.x, tr.y, 28);
    grd.addColorStop(0, `rgba(245,225,90,${beat.toFixed(3)})`);
    grd.addColorStop(1, 'rgba(240,215,70,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, 28, 0, Math.PI * 2); ctx.fill();

    // Pulsing outer ring
    ctx.strokeStyle = `rgba(240,215,80,${(alpha * 0.6).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, 14 + beat * 6, 0, Math.PI * 2); ctx.stroke();

    // 4-point cross indicator
    ctx.strokeStyle = `rgba(250,230,120,${(alpha * 0.8).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = sb(8 * alpha);
    ctx.shadowColor = 'rgba(245,225,90,0.9)';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI / 2) + (now / 4000);
      const r0 = 5, r1 = 11;
      ctx.beginPath();
      ctx.moveTo(tr.x + Math.cos(a) * r0, tr.y + Math.sin(a) * r0);
      ctx.lineTo(tr.x + Math.cos(a) * r1, tr.y + Math.sin(a) * r1);
      ctx.stroke();
    }

    // Bright center dot
    ctx.shadowBlur = sb(12 * alpha);
    ctx.fillStyle = `rgba(252,240,150,${Math.min(1, beat * 1.2).toFixed(3)})`;
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
    ctx.fillStyle = `rgba(225,60,55,${(alpha * 0.55).toFixed(3)})`;
    ctx.fillRect(b.x1, b.y1, TILE, TILE);
    ctx.strokeStyle = `rgba(235,75,68,${(alpha * 0.85).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = sb(8 * alpha);
    ctx.shadowColor = 'rgba(225,60,55,0.6)';
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
    ctx.fillStyle = `rgba(185,200,220,${(alpha * 0.45).toFixed(3)})`;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = `rgba(200,213,230,${(alpha * 0.7).toFixed(3)})`;
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
    ctx.fillStyle = `rgba(60,120,220,${(alpha * 0.4).toFixed(3)})`;
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
  ctx.restore();
}

// ─── Player water ambient — tiny glow from the player's own splash ────────────
function drawWaterZone(player) {
  if (!player) return;
  ctx.save();
  const grd = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 28);
  grd.addColorStop(0, 'rgba(70,140,235,0.45)');
  grd.addColorStop(1, 'rgba(60,120,220,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Footprints ───────────────────────────────────────────────────────────────
// A recognizable foot mark pointing along `angle` (heading): an elongated sole
// (ball), a separate rounded heel behind it, and three small toe pads at the
// front. `scale` drives the "stamp" animation on each footfall.
const FOOT_POP_MS = 150;   // duration of the press-in animation
function drawFoot(x, y, angle, alpha, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = `rgba(235,243,255,${alpha.toFixed(3)})`;
  ctx.beginPath(); ctx.ellipse(1.6, 0, 4.6, 2.9, 0, 0, Math.PI * 2); ctx.fill();   // sole / ball
  ctx.beginPath(); ctx.ellipse(-4.9, 0, 2.4, 2.2, 0, 0, Math.PI * 2); ctx.fill();  // heel
  for (const ty of [-2.0, 0, 2.0]) {                                               // toe pads
    ctx.beginPath(); ctx.ellipse(6.0, ty, 1.05, 0.85, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Stamp-in easing: returns { scale, mul } for a mark of the given age (ms).
// Foot lands slightly enlarged and semi-transparent, then presses to full.
function footStamp(age) {
  const p = Math.min(1, Math.max(0, age) / FOOT_POP_MS);
  const e = 1 - (1 - p) * (1 - p);   // ease-out (0 at footfall → 1 settled)
  return { scale: 1.32 - 0.32 * e, mul: 0.35 + 0.65 * e, e };
}

// True when (x,y) sits in a solid cell (wall / collapsible / closed door — closed
// doors are written into the grid as WALL). Used so feet never land on a wall.
function footInWall(grid, x, y) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  const cell = grid && grid[r] ? grid[r][c] : undefined;
  return cell === CELL.WALL || cell === CELL.COLLAPSIBLE;
}
function drawFootClear(grid, x, y, angle, alpha, scale = 1) {
  if (footInWall(grid, x, y)) return;
  drawFoot(x, y, angle, alpha, scale);
}

// The walking representation: a line of discrete footprints that stay where they
// landed and progress one in front of the other. Each stamps in (press) then
// fades out over its lifetime; the freshest is brightest, so the "current" foot
// stands out and the older ones recede — a natural gait rhythm.
function drawFootprintTrail(footprints, now) {
  if (!footprints || footprints.length === 0) return;
  ctx.save();
  for (const f of footprints) {
    const age = now - f.createdAt;
    if (age >= FOOTPRINT_FADE_MS) continue;
    const t = 1 - age / FOOTPRINT_FADE_MS;
    const st = footStamp(age);
    const alpha = (0.15 + 0.80 * t) * st.mul;   // bright & fresh → fading; stamps in
    if (alpha < 0.01) continue;
    drawFoot(f.x, f.y, f.angle, alpha, st.scale);
  }
  ctx.restore();
}

// ─── Player (drawn purely as footsteps — no dot) ─────────────────────────────
// While WALKING the player is shown by the moving footprint trail (above), which
// stays where each foot landed. While STANDING we plant both feet at the current
// position. A soft dark backing under the standing feet keeps them legible.
function drawPlayerFeet(player, heading, grid) {
  if (!player) return;
  const speed = Math.hypot(player.vx || 0, player.vy || 0);
  if (speed >= PLAYER_IDLE_SPEED) return;   // walking → the trail is the marker

  ctx.save();
  // Backing shadow — a small dark disc that dims the rays converging on the player
  const r = 18;
  const grd = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, r);
  grd.addColorStop(0, 'rgba(0,0,0,0.7)');
  grd.addColorStop(0.6, 'rgba(0,0,0,0.48)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI * 2); ctx.fill();

  const a = Math.atan2(heading.y, heading.x);
  const perpX = -heading.y, perpY = heading.x;   // left of forward
  const LAT = FOOTPRINT_STANCE_OFF;
  // Standing: both feet, side by side, steady
  drawFootClear(grid, player.x + perpX * LAT, player.y + perpY * LAT, a, 0.95);
  drawFootClear(grid, player.x - perpX * LAT, player.y - perpY * LAT, a, 0.95);
  ctx.restore();
}

// ─── Vignette ─────────────────────────────────────────────────────────────────
// Pre-rendered once (buildVignette) and blitted each frame — avoids recreating
// the radial gradient every frame (Phase 23).
function drawVignette() {
  if (!_vignetteCanvas) buildVignette();
  ctx.drawImage(_vignetteCanvas, 0, 0);
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
