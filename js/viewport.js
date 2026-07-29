// Runtime viewport (Phase 31).
//
// The game world is a fixed 800×600 level grid (`W`/`H` in constants.js). The
// *screen* is not: on phones it is whatever the device gives us (~19.5:9 in
// landscape). Before Phase 31 the canvas was locked to the world's 4:3 shape,
// which pillarboxed the game into ~60% of a modern phone screen and left the
// side bars dead to touch.
//
// This module owns the live screen-space dimensions and the camera zoom that
// maps world → screen. Everything screen-space (camera transform, vignette,
// touch mapping) reads from here; `W`/`H` now strictly mean *world* size.
//
// ── Fairness invariant ──────────────────────────────────────────────────────
// A wide phone must not see more of the level than a narrow one, or the game
// gets easier on wider hardware. So we hold the visible world *area* constant
// at the original baseline (800/2 × 600/2 = 120000 px² at CAMERA_ZOOM 2) and
// let only the *shape* change:
//
//     zoom = sqrt(viewW * viewH / VIEW_BASE_AREA)
//
// A 915×412 phone then sees 516×232 world px (area ≈ 120k) — wider than the
// 400×300 baseline, but proportionally shorter. Same area, different shape.

import { W, H, CAMERA_ZOOM,
         VIEW_ZOOM_MIN, VIEW_ZOOM_MAX, RENDER_PIXEL_BUDGET, RENDER_DPR_MAX } from './constants.js';

// Baseline visible world area — what the game was tuned against at 800×600.
const VIEW_BASE_AREA = (W / CAMERA_ZOOM) * (H / CAMERA_ZOOM);

// Live view state. `w`/`h` are CSS pixels (logical drawing space); `dpr` is the
// backing-store scale actually used (clamped for fill-rate, not raw devicePixelRatio).
export const view = {
  w: W,
  h: H,
  dpr: 1,
  zoom: CAMERA_ZOOM,
};

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// Adaptive resolution multiplier, driven by the quality tier (Phase 23).
// 1 = render at full device resolution; lower tiers render fewer pixels.
let _renderScale = 1;
export function setRenderScale(s) {
  const next = clamp(s, 0.5, 1);
  if (next === _renderScale) return false;
  _renderScale = next;
  return true;
}

// Largest backing-store scale that keeps total pixels within budget. Rendering
// at full device DPR on a modern phone can be 2–3× the old 800×600 fill cost,
// so this is capped rather than trusted.
function pickDpr(cssW, cssH) {
  const device = window.devicePixelRatio || 1;
  const byBudget = Math.sqrt(RENDER_PIXEL_BUDGET / Math.max(1, cssW * cssH));
  const base = Math.min(device, RENDER_DPR_MAX, byBudget);
  return clamp(base * _renderScale, 0.5, RENDER_DPR_MAX);
}

// Recompute view state from the current window size. Returns true if anything
// changed (so callers can rebuild size-dependent caches like the vignette).
export function updateViewport(cssW = window.innerWidth, cssH = window.innerHeight) {
  const w = Math.max(1, Math.round(cssW));
  const h = Math.max(1, Math.round(cssH));
  const dpr = pickDpr(w, h);
  const zoom = clamp(Math.sqrt((w * h) / VIEW_BASE_AREA), VIEW_ZOOM_MIN, VIEW_ZOOM_MAX);

  const changed = (w !== view.w || h !== view.h || dpr !== view.dpr || zoom !== view.zoom);
  view.w = w; view.h = h; view.dpr = dpr; view.zoom = zoom;
  return changed;
}

// Screen-space centre — the player is always drawn here (camera centres on them).
export function centreX() { return view.w / 2; }
export function centreY() { return view.h / 2; }

// Scale that fits the whole 800×600 world inside the viewport (used by the
// title screen's demo pulse, which shows the level as a whole rather than a
// player-centred slice).
export function containScale() {
  return Math.min(view.w / W, view.h / H);
}
