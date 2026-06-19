import { TILE, COLS, ROWS, W, H,
         STEP_INTERVAL, PULSE_COOLDOWN,
         PLAYER_RADIUS, ENEMY_RADIUS,
         IMPACT_FADE_MS, HEARING_NEAR, HEARING_FAR,
         CELL,
         RAY_COUNT_STEP, STEP_RAY_MAX,
         ENEMY_STEP_RAYS, ENEMY_STEP_MAX,
         CROUCH_INTERVAL_MULT, CROUCH_RAY_MULT, CROUCH_DIST_MULT,
         WATER_INTERVAL_MULT, WATER_RAY_MULT,
         COLLAPSE_ENERGY_THRESHOLD, COLLAPSE_BURST_RAYS,
         KEY_PICKUP_RADIUS, CRUSHER_REVEAL_MS } from './constants.js';
import { dist, segPtDist } from './utils.js';
import * as Audio from './audio.js';
import * as Input from './input.js';
import * as Renderer from './renderer.js';
import * as UI from './ui.js';

const SAVE_KEY = 'resonance_progress';
import { LEVELS } from './levels.js';
import { RaySystem } from './waves.js';
import { castRay, circlesOverlap, castRayCrushers, circleOverlapsAABB } from './collision.js';
import { Player, PatrolEnemy, ChaserEnemy, Hazard, Crusher, Sentry, BlindStalker } from './entities.js';
import * as Debug from './debug.js';

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
  fps: 60,
  playerInWater: false,
  titleRaySystem: null,
  titleCastFn: null,
  titlePulseTimer: 0,
  waterReveals: new Map(),        // "row,col" → timestamp of last ray hit
  collapsibleReveals: new Map(),  // "row,col" → timestamp of last ray hit
  crushers: [],
  doors: new Map(),               // id → {id, col, row, x, y, open, revealedAt}
  keys: new Map(),                // id → {id, col, row, x, y, collected, doorId, revealedAt}
  doorsByCell: new Map(),         // "row,col" → door obj; used for fast ray-hit lookups
  triggers: [],                   // [{col, row, x, y, action, targetId, fired, revealedAt}]
};

const TOTAL = LEVELS.length;

// ─── Level loading ────────────────────────────────────────────────────────────
function loadLevel(idx) {
  const def = LEVELS[idx];
  G.grid = def.grid.map(row => [...row]); // mutable copy (for future collapsibles)
  G.raySystem = new RaySystem();
  G.castFn = (ox, oy, dx, dy, maxDist) => {
    const gridHit  = castRay(G.grid, ox, oy, dx, dy, maxDist);
    const crushHit = castRayCrushers(G.crushers, ox, oy, dx, dy, maxDist);
    if (!gridHit && !crushHit) return null;
    if (!gridHit) return crushHit;
    if (!crushHit) return gridHit;
    return gridHit.t <= crushHit.t ? gridHit : crushHit;
  };
  G.impacts = [];
  G.enemies = [];
  G.hazards = [];
  G.crushers = [];
  G.doors = new Map();
  G.keys = new Map();
  G.doorsByCell = new Map();
  G.player = null;
  G.exit = null;
  G.pulseCooldown = 0;
  G.lastStepTime = 0;
  G.playerInWater = false;
  G.waterReveals = new Map();
  G.collapsibleReveals = new Map();
  G.triggers = [];

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
    } else if (e.type === 'crusher') {
      G.crushers.push(new Crusher(ex, ey, e.axis, e.range, e.period));
    } else if (e.type === 'sentry') {
      G.enemies.push(new Sentry(ex, ey, e.angle ?? 0));
    } else if (e.type === 'stalker') {
      G.enemies.push(new BlindStalker(ex, ey));
    }
  }

  // Spawn doors — set their grid cells to CELL.WALL while closed
  if (def.doors) {
    for (const d of def.doors) {
      const door = {
        id: d.id, col: d.col, row: d.row,
        x: d.col * TILE + TILE / 2,
        y: d.row * TILE + TILE / 2,
        open: false,
        revealedAt: -Infinity,
      };
      G.doors.set(d.id, door);
      G.doorsByCell.set(`${d.row},${d.col}`, door);
      G.grid[d.row][d.col] = CELL.WALL;
    }
  }

  // Spawn keys
  if (def.keys) {
    for (const k of def.keys) {
      G.keys.set(k.id, {
        id: k.id, col: k.col, row: k.row,
        x: k.col * TILE + TILE / 2,
        y: k.row * TILE + TILE / 2,
        collected: false,
        doorId: k.doorId,
        revealedAt: -Infinity,
      });
    }
  }

  // Spawn triggers
  if (def.triggers) {
    for (const t of def.triggers) {
      G.triggers.push({
        col: t.col, row: t.row,
        x: t.col * TILE + TILE / 2,
        y: t.row * TILE + TILE / 2,
        action: t.action,
        targetId: t.targetId,
        fired: false,
        revealedAt: -Infinity,
      });
    }
  }

  UI.setLevelName(def.name);
  UI.setHint(def.hint);
}

