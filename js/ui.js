// Screen management: title, pause, dead, win
// Each screen is a div inside #overlay

export function init() {
  // Wire up all button clicks via data-action attributes
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      document.dispatchEvent(new CustomEvent('ui:action', { detail: action }));
    });
  });
}

export function show(screenId) {
  const overlay = document.getElementById('overlay');
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('visible'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('visible');
  const hasScreen = !!target;
  overlay.classList.toggle('active', hasScreen);
}

export function hide() {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('visible'));
  document.getElementById('overlay').classList.remove('active');
}

export function setLevelName(name) {
  const el = document.getElementById('level-name-display');
  if (el) el.textContent = name;
}

export function setDeathMessage(msg) {
  const el = document.getElementById('death-msg');
  if (el) el.textContent = msg;
}

export function setHint(text) {
  const el = document.getElementById('hint-text');
  if (el) el.textContent = text;
}
