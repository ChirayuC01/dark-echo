import { TILE, COLS, ROWS,
         STEP_INTERVAL, PULSE_COOLDOWN,
         PLAYER_RADIUS, ENEMY_RADIUS,
         IMPACT_FADE_MS, HEARING_NEAR, HEARING_FAR,
         CELL,
         RAY_COUNT_STEP, STEP_RAY_MAX,
         CROUCH_INTERVAL_MULT, CROUCH_RAY_MULT, CROUCH_DIST_MULT,
         WATER_INTERVAL_MULT, WATER_RAY_MULT } from './constants.js';
import { dist, segPtDist } from './utils.js';
import * as Audio from './audio.js';
import * as Input from './input.js';
import * as Renderer from './renderer.js';
import * as UI from './ui.js';
import { LEVELS } from './levels.js';
import { RaySystem } from './waves.js';
import { castRay, circlesOverlap } from './collision.js';
import { Player, PatrolEnemy, ChaserEnemy, Hazard } from './entities.js';

// ─── State ────────────────────────────────────────────────────────────────────
const G = {
  screen: 'title',
  levelIndex: 0,
  grid: null,
  impacts: [],        // wall impact glints: {x,y,nx,ny,energy,type,createdAt}
  player: null,
  enemies: [],
  hazards: [],
  exit: null,         // { x, y, revealedAt }
  raySystem: null,
  castFn: null,
  pulseCooldown: 0,
  lastStepTime: 0,
  lastTime: 0,
  deathReason: '',
  playerInWater: false,
};

const TOTAL = LEVELS.length;

// ─── Level loading ────────────────────────────────────────────────────────────
function loadLevel(idx) {
  const def = LEVELS[idx];
  G.grid = def.grid.map(row => [...row]); // mutable copy (for future collapsibles)
  G.raySystem = new RaySystem();
  G.castFn = (ox, oy, dx, dy, maxDist) => castRay(G.grid, ox, oy, dx, dy, maxDist);
  G.impacts = [];
  G.enemies = [];
  G.hazards = [];
  G.player = null;
  G.exit = null;
  G.pulseCooldown = 0;
  G.lastStepTime = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = G.grid[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (cell === CELL.START) G.player = new Player(cx, cy);
      if (cell === CELL.EXIT)  G.exit = { x: cx, y: cy, revealedAt: -Infinity };
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
      const patrol = new PatrolEnemy(ex, ey, wps);
      patrol.stepAware = !!e.stepAware;
      G.enemies.push(patrol);
    } else if (e.type === 'chaser') {
      G.enemies.push(new ChaserEnemy(ex, ey));
    } else if (e.type === 'hazard') {
      G.hazards.push(new Hazard(ex, ey));
    }
  }

  UI.setLevelName(def.name);
  UI.setHint(def.hint);
}

// ─── Ray hit → wall impact glint ─────────────────────────────────────────────
function applyWallHits(hits, now) {
  for (const h of hits) {
    G.impacts.push({
      x: h.x, y: h.y,
      nx: h.nx, ny: h.ny,
      energy: h.energy,
      type: h.type,
      createdAt: now,
    });
  }
  let wi = 0;
  for (let i = 0; i < G.impacts.length; i++) {
    if (now - G.impacts[i].createdAt < IMPACT_FADE_MS) G.impacts[wi++] = G.impacts[i];
  }
  G.impacts.length = wi;
}

// ─── Ray segments → entity reveal + hearing ───────────────────────────────────
function processRayEntities(now) {
  const allEntities = [...G.enemies, ...G.hazards];
  const isStepLevel = G.levelIndex >= 3;
  const REVEAL_D = 28;

  for (const ray of G.raySystem.active) {
    const sx = ray.segX, sy = ray.segY;
    const tx = ray.tipX, ty = ray.tipY;

    // Entity reveal
    for (const ent of allEntities) {
      const d = segPtDist(ent.x, ent.y, sx, sy, tx, ty);
      if (d < ent.radius + REVEAL_D) ent.revealedAt = now;
    }

    // Exit reveal (player rays only)
    if (G.exit && ray.type !== 'hazard') {
      const d = segPtDist(G.exit.x, G.exit.y, sx, sy, tx, ty);
      if (d < REVEAL_D) G.exit.revealedAt = now;
    }

    // Enemy hearing (one-shot per ray)
    if (ray.type === 'pulse' || (ray.type === 'step' && isStepLevel)) {
      for (const en of G.enemies) {
        if (ray.heardEntities.has(en)) continue;
        const d = segPtDist(en.x, en.y, sx, sy, tx, ty);
        if (d < en.radius + 18) {
          ray.heardEntities.add(en);
          if (en instanceof ChaserEnemy) {
            en.hearSound(ray.burstX, ray.burstY);
            Audio.playAlert();
          } else if (en instanceof PatrolEnemy) {
            if (ray.type === 'pulse') {
              en.onPulseHit();
            } else if (ray.type === 'step' && en.stepAware) {
              en.hearStep(ray.burstX, ray.burstY);
            }
          }
        }
      }
    }
  }
}

