// Each level: 20 cols x 15 rows. Cell values: 0=empty 1=wall 2=start 3=exit 4=collapsible 5=water 6=hazard
// Enemies defined separately so waypoints can reference grid coords.

export const LEVELS = [
  // ─── Level 1 ─── "The Awakening"  (no enemies – learn mechanics)
  {
    name: 'The Awakening',
    hint: 'Move with WASD · Footsteps reveal walls · SPACE for a loud pulse · Reach the exit',
    reverb: 'small',
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
    reverb: 'medium',
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
    reverb: 'medium',
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
    reverb: 'medium',
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
    reverb: 'large',
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
    reverb: 'small',
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
    reverb: 'large',
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
    reverb: 'medium',
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
    hint: 'Find the switch · Time the crushers · Dodge the sentry at the exit',
    reverb: 'large',
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
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,3,1], // 13: exit col 18; wall at col 16 until switch fires
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      // col 14, range 2 = ±80px: crusher sweeps cols 12–17; exit gap at col 14 is clear at extremes
      { type: 'crusher', col: 14, row: 3,  axis: 'h', range: 2, period: 13.0 },
      { type: 'crusher', col: 14, row: 7,  axis: 'h', range: 2, period: 10.0 },
      { type: 'crusher', col: 14, row: 11, axis: 'h', range: 2, period:  8.0 },
      // Sentry guards the exit row — cone sweeps clockwise; player must wait for it to face away
      { type: 'sentry',  col: 12, row: 13, angle: Math.PI },
    ],
    // Switch at col 10, row 9 (player crosses it on the way from corridor 3 exit to corridor 3 entry)
    // Player path in row 9: enters at col 14 (gap in row 8), exits at col 6 (gap in row 10) — col 10 is mid-path
    // Opens the wall at row 13 col 16, unblocking the final run to the exit
    triggers: [{ col: 10, row: 9, action: 'remove_wall', targetId: '13,16' }],
  },

  // ─── ACT II ──────────────────────────────────────────────────────────────────

  // ─── Level 10 ─── "The Gauntlet II"  (all mechanics + BlindStalker)
  // BlindStalker starts in the mid-section (row 5, col 15). It hears everything —
  // even crouched footsteps. The player must pulse the collapsible wall at col 5, row 5
  // to reach the key at col 2, row 7. That pulse alerts the stalker.
  // Strategy: pulse → sprint for key → escape south before stalker closes in.
  // Route: start col 1 row 1 → col 9 dry path through water row (row 3) → row 5 →
  //        pulse col5 → key at row7 col2 → col1 south → row9 → door at col10 row10 →
  //        row11 (crusher) → row13 exit (sentry guards).
  {
    name: 'The Gauntlet II',
    hint: 'It hears everything · Silence is survival · Combine all you\'ve learned',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1: start col 1
      [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1], // 2: gaps col 9, col 18
      [1,0,5,5,5,5,5,5,5,0,5,5,5,5,5,5,5,5,0,1], // 3: water cols 2-8 + 10-17; dry col 9 and 18
      [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1], // 4: gaps col 9, col 18
      [1,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5: collapsible col 5 (BlindStalker at col 15)
      [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1], // 6: gaps col 4, col 15, col 18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7: key at col 2
      [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1], // 8: gaps col 1 (open), col 10, col 18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9: patrol (step-aware)
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 10: door at col 10; rest solid
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11: crusher row
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1], // 12: scattered walls
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13: exit col 18 (sentry guards)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'stalker', col: 15, row: 5 },
      { type: 'hazard',  col:  5, row: 3 },
      { type: 'hazard',  col: 13, row: 3 },
      { type: 'patrol',  col:  3, row: 9, stepAware: true, waypoints: [[3,9],[16,9]] },
      { type: 'crusher', col: 10, row: 11, axis: 'h', range: 3, period: 5.5 },
      { type: 'sentry',  col: 14, row: 13, angle: Math.PI },
    ],
    keys:  [{ id: 'key-g2', col: 2, row: 7, doorId: 'door-g2' }],
    doors: [{ id: 'door-g2', col: 10, row: 10 }],
  },

  // ─── Level 11 ─── "The Corridor II"  (patrol showcase — step echoes)
  // Three parallel east-west corridors connected by short north-south gaps.
  // Three step-aware patrols occupy each corridor. Player must crouch to cross.
  {
    name: 'The Corridor II',
    hint: 'Three guards, three corridors · Crouch to cross · Step-echoes betray you',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start
      [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1], // 2 wall — gaps col 1,18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 3 corridor A
      [1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1], // 4 wall — gaps col 6,13
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 corridor B
      [1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1], // 6 wall — gaps col 6,13
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7 corridor C
      [1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1], // 8 wall — gaps col 6,13
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 corridor D
      [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1], // 10 wall — gaps col 1,18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11 open
      [1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1], // 12 obstacles
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'patrol', col: 2,  row: 3, stepAware: true, waypoints: [[2,3],[17,3]] },
      { type: 'patrol', col: 17, row: 5, stepAware: true, waypoints: [[17,5],[2,5]] },
      { type: 'patrol', col: 2,  row: 7, stepAware: true, waypoints: [[2,7],[17,7]] },
    ],
  },

  // ─── Level 12 ─── "The Chamber II"  (large open room, screamer intro)
  // One large open room with pillar obstacles. Two screamers flank the center path.
  // Player must navigate around them using footsteps only — no pulse allowed safely.
  {
    name: 'The Chamber II',
    hint: 'The red spikes react to any sound ray · Navigate without triggering them',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start col 1
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1], // 2
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1], // 3
      [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1], // 4
      [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1], // 5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 6 center lane
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7 center lane
      [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1], // 8
      [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1], // 9
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1], // 10
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,1], // 11
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'screamer', col: 9,  row: 4 },
      { type: 'screamer', col: 9,  row: 10 },
      { type: 'chaser',   col: 17, row: 7 },
    ],
  },

  // ─── Level 13 ─── "The Factory"  (crusher gauntlet)
  // Four crushers in alternating corridors. Each crusher sweeps its entire lane.
  // Timing windows require sprinting through one corridor at a time.
  {
    name: 'The Factory',
    hint: 'The machines never stop · Watch the rhythm · Sprint when the gap opens',
    reverb: 'medium',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 2 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 3 crusher corridor A
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 4 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 crusher corridor B
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 6 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7 crusher corridor C
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 8 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 crusher corridor D
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 10 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11 open exit zone
      [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1], // 12 scattered walls
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'crusher', col: 5,  row: 3,  axis: 'h', range: 3, period: 7.0 },
      { type: 'crusher', col: 14, row: 5,  axis: 'h', range: 3, period: 6.0 },
      { type: 'crusher', col: 5,  row: 7,  axis: 'h', range: 3, period: 8.5 },
      { type: 'crusher', col: 14, row: 9,  axis: 'h', range: 3, period: 5.5 },
      { type: 'patrol',  col: 2,  row: 11, waypoints: [[2,11],[17,11]] },
    ],
  },

  // ─── Level 14 ─── "The Scream"  (screamer puzzle — pulse-free challenge)
  // Three screamers form a triangle around the path. The collapsible wall at col 10
  // row 7 can ONLY be safely pulsed from behind the south wall (row 9+) where the
  // pulse ray doesn't reach the screamers. A patrol guards the south approach.
  {
    name: 'The Scream',
    hint: 'They react to any ray — plan every step before you move',
    reverb: 'medium',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start
      [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1], // 2
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1], // 3
      [1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 open
      [1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1], // 6
      [1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1], // 7 collapsible col 10
      [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1], // 8 wall — gaps col 5, 14
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 safe south zone
      [1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1], // 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11
      [1,1,0,1,1,0,1,0,1,1,1,1,0,1,0,1,1,0,1,1], // 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'screamer', col: 5,  row: 5 },
      { type: 'screamer', col: 14, row: 5 },
      { type: 'screamer', col: 9,  row: 3 },
      { type: 'patrol',   col: 2,  row: 9, stepAware: true, waypoints: [[2,9],[17,9]] },
    ],
  },

  // ─── Level 15 ─── "The Archive"  (3 keys, 3 doors)
  // Dense maze with 3 key-door pairs. Keys are scattered in dead-end alcoves.
  // Player must explore all three branches before the exit door opens.
  {
    name: 'The Archive',
    hint: 'Three keys hidden in the dark · Find them all before the way out appears',
    reverb: 'small',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1], // 1 start col 1
      [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1], // 2
      [1,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1], // 3 key-A alcove at col 2
      [1,1,0,1,1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1], // 4
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1], // 5
      [1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1], // 6
      [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1], // 7 key-B alcove at col 18
      [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1], // 8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 open corridor
      [1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1], // 10 — door-C at col 18 row 10
      [1,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1], // 11 key-C alcove at col 9 row 12
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1,1,0,1,1,0,1], // 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'chaser',  col: 10, row: 5 },
      { type: 'patrol',  col: 3,  row: 9, waypoints: [[3,9],[16,9]] },
      { type: 'hazard',  col: 5,  row: 12 },
    ],
    keys: [
      { id: 'arc-k1', col: 2,  row: 3,  doorId: 'arc-d1' },
      { id: 'arc-k2', col: 18, row: 7,  doorId: 'arc-d2' },
      { id: 'arc-k3', col: 9,  row: 12, doorId: 'arc-d3' },
    ],
    doors: [
      { id: 'arc-d1', col: 6,  row: 5 },
      { id: 'arc-d2', col: 10, row: 9 },
      { id: 'arc-d3', col: 14, row: 9 },
    ],
  },

  // ─── Level 16 ─── "The Flood II"  (water + screamers — no safe pulse)
  // Wide water zone bisects the map. Two screamers stand in the water.
  // Any pulse at the crossing range will hit them. Player must wade through
  // silently at full speed cost, footsteps amplified.
  {
    name: 'The Flood II',
    hint: 'Water amplifies every step · The sentinels react to any ray · Cross in silence',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start
      [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,0,1], // 2
      [1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1], // 3
      [1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 approach
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 6 WATER
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 7 WATER (screamers here)
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 8 WATER
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 exit approach
      [1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1,1], // 10
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1], // 11
      [1,0,1,0,1,1,0,1,0,1,1,1,0,1,0,1,1,0,1,1], // 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'screamer', col: 6,  row: 7 },
      { type: 'screamer', col: 13, row: 7 },
      { type: 'hazard',   col: 5,  row: 3 },
      { type: 'hazard',   col: 14, row: 3 },
    ],
  },

  // ─── Level 17 ─── "The Awakening II"  (BlindStalker stealth test)
  // One large open space. One BlindStalker. No hazards. Player must reach exit
  // without the stalker locking on. Moving in short bursts with long pauses.
  {
    name: 'The Awakening II',
    hint: 'One hunter · Open space · It hears everything — move in silence, wait in darkness',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start col 1
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 2 open
      [1,0,0,1,1,0,0,0,0,1,0,1,0,0,0,0,1,1,0,1], // 3 sparse cover
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1], // 4
      [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1], // 5
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 6 wide open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7 wide open
      [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1], // 8
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1], // 9
      [1,0,0,1,1,0,0,0,0,1,0,1,0,0,0,0,1,1,0,1], // 10 sparse cover
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11 open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12 open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'stalker', col: 10, row: 7 },
    ],
  },

  // ─── Level 18 ─── "The Web"  (trigger chain — spawn_enemy + open_door)
  // Two trigger tiles: first spawns a chaser mid-map, second removes a wall
  // that blocks the exit path. The player must trip both triggers to progress
  // but the spawned chaser immediately starts hunting.
  {
    name: 'The Web',
    hint: 'Step on the switch — but something will wake · Plan your escape route first',
    reverb: 'medium',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1], // 1 start
      [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1], // 2
      [1,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1], // 3
      [1,1,0,1,1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 trigger-1 row (col 5)
      [1,0,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1], // 6
      [1,0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,1], // 7
      [1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1], // 8
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 trigger-2 row (col 14)
      [1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1], // 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11
      [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,0,1,0,1], // 12
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit — wall at 13,15 blocks until trigger-2
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'patrol', col: 3, row: 11, waypoints: [[3,11],[16,11]] },
      { type: 'hazard', col: 9, row: 3 },
    ],
    triggers: [
      { col: 5,  row: 5, action: 'spawn_enemy', targetId: 'chaser,10,7' },
      { col: 14, row: 9, action: 'remove_wall',  targetId: '13,15' },
    ],
  },

  // ─── Level 19 ─── "The Vault"  (all Act II mechanics combined)
  // Screamers guard the key alcove. A crusher patrols the main corridor.
  // A BlindStalker wanders the exit hall. Player must collect the key,
  // avoid the screamers, cross the crusher, and slip past the stalker.
  {
    name: 'The Vault',
    hint: 'Key behind the sentinels · Crusher in the hall · Stalker at the gate',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1 start
      [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1], // 2
      [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1], // 3 key at col 17 row 3
      [1,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,0,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 open
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 6 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7 crusher corridor
      [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], // 8 wall — gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 open
      [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1], // 10
      [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1], // 11
      [1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1], // 12 wall — gaps col 6, 14; door at col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'screamer', col: 9,  row: 3 },
      { type: 'screamer', col: 13, row: 3 },
      { type: 'crusher',  col: 5,  row: 7, axis: 'h', range: 3, period: 7.0 },
      { type: 'stalker',  col: 10, row: 12 },
      { type: 'sentry',   col: 3,  row: 13, angle: 0 },
    ],
    keys:  [{ id: 'vault-k1', col: 17, row: 3, doorId: 'vault-d1' }],
    doors: [{ id: 'vault-d1', col: 10, row: 12 }],
  },

  // ─── Level 20 ─── "The Deep"  (final — all mechanics, hardest execution)
  // The largest and most complex level. Four zones divided by walls.
  // Zone A (rows 1-5): upper maze with a screamer and patrol.
  // Zone B (rows 6-8): water crossing with a screamer in the center.
  // Zone C (rows 9-11): crusher gauntlet guarded by a stalker.
  // Zone D (rows 12-13): exit hall with a sentry and collapsible barrier.
  // Key in zone A unlocks the door between zones B and C.
  {
    name: 'The Deep',
    hint: 'Four zones · Every threat combined · Only silence survives the dark',
    reverb: 'large',
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,2,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1], // 1 start col 1; key at col 17 row 1
      [1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1], // 2 zone A maze
      [1,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,1], // 3 zone A maze
      [1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5 open connector
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 6 WATER zone B
      [1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1], // 7 WATER (screamer at col 9)
      [1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1], // 8 door at col 10; rest open; gap col 10
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9 zone C — crusher corridor
      [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1], // 10 wall — gaps col 5, 14
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11 open
      [1,0,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,0,1], // 12 collapsible col 9; gaps col 1, 18
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1], // 13 exit col 18; sentry at col 15
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14
    ],
    enemies: [
      { type: 'screamer', col: 6,  row: 3 },
      { type: 'patrol',   col: 2,  row: 5, stepAware: true, waypoints: [[2,5],[17,5]] },
      { type: 'screamer', col: 9,  row: 7 },
      { type: 'crusher',  col: 9,  row: 9, axis: 'h', range: 3, period: 6.5 },
      { type: 'stalker',  col: 14, row: 11 },
      { type: 'sentry',   col: 15, row: 13, angle: Math.PI },
    ],
    keys:  [{ id: 'deep-k1', col: 17, row: 1, doorId: 'deep-d1' }],
    doors: [{ id: 'deep-d1', col: 10, row: 8 }],
  },
];
