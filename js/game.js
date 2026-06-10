import { TILE, COLS, ROWS, W, H,
         STEP_INTERVAL, STEP_WAVE_MAX, STEP_WAVE_SPEED, STEP_WAVE_ALPHA,
         PULSE_WAVE_MAX, PULSE_WAVE_SPEED, PULSE_WAVE_ALPHA, PULSE_COOLDOWN,
         WAVE_RING_W, PLAYER_RADIUS, ENEMY_RADIUS, HAZARD_PULSE_INTERVAL,
         CELL } from './constants.js';
import { dist } from './utils.js';
import * as Audio from './audio.js';
import * as Input from './input.js';
import * as Renderer from './renderer.js';
import * as UI from './ui.js';
import { LEVELS } from './levels.js';
import { Wave, WaveManager } from './waves.js';
import { circlesOverlap } from './collision.js';
import { Player, PatrolEnemy, ChaserEnemy, Hazard } from './entities.js';

// ─── State ────────────────────────────────────────────────────────────────────
const G = {
  screen: 'title',   // title | playing | paused | dead | win
  levelIndex: 0,
  grid: null,
  wallReveal: null,
  player: null,
  enemies: [],
  hazards: [],
  exit: null,
  waveManager: null,
  pulseCooldown: 0,
  lastStepTime: 0,
  lastTime: 0,
  deathReason: '',
};

const TOTAL = LEVELS.length;

// ─── Level loading ────────────────────────────────────────────────────────────
function loadLevel(idx) {
  const def = LEVELS[idx];
  G.grid = def.grid;
  G.waveManager = new WaveManager();
  G.wallReveal = Renderer.makeRevealMap(ROWS, COLS);
  G.enemies = [];
  G.hazards = [];
  G.player = null;
  G.exit = null;
  G.pulseCooldown = 0;
  G.lastStepTime = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = def.grid[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (cell === CELL.START) G.player = new Player(cx, cy);
      if (cell === CELL.EXIT)  G.exit = { x: cx, y: cy };
    }
  }

  // Spawn enemies from def.enemies[]
  for (const e of def.enemies) {
    const ex = e.col * TILE + TILE / 2;
    const ey = e.row * TILE + TILE / 2;
    if (e.type === 'patrol') {
      const wps = e.waypoints.map(([c, r]) => ({
        x: c * TILE + TILE / 2,
        y: r * TILE + TILE / 2,
      }));
      G.enemies.push(new PatrolEnemy(ex, ey, wps));
    } else if (e.type === 'chaser') {
      G.enemies.push(new ChaserEnemy(ex, ey));
    } else if (e.type === 'hazard') {
      G.hazards.push(new Hazard(ex, ey));
    }
  }

  UI.setLevelName(def.name);
  UI.setHint(def.hint);
}

// ─── Wave-wall interaction ────────────────────────────────────────────────────
function updateWallReveal(now) {
  for (const wave of G.waveManager.waves) {
    if (wave.radius <= 0) continue;
    const innerR = Math.max(0, wave.radius - WAVE_RING_W);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (G.grid[row][col] !== 1) continue;
        const cx = col * TILE + TILE / 2;
        const cy = row * TILE + TILE / 2;
        const d = dist(wave.x, wave.y, cx, cy);
        if (d <= wave.radius && d >= innerR) {
          G.wallReveal[row][col] = now;
        }
      }
    }
  }
}

// ─── Wave-entity reveal ───────────────────────────────────────────────────────
function updateEntityReveal(now) {
  const allEntities = [...G.enemies, ...G.hazards];
  for (const wave of G.waveManager.waves) {
    const innerR = Math.max(0, wave.radius - WAVE_RING_W);
    for (const ent of allEntities) {
      const d = dist(wave.x, wave.y, ent.x, ent.y);
      if (d <= wave.radius + ent.radius && d >= innerR - ent.radius) {
        ent.revealedAt = now;
      }
    }
    // Also reveal exit
    if (G.exit) {
      const d = dist(wave.x, wave.y, G.exit.x, G.exit.y);
      if (d <= wave.radius && d >= innerR) {
        // Exit doesn't need reveal – it's always drawn with faint glow
      }
    }
  }
}

// ─── Enemy AI hearing ────────────────────────────────────────────────────────
function processEnemyHearing() {
  for (const wave of G.waveManager.waves) {
    if (wave.type !== 'pulse' && wave.type !== 'step') continue;
    for (const en of G.enemies) {
      if (!(en instanceof ChaserEnemy)) continue;
      // Chasers hear pulse waves; hear step waves on level 4+ (index 3+)
      const isStepLevel = G.levelIndex >= 3;
      if (wave.type === 'step' && !isStepLevel) continue;
      const d = dist(wave.x, wave.y, en.x, en.y);
      // Only trigger when the ring's leading edge first crosses the enemy
      if (d <= wave.radius && d > wave.prevRadius) {
        en.hearSound(wave.x, wave.y);
        Audio.playAlert();
      }
    }
    // Patrol enemies pause when hit by pulse wave (one-shot)
    if (wave.type === 'pulse') {
      for (const en of G.enemies) {
        if (!(en instanceof PatrolEnemy)) continue;
        const d = dist(wave.x, wave.y, en.x, en.y);
        if (d <= wave.radius && d > wave.prevRadius) {
          en.onPulseHit();
        }
      }
    }
  }
}

