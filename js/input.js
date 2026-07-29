// Input — keyboard + Dark Echo-style touch controls.
//
// Touch model (matches the original Dark Echo, mapped to our fixed 800×600 view):
//   • WALK  — press-and-hold AWAY from the feet; the player walks toward your
//             finger (steer by dragging). Normal footsteps. Direction is taken
//             from the player → finger, so you head toward where you touch.
//   • SNEAK — a quick TAP away from the feet takes one quiet, crouched step
//             toward the tap. Tap repeatedly to creep. (Quieter, fewer rays.)
//   • STOMP — press-and-hold ON the feet, then LET GO → one pulse. Only fires
//             when you're not walking (i.e. standing still), like the original.

import { view } from './viewport.js';

const keys = new Set();
let _pulsePressed  = false;
let _pausePressed  = false;
let _crouching     = false;   // keyboard crouch (Shift / C)
let _debugToggle   = false;

// Distances below are in CSS pixels of the live viewport (Phase 31 — the canvas
// is no longer a fixed 800×600 surface, it fills the screen).
const TAP_MAX_HOLD   = 160;   // ms — released before this (with little drag) = a sneak tap
const DRAG_COMMIT    = 12;    // px — dragging this far commits to walking immediately
const SNEAK_DECAY    = 320;   // ms — how long one sneak tap keeps the player crouch-stepping
const STOMP_RADIUS   = 44;    // px — pressing within this of the feet is a stomp, not a walk
const STOMP_MIN_HOLD = 110;   // ms — min press-on-feet time before release counts as a stomp
const WALK_DEADZONE  = 8;     // px — finger nearer than this to the feet = stop (no walk)

let canvasEl = null;
let _playerX = -1000, _playerY = -1000; // player position in canvas space (set each frame)

// The active walk/steer touch (started away from the feet).
const move = { id: null, startX: 0, startY: 0, curX: 0, curY: 0, startTime: 0, committed: false };
// Sneak state from a quick tap: crouch-step toward a direction for a short window.
const sneak = { active: false, dx: 0, dy: 0, until: 0 };
// The stomp touch (started on the feet); fires a pulse on release.
const stomp = { id: null, startTime: 0 };

// Map a client point into the canvas's logical (CSS-pixel) drawing space.
// The canvas now fills the viewport, so this is near-identity — the ratio is kept
// so it stays correct if the CSS size and backing store ever diverge.
function canvasToLocal(clientX, clientY) {
  const r = canvasEl.getBoundingClientRect();
  if (!r.width || !r.height) return { x: clientX, y: clientY };
  return {
    x: (clientX - r.left) / r.width  * view.w,
    y: (clientY - r.top)  / r.height * view.h,
  };
}

// A walk touch counts as "walking" once it's been held past the tap threshold
// or dragged far enough — before that it's still ambiguous (could be a sneak tap).
function walkTouchActive(now) {
  if (move.id === null) return false;
  return move.committed || (now - move.startTime >= TAP_MAX_HOLD);
}

export function init() {
  window.addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space')    { e.preventDefault(); _pulsePressed = true; }
    if (e.code === 'Escape' || e.code === 'KeyP') _pausePressed = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') _crouching = true;
    if (e.code === 'Backquote') _debugToggle = true;
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') _crouching = false;
  });

  canvasEl = document.getElementById('canvas');
  if (!canvasEl) return;

  canvasEl.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = canvasToLocal(t.clientX, t.clientY);
      const distToFeet = Math.hypot(p.x - _playerX, p.y - _playerY);
      if (distToFeet <= STOMP_RADIUS && stomp.id === null) {
        // Press on the feet → a potential stomp (fires on release)
        stomp.id = t.identifier;
        stomp.startTime = performance.now();
      } else if (move.id === null) {
        // Press away from the feet → walk/sneak toward this point
        move.id = t.identifier;
        move.startX = move.curX = p.x;
        move.startY = move.curY = p.y;
        move.startTime = performance.now();
        move.committed = false;
      }
    }
  }, { passive: false });

  canvasEl.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === move.id) {
        const p = canvasToLocal(t.clientX, t.clientY);
        move.curX = p.x; move.curY = p.y;
        if (Math.hypot(p.x - move.startX, p.y - move.startY) >= DRAG_COMMIT) move.committed = true;
      }
    }
  }, { passive: false });

  const endTouch = e => {
    for (const t of e.changedTouches) {
      if (t.identifier === stomp.id) {
        const held = performance.now() - stomp.startTime;
        // Stomp fires on release — only when standing still (no active walk touch).
        if (held >= STOMP_MIN_HOLD && move.id === null) _pulsePressed = true;
        stomp.id = null;
      } else if (t.identifier === move.id) {
        const held = performance.now() - move.startTime;
        if (!move.committed && held < TAP_MAX_HOLD) {
          // Quick tap → one quiet SNEAK step toward the tapped point
          const dx = move.curX - _playerX, dy = move.curY - _playerY;
          const len = Math.hypot(dx, dy);
          if (len > 1) {
            sneak.active = true;
            sneak.dx = dx / len; sneak.dy = dy / len;
            sneak.until = performance.now() + SNEAK_DECAY;
          }
        }
        move.id = null; move.committed = false;
      }
    }
  };
  canvasEl.addEventListener('touchend', endTouch, { passive: true });
  canvasEl.addEventListener('touchcancel', endTouch, { passive: true });
}

// Called every frame with the player's canvas-space position (game.js update()).
export function setPlayerScreenPos(x, y) {
  _playerX = x; _playerY = y;
}

export function getMove() {
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  dy += 1;

  const now = performance.now();
  if (walkTouchActive(now)) {
    // Walk toward the finger (from the player). Near the feet = dead zone (stop).
    const wdx = move.curX - _playerX, wdy = move.curY - _playerY;
    const len = Math.hypot(wdx, wdy);
    if (len > WALK_DEADZONE) { dx += wdx / len; dy += wdy / len; }
  } else if (sneak.active && now < sneak.until) {
    dx += sneak.dx; dy += sneak.dy;
  } else if (sneak.active) {
    sneak.active = false;
  }

  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 1) { dx /= len; dy /= len; }
  return { dx, dy };
}

export function isCrouching() {
  const now = performance.now();
  const sneaking = sneak.active && now < sneak.until && !walkTouchActive(now);
  return _crouching || sneaking;
}

export function consumePulse() {
  const v = _pulsePressed; _pulsePressed = false; return v;
}

export function consumePause() {
  const v = _pausePressed; _pausePressed = false; return v;
}

export function consumeDebugToggle() {
  const v = _debugToggle; _debugToggle = false; return v;
}

export function isMoving() {
  const { dx, dy } = getMove();
  return dx !== 0 || dy !== 0;
}
