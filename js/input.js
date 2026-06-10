const keys = new Set();
let _pulsePressed = false;
let _pausePressed = false;

// Touch joystick state
const touch = {
  active: false,
  startX: 0, startY: 0,
  dx: 0, dy: 0,
  pulseBtn: false,
};

export function init() {
  window.addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); _pulsePressed = true; }
    if (e.code === 'Escape' || e.code === 'KeyP') _pausePressed = true;
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
  });

  const zone = document.getElementById('joystick-zone');
  const knob = document.getElementById('joystick-knob');
  const pulseBtn = document.getElementById('pulse-btn');

  if (zone) {
    zone.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      const r = zone.getBoundingClientRect();
      touch.active = true;
      touch.startX = r.left + r.width / 2;
      touch.startY = r.top + r.height / 2;
      touch.dx = 0; touch.dy = 0;
    }, { passive: false });

    zone.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!touch.active) return;
      const t = e.touches[0];
      const MAX = 40;
      let dx = t.clientX - touch.startX;
      let dy = t.clientY - touch.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len > MAX) { dx = dx/len*MAX; dy = dy/len*MAX; }
      touch.dx = dx / MAX;
      touch.dy = dy / MAX;
      if (knob) {
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
    }, { passive: false });

    const endTouch = () => {
      touch.active = false; touch.dx = 0; touch.dy = 0;
      if (knob) knob.style.transform = 'translate(-50%,-50%)';
    };
    zone.addEventListener('touchend', endTouch);
    zone.addEventListener('touchcancel', endTouch);
  }

  if (pulseBtn) {
    pulseBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      touch.pulseBtn = true; _pulsePressed = true;
    }, { passive: false });
    pulseBtn.addEventListener('touchend', () => { touch.pulseBtn = false; });
  }
}

export function getMove() {
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  dy += 1;

  if (touch.active) { dx += touch.dx; dy += touch.dy; }

  // Normalize diagonal
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len > 1) { dx /= len; dy /= len; }
  return { dx, dy };
}

export function consumePulse() {
  const v = _pulsePressed; _pulsePressed = false; return v;
}

export function consumePause() {
  const v = _pausePressed; _pausePressed = false; return v;
}

export function isMoving() {
  const { dx, dy } = getMove();
  return dx !== 0 || dy !== 0;
}