// ─── Death check ──────────────────────────────────────────────────────────────
function checkDeath() {
  const p = G.player;
  for (const en of G.enemies) {
    if (circlesOverlap(p.x, p.y, PLAYER_RADIUS, en.x, en.y, ENEMY_RADIUS)) {
      die('Caught.');
      return;
    }
  }
  for (const hz of G.hazards) {
    if (hz.killsPlayer(p.x, p.y)) {
      die('Disintegrated.');
      return;
    }
  }
}

function die(reason) {
  G.deathReason = reason;
  G.screen = 'dead';
  Audio.playDeath();
  UI.setDeathMessage(reason);
  UI.show('screen-dead');
  Renderer.setHUDVisible(false);
}

// ─── Win check ────────────────────────────────────────────────────────────────
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
  const crouching = Input.isCrouching();

  // Water tile detection — check BEFORE moving so the tile under feet is current
  const tileCol = Math.floor(G.player.x / TILE);
  const tileRow = Math.floor(G.player.y / TILE);
  G.playerInWater = G.grid[tileRow]?.[tileCol] === CELL.WATER;

  // Player movement — crouch + water both adjust speed
  G.player.move(move.dx, move.dy, dt, G.grid, crouching, G.playerInWater);

  // Footstep rays — crouch and water multipliers stack
  const stepInterval = STEP_INTERVAL
    * (crouching        ? CROUCH_INTERVAL_MULT : 1)
    * (G.playerInWater  ? WATER_INTERVAL_MULT  : 1);
  if (moving && now - G.lastStepTime > stepInterval) {
    G.lastStepTime = now;
    const countMult = (crouching ? CROUCH_RAY_MULT : 1) * (G.playerInWater ? WATER_RAY_MULT : 1);
    const count   = Math.max(1, Math.min(64, Math.ceil(RAY_COUNT_STEP * countMult)));
    const maxDist = STEP_RAY_MAX * (crouching ? CROUCH_DIST_MULT : 1);
    G.raySystem.burst(G.player.x, G.player.y, 'step', G.castFn, count, maxDist);
    if (G.playerInWater) {
      Audio.playFootstepWater();
    } else {
      Audio.playFootstep();
    }
  }

  // Pulse rays
  G.pulseCooldown = Math.max(0, G.pulseCooldown - dt * 1000);
  if (Input.consumePulse() && G.pulseCooldown === 0) {
    G.pulseCooldown = PULSE_COOLDOWN;
    G.raySystem.burst(G.player.x, G.player.y, 'pulse', G.castFn);
    Audio.playPulse();
  }

  // Hazard pulses
  for (const hz of G.hazards) {
    const ev = hz.update(dt);
    if (ev) {
      G.raySystem.burst(ev.x, ev.y, 'hazard', G.castFn);
      const d = dist(ev.x, ev.y, G.player.x, G.player.y);
      const vol = Math.max(0, 1 - (d - HEARING_NEAR) / (HEARING_FAR - HEARING_NEAR));
      Audio.playHazardPulse(Math.min(1, vol));
    }
  }

  // Advance rays → collect wall hits
  const hits = G.raySystem.update(dt, G.castFn, now);
  applyWallHits(hits, now);
  processRayEntities(now);

  // Enemy movement
  for (const en of G.enemies) en.update(dt, G.grid);

  // Death & exit
  checkDeath();
  if (G.screen === 'playing') checkExit();

  // HUD
  Renderer.updateHUD(G.pulseCooldown, PULSE_COOLDOWN, G.levelIndex, TOTAL, crouching);
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

  Renderer.draw({
    ...G,
    rays:       G.raySystem ? G.raySystem.active     : [],
    echoTrails: G.raySystem ? G.raySystem.echoTrails : [],
  }, timestamp);
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
