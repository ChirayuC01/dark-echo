import { TILE, ECHO_TRAIL_CAP } from './constants.js';

let _enabled = false;

export function isEnabled() { return _enabled; }

export function toggle() { _enabled = !_enabled; }

export function draw(ctx, state, fps) {
  const { screen, player, enemies, hazards, rays, echoTrails, impacts, playerInWater } = state;

  const lines = [];
  lines.push(`FPS: ${fps.toFixed(1)}`);
  lines.push(`Screen: ${screen}`);
  lines.push('────────────────────────────');
  lines.push(`Rays active: ${rays ? rays.length : 0}`);
  const trailCount = echoTrails ? echoTrails.length : 0;
  const trailWarn = trailCount >= ECHO_TRAIL_CAP * 0.85 ? ' !' : '';
  lines.push(`Echo trails: ${trailCount} / ${ECHO_TRAIL_CAP}${trailWarn}`);
  lines.push(`Glints: ${impacts ? impacts.length : 0}`);

  if (player) {
    lines.push('────────────────────────────');
    const tileCol = Math.floor(player.x / TILE);
    const tileRow = Math.floor(player.y / TILE);
    lines.push(`Player: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})  tile[${tileCol},${tileRow}]`);
    lines.push(`Crouch: ${player.crouching ? 'YES' : 'no '}   Water: ${playerInWater ? 'YES' : 'no '}`);
  }

  const allEnemies = [...(enemies || []), ...(hazards || [])];
  if (allEnemies.length > 0) {
    lines.push('────────────────────────────');
    lines.push(`Entities: ${allEnemies.length}`);
    for (const en of allEnemies) {
      const type = en.constructor.name.replace('Enemy', '');
      const st   = (en.state || '—').substring(0, 9);
      lines.push(`  ${type.padEnd(13)} ${st.padEnd(9)} (${en.x.toFixed(0)},${en.y.toFixed(0)})`);
    }
  }

  const PAD    = 10;
  const LINE_H = 16;
  const PANEL_W = 306;
  const PANEL_H = lines.length * LINE_H + PAD * 2;
  const PANEL_X = 8;
  const PANEL_Y = 8;

  ctx.save();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,0,0,0.76)';
  ctx.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
  ctx.strokeStyle = 'rgba(100,200,255,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PANEL_X + 0.5, PANEL_Y + 0.5, PANEL_W - 1, PANEL_H - 1);

  ctx.font = '12px monospace';
  ctx.textBaseline = 'top';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const x = PANEL_X + PAD;
    const y = PANEL_Y + PAD + i * LINE_H;

    if (line.startsWith('────')) {
      ctx.fillStyle = 'rgba(100,200,255,0.18)';
    } else if (line.startsWith('FPS')) {
      ctx.fillStyle = fps >= 55 ? 'rgba(100,255,150,0.9)' : fps >= 30 ? 'rgba(255,220,80,0.9)' : 'rgba(255,80,80,0.9)';
    } else if (line.includes('trails') && trailCount >= ECHO_TRAIL_CAP * 0.85) {
      ctx.fillStyle = 'rgba(255,180,60,0.9)';
    } else if (line.includes('hunting') || line.includes('alert')) {
      ctx.fillStyle = 'rgba(255,120,100,0.9)';
    } else if (line.startsWith('  ')) {
      ctx.fillStyle = 'rgba(220,170,170,0.85)';
    } else {
      ctx.fillStyle = 'rgba(200,220,255,0.85)';
    }

    ctx.fillText(line, x, y);
  }

  ctx.restore();
}