// ─── Death check ─────────────────────────────────────────────────────────────
function checkDeath() {
  const p = G.player;
  // Enemy contact
  for (const en of G.enemies) {
    if (circlesOverlap(p.x, p.y, PLAYER_RADIUS, en.x, en.y, ENEMY_RADIUS)) {
      die('Caught.');
      return;
    }
  }
  // Hazard proximity (always active – no wave needed)
  for (const hz of G.hazards) {
    if (hz.killsPlayer(p.x, p.y)) {
      die('Disintegrated.');
      return;
    }
  }
  // (Hazard scan waves reveal the hazard; proximity is the kill condition above)
}

function die(reason) {
  G.deathReason = reason;
  G.screen = 'dead';
  Audio.playDeath();
  UI.setDeathMessage(reason);
  UI.show('screen-dead');
  Renderer.setHUDVisible(false);
}

// ─── Win check ───────────────────────────────────────────────────────────────
function checkExit() {
  if (!G.exit) return;
  if (dist(G.player.x, G.player.y, G.exit.x, G.exit.y) < TILE * 0.6) {
    if (G.levelIndex + 1 >= TOTAL) {
      G.screen = 'win';
      Audio.playLevelComplete();
      UI.show('screen-win');
      Renderer.setHUDVisible(false);
    } else {
      Audio.playLevelComplete();
      G.levelIndex++;
      loadLevel(G.levelIndex);
      UI.setHint(LEVELS[G.levelIndex].hint);
      UI.show('screen-levelup');
      G.screen = 'levelup';
      Renderer.updateHUD(0, PULSE_COOLDOWN, G.levelIndex, TOTAL);
    }
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update(dt, now) {
  const move = Input.getMove();
  const moving = move.dx !== 0 || move.dy !== 0;

  // Player movement
  G.player.move(move.dx, move.dy, dt, G.grid);

  // Footstep waves
  if (moving && now - G.lastStepTime > STEP_INTERVAL) {
    G.lastStepTime = now;
    G.waveManager.add(new Wave(
      G.player.x, G.player.y,
      STEP_WAVE_MAX, STEP_WAVE_SPEED, STEP_WAVE_ALPHA, 'step'
    ));
    Audio.playFootstep();
  }

  // Pulse
  G.pulseCooldown = Math.max(0, G.pulseCooldown - dt * 1000);
  if (Input.consumePulse() && G.pulseCooldown === 0) {
    G.pulseCooldown = PULSE_COOLDOWN;
    G.waveManager.add(new Wave(
      G.player.x, G.player.y,
      PULSE_WAVE_MAX, PULSE_WAVE_SPEED, PULSE_WAVE_ALPHA, 'pulse'
    ));
    Audio.playPulse();
  }

  // Hazard pulses
  for (const hz of G.hazards) {
    const w = hz.update(dt);
    if (w) { G.waveManager.add(w); Audio.playHazardPulse(); }
  }

  G.waveManager.update(dt);

  // Reveal walls + entities
  updateWallReveal(now);
  updateEntityReveal(now);
  processEnemyHearing();

  // Enemy movement
  for (const en of G.enemies) en.update(dt, G.grid);

  // Death & exit
  checkDeath();
  if (G.screen === 'playing') checkExit();

  // HUD
  Renderer.updateHUD(G.pulseCooldown, PULSE_COOLDOWN, G.levelIndex, TOTAL);
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function loop(timestamp) {
  const dt = Math.min((timestamp - G.lastTime) / 1000, 0.05);
  G.lastTime = timestamp;

  if (Input.consumePause() && G.screen === 'playing') {
    G.screen = 'paused';
    UI.show('screen-pause');
  }

  if (G.screen === 'playing') {
    update(dt, timestamp);
  }

  Renderer.draw({ ...G, waves: G.waveManager ? G.waveManager.waves : [] }, timestamp);
  requestAnimationFrame(loop);
}

// ─── UI action handlers ───────────────────────────────────────────────────────
function handleAction(action) {
  Audio.resume();
  switch (action) {
    case 'start':
      G.levelIndex = 0;
      loadLevel(0);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      break;
    case 'resume':
      G.screen = 'playing';
      UI.hide();
      break;
    case 'restart':
      loadLevel(G.levelIndex);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      break;
    case 'restart-from-1':
      G.levelIndex = 0;
      loadLevel(0);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      break;
    case 'next-level':
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      break;
    case 'title':
      G.screen = 'title';
      UI.show('screen-title');
      Renderer.setHUDVisible(false);
      break;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function init() {
  const canvas = document.getElementById('canvas');
  Renderer.init(canvas);
  Input.init();
  UI.init();

  document.addEventListener('ui:action', e => handleAction(e.detail));

  UI.show('screen-title');
  G.lastTime = performance.now();
  requestAnimationFrame(loop);
}
