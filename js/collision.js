import { TILE, PLAYER_RADIUS } from './constants.js';

export function isWallAt(grid, px, py) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return true;
  return grid[row][col] === 1;
}

// Check if a circle (cx,cy,cr) overlaps a wall tile
function circleOverlapsTile(cx, cy, cr, tileCol, tileRow) {
  const tx = tileCol * TILE, ty = tileRow * TILE;
  const nearX = Math.max(tx, Math.min(cx, tx + TILE));
  const nearY = Math.max(ty, Math.min(cy, ty + TILE));
  const dx = cx - nearX, dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

// Resolve player circle against all wall tiles; returns adjusted {x,y}
export function resolveWalls(grid, x, y, radius) {
  const rows = grid.length, cols = grid[0].length;
  const minCol = Math.max(0, Math.floor((x - radius) / TILE));
  const maxCol = Math.min(cols - 1, Math.floor((x + radius) / TILE));
  const minRow = Math.max(0, Math.floor((y - radius) / TILE));
  const maxRow = Math.min(rows - 1, Math.floor((y + radius) / TILE));

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (grid[r][c] !== 1) continue;
      if (!circleOverlapsTile(x, y, radius, c, r)) continue;

      const tx = c * TILE, ty = r * TILE;
      const nearX = Math.max(tx, Math.min(x, tx + TILE));
      const nearY = Math.max(ty, Math.min(y, ty + TILE));
      const dx = x - nearX, dy = y - nearY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) { x += radius; continue; }
      const push = radius - len;
      x += (dx / len) * push;
      y += (dy / len) * push;
    }
  }
  return { x, y };
}

// True if two circles overlap (kill check)
export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = bx - ax, dy = by - ay;
  const d = ar + br;
  return dx * dx + dy * dy < d * d;
}
