// Landscape lock (mobile).
//
// The control scheme assumes two thumbs at the left and right screen edges, so
// the game is meant to be played in landscape. Portrait renders correctly
// (Phase 31 made it 100% coverage) but is awkward to actually play, and opening
// in portrait forces the player to rotate before they can start.
//
// There is no single reliable way to force orientation on the web, so this uses
// a layered approach, strongest first:
//   1. Screen Orientation API lock — works in the Capacitor WebView and in
//      browsers once fullscreen. Silently rejects elsewhere (desktop, iOS Safari).
//   2. A "rotate your device" overlay as the visible fallback, shown only on
//      touch devices in portrait, so the player is never left confused.
//
// The most robust fix for the packaged Android app is the manifest attribute
// android:screenOrientation="sensorLandscape" — see docs/ANDROID_BUILD_GUIDE.md.
// That is a native change and `android/` is gitignored, so it is documented
// rather than committed.

let _installed = false;

function isTouchDevice() {
  return (typeof window !== 'undefined') &&
         (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0);
}

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

// Try the Screen Orientation API. Resolves quietly whether or not it worked —
// a rejection just means the platform won't allow it without fullscreen.
export async function lockLandscape() {
  try {
    const so = screen && screen.orientation;
    if (so && typeof so.lock === 'function') {
      await so.lock('landscape');
      return true;
    }
  } catch (_) { /* not permitted here — the overlay fallback covers it */ }
  return false;
}

// Some browsers only permit an orientation lock while in fullscreen, and only
// from a user gesture. Called from the first tap/click on the play page.
export async function lockLandscapeWithFullscreen(el) {
  if (!isTouchDevice()) return false;
  if (await lockLandscape()) return true;
  try {
    const target = el || document.documentElement;
    if (!document.fullscreenElement && target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' });
      return await lockLandscape();
    }
  } catch (_) { /* user or platform declined — overlay fallback remains */ }
  return false;
}

function syncOverlay() {
  const el = document.getElementById('rotate-notice');
  if (!el) return;
  el.classList.toggle('visible', isTouchDevice() && isPortrait());
}

// Install the fallback overlay + keep it in sync with orientation changes.
export function init() {
  if (_installed) return;
  _installed = true;

  // Attempt the lock immediately (works inside the Capacitor WebView), and again
  // on the first user gesture, which is when browsers will actually allow it.
  lockLandscape().then(ok => { if (!ok) syncOverlay(); });

  const onGesture = () => {
    lockLandscapeWithFullscreen(document.documentElement).finally(syncOverlay);
  };
  window.addEventListener('pointerdown', onGesture, { once: true });
  window.addEventListener('touchend',    onGesture, { once: true });

  window.addEventListener('resize', syncOverlay);
  window.addEventListener('orientationchange', () => setTimeout(syncOverlay, 150));
  syncOverlay();
}