// ─── Title screen demo pulse ───────────────────────────────────────────────────
function initTitleScreen() {
  // Build a perimeter-wall grid so title pulses bounce off canvas edges
  const tg = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) ? CELL.WALL : CELL.EMPTY
    )
  );
  G.titleRaySystem = new RaySystem();
  G.titleCastFn = (ox, oy, dx, dy, maxDist) => castRay(tg, ox, oy, dx, dy, maxDist);
  G.titlePulseTimer = 500; // short delay before first pulse
}

// ─── Ray hit → wall impact glint ─────────────────────────────────────────────
function applyWallHits(hits, now) {
  for (const h of hits) {
    const isCollapsible = G.grid[h.row]?.[h.col] === CELL.COLLAPSIBLE;
    const isCrusher = !!h.crusher;
    const doorKey = `${h.row},${h.col}`;
    const hitDoor = G.doorsByCell.get(doorKey) || null;
    if (isCollapsible) G.collapsibleReveals.set(doorKey, now);
    if (isCrusher) h.crusher.revealedAt = now;
    if (hitDoor) hitDoor.revealedAt = now;
    G.impacts.push({
      x: h.x, y: h.y,
      nx: h.nx, ny: h.ny,
      energy: h.energy,
      type: h.type,
      cellType: isCollapsible ? 'collapsible' : isCrusher ? 'crusher' : hitDoor ? 'door' : null,
      createdAt: now,
    });

    if (isCollapsible && h.type === 'pulse' && h.energy > COLLAPSE_ENERGY_THRESHOLD) {
      G.grid[h.row][h.col] = CELL.EMPTY;
      G.raySystem.burst(h.x, h.y, 'pulse', G.castFn, COLLAPSE_BURST_RAYS, 80);
      Audio.playCollapse();
    }
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

    // Crusher reveal — larger radius than entities so player can track from safe zone
    for (const cr of G.crushers) {
      const d = segPtDist(cr.x, cr.y, sx, sy, tx, ty);
      if (d < cr.radius + 52) cr.revealedAt = now;
    }

    // Key reveal
    for (const [, key] of G.keys) {
      if (key.collected) continue;
      const d = segPtDist(key.x, key.y, sx, sy, tx, ty);
      if (d < REVEAL_D) key.revealedAt = now;
    }

    // Door reveal (closed doors only; open ones fade naturally)
    for (const [, door] of G.doors) {
      const d = segPtDist(door.x, door.y, sx, sy, tx, ty);
      if (d < REVEAL_D) door.revealedAt = now;
    }

    // Exit reveal (player rays only)
    if (G.exit && ray.type !== 'hazard' && ray.type !== 'step-enemy') {
      const d = segPtDist(G.exit.x, G.exit.y, sx, sy, tx, ty);
      if (d < REVEAL_D) G.exit.revealedAt = now;
    }

    // Trigger reveal
    for (const tr of G.triggers) {
      if (tr.fired) continue;
      const d = segPtDist(tr.x, tr.y, sx, sy, tx, ty);
      if (d < REVEAL_D) tr.revealedAt = now;
    }

    // Enemy hearing (one-shot per ray)
    if (ray.type === 'pulse' || (ray.type === 'step' && isStepLevel)) {
      for (const en of G.enemies) {
        if (ray.heardEntities.has(en)) continue;
        const d = segPtDist(en.x, en.y, sx, sy, tx, ty);
        if (d < en.radius + 18) {
          ray.heardEntities.add(en);
          if (en instanceof BlindStalker) {
            en.hearSound(ray.burstX, ray.burstY);
            Audio.playAlert(en.x, en.y);
          } else if (en instanceof ChaserEnemy) {
            if (!ray.quiet) {
              en.hearSound(ray.burstX, ray.burstY);
              Audio.playAlert(en.x, en.y);
            }
          } else if (en instanceof PatrolEnemy) {
            if (ray.type === 'pulse') {
              en.onPulseHit();
            } else if (ray.type === 'step' && en.stepAware) {
              en.hearStep(ray.burstX, ray.burstY);
            }
          } else if (en instanceof Sentry) {
            if (ray.type === 'pulse') en.onPulseHit();
          }
        }
      }
    }
  }
}

