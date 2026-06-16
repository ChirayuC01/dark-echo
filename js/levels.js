// Each level: 20 cols x 15 rows. Cell values: 0=empty 1=wall 2=start 3=exit 4=collapsible 5=water 6=hazard
// Enemies defined separately so waypoints can reference grid coords.

export const LEVELS = [
  // ─── Level 1 ─── "The Awakening"  (no enemies – learn mechanics)
  {
    name: 'The Awakening',
    hint: 'Move with WASD · Footsteps reveal walls · SPACE for a loud pulse · Reach the exit',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,1,1,0,1,0,1,0,1,1,1,1,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,1],
      [1,0,1,0,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,1],
      [1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,0,1,0,1,1,1,1,0,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [],
  },

  // ─── Level 2 ─── "The Patrol"  (one patrol enemy)
  {
    name: 'The Patrol',
    hint: 'A guard patrols the corridor · Time your crossing · Pulse is loud – use it wisely',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1],
      [1,0,1,0,1,0,1,1,1,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
      [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // patrol row – fully open
      [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [
      { type: 'patrol', col: 2, row: 7, waypoints: [[2,7],[17,7]] },
    ],
  },

  // ─── Level 3 ─── "The Chamber"  (static hazards)
  {
    name: 'The Chamber',
    hint: 'Hazards emit scan pulses · Listen and watch · Don\'t get caught in the sweep',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [
      { type: 'hazard', col: 5,  row: 2 },
      { type: 'hazard', col: 14, row: 2 },
      { type: 'hazard', col: 9,  row: 8 },
      { type: 'hazard', col: 5,  row: 12 },
      { type: 'hazard', col: 14, row: 12 },
    ],
  },

  // ─── Level 4 ─── "The Hunt"  (sound-chasing enemy)
  {
    name: 'The Hunt',
    hint: 'It hunts by sound · Move quietly · Every pulse gives away your position',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,0,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
      [1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,0,1],
      [1,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,1,0,0,1],
      [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [
      { type: 'chaser', col: 17, row: 5 },
    ],
  },

  // ─── Level 5 ─── "The Gauntlet"  (all enemy types)
  {
    name: 'The Gauntlet',
    hint: 'All threats combined · Silence is survival · Trust the echoes',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1],
      [1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1],
      [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // patrol row
      [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [
      { type: 'patrol',  col: 2,  row: 7, waypoints: [[2,7],[17,7]] },
      { type: 'chaser',  col: 17, row: 1 },
      { type: 'hazard',  col: 9,  row: 5 },
      { type: 'hazard',  col: 5,  row: 11 },
      { type: 'hazard',  col: 14, row: 11 },
    ],
  },

  // ─── Level 6 ─── "The Whisper"  (crouch required)
  // The guard now hears footsteps — not just pulse.
  // A wide open patrol corridor (row 7) splits the level in half.
  // The only crossing points are at col 1 and col 18 (row 6/8 gaps).
  // Normal steps from row 7 reach the patrol anywhere on the corridor;
  // crouched steps (shorter ray range) do not — giving a safe crossing window.
  {
    name: 'The Whisper',
    hint: 'Hold SHIFT (or C) to crouch · The guard hears every footstep · Silence is survival',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1: start, wide open
      [1,0,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,0,1], // 2: upper maze
      [1,0,0,0,1,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1], // 3: upper maze
      [1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1], // 4: upper maze
      [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1], // 5: open connector
      [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1], // 6: wall — gaps at col 1 & 18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7: PATROL CORRIDOR (fully open)
      [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1], // 8: wall — gaps at col 1 & 18
      [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1], // 9: open connector
      [1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1], // 10: lower maze
      [1,0,0,0,1,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1], // 11: lower maze
      [1,0,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,0,1], // 12: lower maze
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13: exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      // stepAware: true — this patrol hears footsteps and investigates
      { type: 'patrol', col: 2, row: 7, stepAware: true, waypoints: [[2,7],[17,7]] },
    ],
  },

  // ─── Level 7 ─── "Flooded"  (water zones)
  // The mid-section is flooded — water tiles slow movement AND amplify every step.
  // Two hazards patrol the flood. The player must cross to reach the lower maze.
  // Crouching still helps (fewer rays), but the splash noise is louder regardless.
  {
    name: 'Flooded',
    hint: 'Water slows your steps — but every splash is louder · Cross the flood carefully',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1: start (col 1)
      [1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1], // 2: upper maze
      [1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1], // 3: upper maze
      [1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1], // 4: upper maze
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5: open approach row
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 6: WATER — walls force water crossing
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 7: WATER — two hazards here
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 8: WATER
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9: open exit row
      [1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1], // 10: lower maze
      [1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1], // 11: lower maze
      [1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1], // 12: lower maze
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13: exit (col 18)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'hazard', col: 5,  row: 7 },
      { type: 'hazard', col: 14, row: 7 },
    ],
  },

  // ─── Level 8 ─── "The Collapse"  (collapsible walls + keys/doors)
  // Two collapsible barriers at rows 6 and 8 (gap at col 9). A key at col 16, row 3
  // unlocks the only door below the second barrier (col 9, row 9). Row 9 is otherwise
  // all walls — col 9 is the sole passage to the lower section.
  // Flow: explore upper section → collect key near chaser → pulse open both barriers
  //       → walk through unlocked door → navigate lower section to exit.
  {
    name: 'The Collapse',
    hint: 'Find the key · Shatter the walls · The door will open',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1: start col 1
      [1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1], // 2: upper maze
      [1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1], // 3: upper maze; KEY at col 16
      [1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1], // 4: upper maze
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5: open approach
      [1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1], // 6: BARRIER — collapsible at col 9
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7: middle zone (patrol)
      [1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1], // 8: BARRIER — collapsible at col 9
      [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1], // 9: DOOR at col 9; all other cols solid
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 10: wide open lower zone
      [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1], // 11: corridor walls — gaps at cols 1, 18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12: wide open
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1], // 13: exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'patrol', col: 1,  row: 7, waypoints: [[1,7],[17,7]] },
      { type: 'chaser', col: 14, row: 3 },
    ],
    keys:  [{ id: 'k1', col: 16, row: 3, doorId: 'd1' }],
    doors: [{ id: 'd1', col: 9,  row: 9 }],
  },

  // ─── Level 9 ─── "The Corridor"  (crushers)
  // Crusher at col 14, range 2 (±80px): sweeps center x=500–660, i.e. cols 12–17.
  // Left safe zone: cols 1–11 (x<473, always clear — 11 tiles of waiting room).
  // Exit gap is at col 14 (crusher's center): safe when crusher is at either extreme.
  // Player flow: enter col 6 → wait in left safe zone → sprint to col 14 when crusher swings out.
  {
    name: 'The Corridor',
    hint: 'Watch for the crusher · Wait until it slides away · Then dash across',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1: start col 1, open row
      [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 2: wall — gap at col 6 (entry, left safe zone)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 3: CORRIDOR 1 (crusher at col 14)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1], // 4: wall — gap at col 14 (exit, crusher center)
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5: open connecting row
      [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 6: wall — gap at col 6
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7: CORRIDOR 2 (crusher at col 14)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1], // 8: wall — gap at col 14
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9: open connecting row
      [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 10: wall — gap at col 6
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11: CORRIDOR 3 (crusher at col 14)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1], // 12: wall — gap at col 14
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13: exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      // col 14, range 2 = ±80px: crusher sweeps cols 12–17; exit gap at col 14 is clear at extremes
      { type: 'crusher', col: 14, row: 3,  axis: 'h', range: 2, period: 13.0 },
      { type: 'crusher', col: 14, row: 7,  axis: 'h', range: 2, period: 10.0 },
      { type: 'crusher', col: 14, row: 11, axis: 'h', range: 2, period:  8.0 },
    ],
  },
];
