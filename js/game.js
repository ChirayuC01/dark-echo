import { TILE, COLS, ROWS,
         STEP_INTERVAL, PULSE_COOLDOWN,
         PLAYER_RADIUS, ENEMY_RADIUS,
         IMPACT_FADE_MS, HEARING_NEAR, HEARING_FAR,
         CELL,
         RAY_COUNT_STEP, STEP_RAY_MAX,
         CROUCH_INTERVAL_MULT, CROUCH_RAY_MULT, CROUCH_DIST_MULT,
         WATER_INTERVAL_MULT, WATER_RAY_MULT,
         COLLAPSE_ENERGY_THRESHOLD, COLLAPSE_BURST_RAYS,
         KEY_PICKUP_RADIUS, CRUSHER_REVEAL_MS } from './constants.js';
import { dist, segPtDist } from './utils.js';
import * as Audio from './audio.js';
import * as Input from './input.js';
import * as Renderer from './renderer.js';
import * as UI from './ui.js';
import { LEVELS } from './levels.js';
import { RaySystem } from './waves.js';
import { castRay, circlesOverlap, castRayCrushers, circleOverlapsAABB } from './collision.js';
import { Player, PatrolEnemy, ChaserEnemy, Hazard, Crusher } from './entities.js';

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
  waterReveals: new Map(),        // "row,col" → timestamp of last ray hit
  collapsibleReveals: new Map(),  // "row,col" → timestamp of last ray hit
  crushers: [],
  doors: new Map(),               // id → {id, col, row, x, y, open, revealedAt}
  keys: new Map(),                // id → {id, col, row, x, y, collected, doorId, revealedAt}
  doorsByCell: new Map(),         // "row,col" → door obj; used for fast ray-hit lookups
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

  UI.setLevelName(def.name);
  UI.setHint(def.hint);
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
            if (!ray.quiet) {
              en.hearSound(ray.burstX, ray.burstY);
              Audio.playAlert();
            }
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
    // quiet=true when crouching: rays still reveal geometry but won't re-alert chasers
    G.raySystem.burst(G.player.x, G.player.y, 'step', G.castFn, count, maxDist, crouching);
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
  processWaterReveals(now);

  // Enemy movement
  for (const en of G.enemies) en.update(dt, G.grid);
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