// ─── Water tile reveals via ray tips ─────────────────────────────────────────
function processWaterReveals(now) {
  for (const ray of G.raySystem.active) {
    const tc = Math.floor(ray.tipX / TILE);
    const tr = Math.floor(ray.tipY / TILE);
    if (G.grid[tr]?.[tc] === CELL.WATER) {
      G.waterReveals.set(`${tr},${tc}`, now);
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
  for (const cr of G.crushers) {
    const b = cr.bounds();
    if (circleOverlapsAABB(p.x, p.y, PLAYER_RADIUS, b.x1, b.y1, b.x2, b.y2)) {
      die('Crushed.');
      return;
    }
  }
}

function die(reason) {
  G.deathReason = reason;
  G.screen = 'dead';
  Audio.stopAmbient();
  Audio.playDeath();
  UI.setDeathMessage(reason);
  UI.show('screen-dead');
  Renderer.setHUDVisible(false);
}

// ─── Trigger actions ─────────────────────────────────────────────────────────
function fireTrigger(tr) {
  if (tr.action === 'open_door') {
    const door = G.doors.get(tr.targetId);
    if (door && !door.open) {
      door.open = true;
      G.grid[door.row][door.col] = CELL.EMPTY;
      G.doorsByCell.delete(`${door.row},${door.col}`);
      Audio.playDoorOpen();
    }
  } else if (tr.action === 'remove_wall') {
    const [r, c] = tr.targetId.split(',').map(Number);
    G.grid[r][c] = CELL.EMPTY;
  }
}

// ─── Win check ────────────────────────────────────────────────────────────────
function checkExit() {
  if (!G.exit) return;
  if (dist(G.player.x, G.player.y, G.exit.x, G.exit.y) < TILE * 0.6) {
    if (G.levelIndex + 1 >= TOTAL) {
      G.screen = 'win';
      localStorage.removeItem(SAVE_KEY);
      Audio.stopAmbient();
      Audio.playLevelComplete();
      UI.show('screen-win');
      Renderer.setHUDVisible(false);
    } else {
      Audio.playLevelComplete();
      G.levelIndex++;
      localStorage.setItem(SAVE_KEY, G.levelIndex);
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
    // quiet=true when crouching: rays still reveal geometry but won't re-alert chasers
    G.raySystem.burst(G.player.x, G.player.y, 'step', G.castFn, count, maxDist, crouching);
    Audio.playFootstepSurface(G.playerInWater ? 'water' : 'normal');
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
      Audio.playHazardPulse(ev.x, ev.y, Math.min(1, vol));
    }
  }

  // Advance rays → collect wall hits
  const hits = G.raySystem.update(dt, G.castFn, now);
  applyWallHits(hits, now);
  processRayEntities(now);
  processWaterReveals(now);

  // Listener position — keep in sync every frame so PannerNodes stay accurate
  Audio.updateListener(G.player.x, G.player.y);

  // Enemy movement — Sentry needs castFn + player for visual LOS detection
  for (const en of G.enemies) {
    if (en instanceof Sentry) {
      if (en.update(dt, G.grid, G.castFn, G.player)) Audio.playSentryAlert(en.x, en.y);
    } else {
      en.update(dt, G.grid);
    }
    if (en.shouldEmitStep?.(dt)) {
      G.raySystem.burst(en.x, en.y, 'step-enemy', G.castFn, ENEMY_STEP_RAYS, ENEMY_STEP_MAX);
      const hunting = en.state === 'hunting' || en.state === 'alert' || (en.alertTimer > 0);
      if (hunting) Audio.playEnemyFootstepHunting(en.x, en.y);
      else Audio.playEnemyFootstep(en.x, en.y);
    }
    if (en instanceof BlindStalker && en.shouldBreathe(dt)) {
      Audio.playBlindStalkerBreathing(en.x, en.y);
    }
  }
  for (const cr of G.crushers) cr.update(dt);

  // Key pickup — proximity triggers collection and opens the matching door
  for (const [, key] of G.keys) {
    if (key.collected) continue;
    if (dist(G.player.x, G.player.y, key.x, key.y) < KEY_PICKUP_RADIUS) {
      key.collected = true;
      Audio.playKeyPickup();
      const door = G.doors.get(key.doorId);
      if (door) {
        door.open = true;
        G.grid[door.row][door.col] = CELL.EMPTY;
        G.doorsByCell.delete(`${door.row},${door.col}`);
        Audio.playDoorOpen();
      }
    }
  }

  // Trigger proximity — fires action once when player steps within 10px of center
  for (const tr of G.triggers) {
    if (tr.fired) continue;
    if (dist(G.player.x, G.player.y, tr.x, tr.y) < 10) {
      tr.fired = true;
      fireTrigger(tr);
    }
  }

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

  if (dt > 0.001) G.fps = G.fps * 0.85 + (1 / dt) * 0.15;
  if (Input.consumeDebugToggle()) Debug.toggle();

  if (Input.consumePause() && G.screen === 'playing') {
    G.screen = 'paused';
    UI.show('screen-pause');
  }

  // Title screen demo pulse — fires every 4s to show the mechanic before play
  if (G.screen === 'title' && G.titleRaySystem) {
    G.titlePulseTimer -= dt * 1000;
    if (G.titlePulseTimer <= 0) {
      G.titlePulseTimer = 4000;
      G.titleRaySystem.burst(W / 2, H / 2, 'pulse', G.titleCastFn);
    }
    G.titleRaySystem.update(dt, G.titleCastFn, timestamp);
  }

  if (G.screen === 'playing') {
    update(dt, timestamp);
  }

  Renderer.draw({
    ...G,
    rays: G.screen === 'title'
      ? (G.titleRaySystem ? G.titleRaySystem.active     : [])
      : (G.raySystem      ? G.raySystem.active           : []),
    echoTrails: G.screen === 'title'
      ? (G.titleRaySystem ? G.titleRaySystem.echoTrails : [])
      : (G.raySystem      ? G.raySystem.echoTrails       : []),
    fps: G.fps,
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
      Audio.startAmbient();
      break;
    case 'continue': {
      const saved = parseInt(localStorage.getItem(SAVE_KEY), 10);
      const idx = (!isNaN(saved) && saved > 0 && saved < TOTAL) ? saved : 0;
      G.levelIndex = idx;
      loadLevel(idx);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      Audio.startAmbient();
      break;
    }
    case 'resume':
      G.screen = 'playing';
      UI.hide();
      Audio.startAmbient();
      break;
    case 'restart':
      loadLevel(G.levelIndex);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      Audio.startAmbient();
      break;
    case 'restart-from-1':
      G.levelIndex = 0;
      localStorage.removeItem(SAVE_KEY);
      loadLevel(0);
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      Audio.startAmbient();
      break;
    case 'next-level':
      G.screen = 'playing';
      UI.hide();
      Renderer.setHUDVisible(true);
      Audio.startAmbient();
      break;
    case 'title':
      G.screen = 'title';
      Audio.stopAmbient();
      UI.show('screen-title');
      Renderer.setHUDVisible(false);
      initTitleScreen();
      refreshContinueButton();
      break;
  }
}

// ─── Continue button ──────────────────────────────────────────────────────────
function refreshContinueButton() {
  const saved = parseInt(localStorage.getItem(SAVE_KEY), 10);
  if (!isNaN(saved) && saved > 0 && saved < TOTAL) {
    UI.showContinueButton(saved + 1); // 1-based display: index 1 → "Level 2"
  } else {
    UI.hideContinueButton();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function init() {
  const canvas = document.getElementById('canvas');
  Renderer.init(canvas);
  Input.init();
  UI.init();

  document.addEventListener('ui:action', e => handleAction(e.detail));

  initTitleScreen();
  UI.show('screen-title');
  refreshContinueButton();
  G.lastTime = performance.now();
  requestAnimationFrame(loop);
}
