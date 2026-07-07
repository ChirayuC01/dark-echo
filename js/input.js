const keys = new Set();
let _pulsePressed  = false;
let _pausePressed  = false;
let _crouching     = false;
let _debugToggle   = false;

const CANVAS_W = 800, CANVAS_H = 600;
const TAP_MAX_HOLD     = 200;  // ms — touch released before this counts as a "tap" (crouch-walk)
const CROUCH_TAP_DECAY = 350;  // ms — how long a tap keeps the player crouch-walking before stopping
const PULSE_TOUCH_RADIUS = 42; // canvas-space px — tap-and-hold within this of the player fires pulse

let canvasEl = null;
let _playerX = -1000, _playerY = -1000; // canvas-space; updated every frame by setPlayerScreenPos()

// Single tracked "movement" touch: held → walk toward tapped direction from screen center.
const move = { touchId: null, startTime: 0, dx: 0, dy: 0 };

// Crouch-walk state, driven by quick taps (not holds) in the movement zone.
const crouchTap = { active: false, dx: 0, dy: 0, until: 0 };

// Any touch currently held on the player fires pulse continuously while cooldown allows.
const pulseTouches = new Set();

function canvasToLocal(clientX, clientY) {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width  * CANVAS_W,
    y: (clientY - rect.top)  / rect.height * CANVAS_H,
  };
}

function dirFromCenter(x, y) {
  const dx = x - CANVAS_W / 2, dy = y - CANVAS_H / 2;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-3) return { dx: 0, dy: 0 };
  return { dx: dx / len, dy: dy / len };
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
      const distToPlayer = Math.hypot(p.x - _playerX, p.y - _playerY);
      if (distToPlayer < PULSE_TOUCH_RADIUS) {
        pulseTouches.add(t.identifier);
        continue;
      }
      if (move.touchId === null) {
        move.touchId = t.identifier;
        move.startTime = performance.now();
        const d = dirFromCenter(p.x, p.y);
        move.dx = d.dx; move.dy = d.dy;
      }
    }
  }, { passive: false });

  canvasEl.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === move.touchId) {
        const p = canvasToLocal(t.clientX, t.clientY);
        const d = dirFromCenter(p.x, p.y);
        move.dx = d.dx; move.dy = d.dy;
      }
    }
  }, { passive: false });

  const endTouch = e => {
    for (const t of e.changedTouches) {
      if (pulseTouches.has(t.identifier)) {
        pulseTouches.delete(t.identifier);
        continue;
      }
      if (t.identifier === move.touchId) {
        const heldFor = performance.now() - move.startTime;
        if (heldFor < TAP_MAX_HOLD) {
          crouchTap.active = true;
          crouchTap.dx = move.dx; crouchTap.dy = move.dy;
          crouchTap.until = performance.now() + CROUCH_TAP_DECAY;
        }
        move.touchId = null; move.dx = 0; move.dy = 0;
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

  if (move.touchId !== null) {
    // Don't move yet while a fresh touch is still ambiguous (could resolve to a
    // tap → crouch-walk). Only a touch held past the tap threshold counts as
    // a real hold and walks at normal speed.
    if (performance.now() - move.startTime >= TAP_MAX_HOLD) {
      dx += move.dx; dy += move.dy;
    }
  } else if (crouchTap.active) {
    if (performance.now() < crouchTap.until) {
      dx += crouchTap.dx; dy += crouchTap.dy;
    } else {
      crouchTap.active = false;
    }
  }

  // Normalize diagonal
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 1) { dx /= len; dy /= len; }
  return { dx, dy };
}

export function isCrouching() {
  const touchCrouching = move.touchId === null && crouchTap.active && performance.now() < crouchTap.until;
  return _crouching || touchCrouching;
}

export function consumePulse() {
  const v = _pulsePressed || pulseTouches.size > 0;
  _pulsePressed = false;
  return v;
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
