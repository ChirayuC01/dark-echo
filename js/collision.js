import { TILE, PLAYER_RADIUS, CELL } from './constants.js';

// ─── DDA ray-vs-grid cast ─────────────────────────────────────────────────────
// Returns { x, y, t, nx, ny, col, row } of first wall hit within maxDist, or null.
// nx/ny is the outward-facing normal of the wall face that was struck.
export function castRay(grid, ox, oy, dx, dy, maxDist) {
  const COLS = grid[0].length;
  const ROWS = grid.length;

  let col = Math.floor(ox / TILE);
  let row = Math.floor(oy / TILE);
  col = Math.max(0, Math.min(COLS - 1, col));
  row = Math.max(0, Math.min(ROWS - 1, row));

  const stepC = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepR = dy > 0 ? 1 : dy < 0 ? -1 : 0;

  const tDC = Math.abs(dx) < 1e-9 ? Infinity : TILE / Math.abs(dx);
  const tDR = Math.abs(dy) < 1e-9 ? Infinity : TILE / Math.abs(dy);

  // Distance from origin to first vertical / horizontal grid line
  let tC = stepC > 0 ? ((col + 1) * TILE - ox) / dx
         : stepC < 0 ? (col * TILE - ox) / dx   // dx<0 → positive result
         : Infinity;
  let tR = stepR > 0 ? ((row + 1) * TILE - oy) / dy
         : stepR < 0 ? (row * TILE - oy) / dy
         : Infinity;

  // If origin sits exactly on a boundary moving away from it, skip the zero step
  if (tC < 1e-6) tC += tDC;
  if (tR < 1e-6) tR += tDR;

  for (let guard = 0; guard < 48; guard++) {
    let t, nc, nr, nx, ny;
    if (tC <= tR) {
      t = tC; nc = col + stepC; nr = row;
      nx = -stepC; ny = 0;
      tC += tDC;
    } else {
      t = tR; nc = col; nr = row + stepR;
      nx = 0; ny = -stepR;
      tR += tDR;
    }

    if (t > maxDist + 1e-6) break;

    // Out of bounds → treat as solid boundary
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) {
      return { x: ox + dx * t, y: oy + dy * t, t, nx, ny, col: nc, row: nr };
    }

    if (grid[nr][nc] === CELL.WALL || grid[nr][nc] === CELL.COLLAPSIBLE) {
      return { x: ox + dx * t, y: oy + dy * t, t, nx, ny, col: nc, row: nr };
    }

    col = nc; row = nr;
  }
  return null;
}

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

  // Up to 3 passes so pushback from one tile can be re-checked against adjacent tiles
  for (let pass = 0; pass < 3; pass++) {
    const minCol = Math.max(0, Math.floor((x - radius) / TILE));
    const maxCol = Math.min(cols - 1, Math.floor((x + radius) / TILE));
    const minRow = Math.max(0, Math.floor((y - radius) / TILE));
    const maxRow = Math.min(rows - 1, Math.floor((y + radius) / TILE));

    let moved = false;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (grid[r][c] !== CELL.WALL && grid[r][c] !== CELL.COLLAPSIBLE) continue;
        if (!circleOverlapsTile(x, y, radius, c, r)) continue;

        const tx = c * TILE, ty = r * TILE;
        const nearX = Math.max(tx, Math.min(x, tx + TILE));
        const nearY = Math.max(ty, Math.min(y, ty + TILE));
        const dx = x - nearX, dy = y - nearY;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 1e-9) {
          // Player center is fully inside the tile — use minimum penetration to
          // push out through the nearest face rather than blindly adding to x.
          const dL = x - tx, dR = (tx + TILE) - x;
          const dT = y - ty, dB = (ty + TILE) - y;
          if      (dL <= dR && dL <= dT && dL <= dB) { x = tx - radius; }
          else if (dR <= dT && dR <= dB)             { x = tx + TILE + radius; }
          else if (dT <= dB)                         { y = ty - radius; }
          else                                        { y = ty + TILE + radius; }
        } else {
          x += (dx / len) * (radius - len);
          y += (dy / len) * (radius - len);
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x, y };
}

// True if two circles overlap (kill check)
export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = bx - ax, dy = by - ay;
  const d = ar + br;
  return dx * dx + dy * dy < d * d;
}

// AABB slab-method ray vs crusher bounding boxes
export function castRayCrushers(crushers, ox, oy, dx, dy, maxDist) {
  if (!crushers || crushers.length === 0) return null;
  let closest = null;
  for (const c of crushers) {
    const b = c.bounds();
    const invDx = Math.abs(dx) < 1e-9 ? (dx >= 0 ? 1e18 : -1e18) : 1 / dx;
    const invDy = Math.abs(dy) < 1e-9 ? (dy >= 0 ? 1e18 : -1e18) : 1 / dy;
    const tx1 = (b.x1 - ox) * invDx, tx2 = (b.x2 - ox) * invDx;
    const ty1 = (b.y1 - oy) * invDy, ty2 = (b.y2 - oy) * invDy;
    const txEnter = Math.min(tx1, tx2), txExit = Math.max(tx1, tx2);
    const tyEnter = Math.min(ty1, ty2), tyExit = Math.max(ty1, ty2);
    const tEnter = Math.max(txEnter, tyEnter);
    const tExit  = Math.min(txExit,  tyExit);
    if (tExit < 1e-6 || tEnter > tExit || tEnter > maxDist + 1e-6) continue;
    const t = tEnter < 1e-6 ? tExit : tEnter;
    if (t > maxDist + 1e-6) continue;
    if (closest && t >= closest.t) continue;
    let nx = 0, ny = 0;
    if (txEnter > tyEnter) { nx = dx > 0 ? -1 : 1; }
    else                   { ny = dy > 0 ? -1 : 1; }
    closest = { x: ox + dx * t, y: oy + dy * t, t, nx, ny, col: -1, row: -1, crusher: c };
  }
  return closest;
}

// Circle vs AABB overlap (crusher kill check)
export function circleOverlapsAABB(cx, cy, cr, x1, y1, x2, y2) {
  const nearX = Math.max(x1, Math.min(cx, x2));
  const nearY = Math.max(y1, Math.min(cy, y2));
  const dx = cx - nearX, dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}
