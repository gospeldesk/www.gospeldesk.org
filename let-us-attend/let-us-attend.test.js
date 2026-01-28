/**
 * Unit tests for Let Us Attend game logic
 * @jest-environment node
 */

const {
  getCurrentGameDate,
  getCurrentReading,
  getNextReading,
  hexToPixel,
  pixelToHex,
  canPlaceTile,
  countInstancesAtPosition,
  processMissedReadings,
  isValidPlacement,
  findNearestEmptyCell,
  findNearestEmptyCellFromViewportCenter,
  getDecayDurationMs,
  MS_PER_DAY,
  saveState,
  loadState,
  TileState
} = require('./let-us-attend.js');

describe('Time Model', () => {
  test('getCurrentGameDate returns correct date at 1x speed', () => {
    const realStartTime = new Date('2025-06-01T12:00:00Z').getTime();
    const gameStartDate = '2025-06-01';
    const speedMultiplier = 1;

    // 12 hours later in real time
    const now = new Date('2025-06-01T24:00:00Z').getTime();

    const result = getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now);
    expect(result).toBe('2025-06-01');
  });

  test('getCurrentGameDate returns correct date at 1x speed after 2 days', () => {
    const realStartTime = new Date('2025-06-01T00:00:00Z').getTime();
    const gameStartDate = '2025-06-01';
    const speedMultiplier = 1;

    // 2 days later
    const now = new Date('2025-06-03T00:00:00Z').getTime();

    const result = getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now);
    expect(result).toBe('2025-06-03');
  });

  test('getCurrentGameDate returns correct date at 60x speed (1 min = 1 hr)', () => {
    const realStartTime = new Date('2025-06-01T00:00:00Z').getTime();
    const gameStartDate = '2025-06-01';
    const speedMultiplier = 60;

    // 24 minutes later = 24 hours game time = 1 day
    const now = realStartTime + (24 * 60 * 1000);

    const result = getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now);
    expect(result).toBe('2025-06-02');
  });

  test('getCurrentGameDate returns correct date at 86400x speed (1 sec = 1 day)', () => {
    const realStartTime = new Date('2025-06-01T00:00:00Z').getTime();
    const gameStartDate = '2025-06-01';
    const speedMultiplier = 86400;

    // 5 seconds later = 5 days game time
    const now = realStartTime + (5 * 1000);

    const result = getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now);
    expect(result).toBe('2025-06-06');
  });

  test('time advances correctly after pause/resume', () => {
    // Simulating: started June 1, played 2 real days at 1x, paused
    // Then resumed with new realStartTime but keeping the game progress
    const realStartTime = new Date('2025-06-03T00:00:00Z').getTime();
    const gameStartDate = '2025-06-03'; // Game date when we paused
    const speedMultiplier = 1;

    // 1 day after resume
    const now = new Date('2025-06-04T00:00:00Z').getTime();

    const result = getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now);
    expect(result).toBe('2025-06-04');
  });
});

describe('Schedule Processing', () => {
  const schedule = [
    { date: '2025-03-30', pk: '11' },
    { date: '2025-05-11', pk: '12' },
    { date: '2025-06-15', pk: '41' },
    { date: '2025-06-16', pk: '20' },
    { date: '2025-06-16', pk: '25' }, // Same date, second reading
    { date: '2025-06-22', pk: '9' }
  ];

  test('getCurrentReading returns correct pk for a given date', () => {
    const result = getCurrentReading(schedule, '2025-06-15');
    expect(result).toEqual({ date: '2025-06-15', pk: '41' });
  });

  test('getCurrentReading returns null when no reading scheduled before date', () => {
    const result = getCurrentReading(schedule, '2025-03-01');
    expect(result).toBeNull();
  });

  test('getCurrentReading returns most recent reading when between dates', () => {
    const result = getCurrentReading(schedule, '2025-06-20');
    // Should return the last reading scheduled on or before 2025-06-20
    // That's pk 25 from 2025-06-16
    expect(result).toEqual({ date: '2025-06-16', pk: '25' });
  });

  test('getNextReading returns the next upcoming reading', () => {
    const result = getNextReading(schedule, '2025-06-15');
    expect(result).toEqual({ date: '2025-06-16', pk: '20' });
  });

  test('getNextReading returns null when no more readings', () => {
    const result = getNextReading(schedule, '2025-06-30');
    expect(result).toBeNull();
  });
});

describe('Tile State Machine', () => {
  test('TileState has correct values', () => {
    expect(TileState.PENDING).toBe('pending');
    expect(TileState.AVAILABLE).toBe('available');
    expect(TileState.COLLECTED).toBe('collected');
  });
});

describe('Hex Coordinate Conversion', () => {
  test('hexToPixel returns correct pixel position for origin', () => {
    const result = hexToPixel(0, 0, 80);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  test('hexToPixel returns correct pixel position for even row', () => {
    const result = hexToPixel(2, 0, 80);
    expect(result.x).toBe(160); // 2 * 80
    expect(result.y).toBe(0);
  });

  test('hexToPixel returns correct pixel position for odd row (offset)', () => {
    const result = hexToPixel(2, 1, 80);
    expect(result.x).toBe(200); // 2 * 80 + 40 offset
    expect(result.y).toBeCloseTo(69.28, 1); // 80 * 1.1547 * 0.75
  });

  test('pixelToHex returns correct hex for origin', () => {
    const result = pixelToHex(0, 0, 80);
    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
  });

  test('pixelToHex returns correct hex for simple case', () => {
    const result = pixelToHex(160, 0, 80);
    expect(result.q).toBe(2);
    expect(result.r).toBe(0);
  });
});

describe('Repeat/Stacking Logic', () => {
  const tiles = [
    { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
    { pk: '6', q: 3, r: 2, collected: '2026-06-14' }, // Stacked
    { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
  ];

  test('canPlaceTile returns true for empty cell', () => {
    expect(canPlaceTile(tiles, '11', 5, 5)).toBe(true);
  });

  test('canPlaceTile returns false for occupied cell with different pk', () => {
    expect(canPlaceTile(tiles, '11', 3, 2)).toBe(false);
  });

  test('canPlaceTile returns true for occupied cell with same pk (stacking)', () => {
    expect(canPlaceTile(tiles, '6', 3, 2)).toBe(true);
  });

  test('countInstancesAtPosition returns correct count for stacked tiles', () => {
    expect(countInstancesAtPosition(tiles, 3, 2)).toBe(2);
  });

  test('countInstancesAtPosition returns 1 for single tile', () => {
    expect(countInstancesAtPosition(tiles, 4, 2)).toBe(1);
  });

  test('countInstancesAtPosition returns 0 for empty cell', () => {
    expect(countInstancesAtPosition(tiles, 5, 5)).toBe(0);
  });
});

describe('Miss Penalty', () => {
  test('processMissedReadings removes oldest instance of pk', () => {
    const tiles = [
      { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
      { pk: '6', q: 3, r: 2, collected: '2026-06-14' },
      { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(2);
    expect(result.find(t => t.pk === '6' && t.collected === '2025-06-15')).toBeUndefined();
    expect(result.find(t => t.pk === '6' && t.collected === '2026-06-14')).toBeDefined();
    expect(result.find(t => t.pk === '9')).toBeDefined();
  });

  test('processMissedReadings does nothing if pk not in collection', () => {
    const tiles = [
      { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(1);
    expect(result[0].pk).toBe('9');
  });

  test('processMissedReadings handles multiple missed readings', () => {
    const tiles = [
      { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
      { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6', '9']);

    expect(result.length).toBe(0);
  });

  test('processMissedReadings removes only oldest of stacked tiles', () => {
    const tiles = [
      { pk: '6', q: 1, r: 1, collected: '2024-01-01' }, // Oldest
      { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
      { pk: '6', q: 3, r: 2, collected: '2026-06-14' }  // Newest
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(2);
    expect(result.find(t => t.collected === '2024-01-01')).toBeUndefined();
  });
});

describe('Collision Detection', () => {
  const tiles = [
    { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
    { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
  ];

  test('isValidPlacement returns true for empty cell', () => {
    expect(isValidPlacement(tiles, '11', 5, 5)).toBe(true);
  });

  test('isValidPlacement returns false for cell with different pk', () => {
    expect(isValidPlacement(tiles, '11', 3, 2)).toBe(false);
  });

  test('isValidPlacement returns true for cell with same pk (stacking)', () => {
    expect(isValidPlacement(tiles, '6', 3, 2)).toBe(true);
  });

  test('isValidPlacement returns true for origin (no longer reserved)', () => {
    expect(isValidPlacement(tiles, '11', 0, 0)).toBe(true);
  });
});

describe('Find Nearest Empty Cell', () => {
  test('findNearestEmptyCell returns origin when empty', () => {
    const tiles = [];
    const result = findNearestEmptyCell(tiles);
    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
  });

  test('findNearestEmptyCell finds next cell when origin occupied', () => {
    const tiles = [{ pk: '6', q: 0, r: 0, collected: '2025-06-15' }];
    const result = findNearestEmptyCell(tiles);
    // Should find something at radius 1
    expect(Math.max(Math.abs(result.q), Math.abs(result.r))).toBe(1);
  });

  test('findNearestEmptyCell spirals outward', () => {
    const tiles = [
      { pk: '6', q: 0, r: 0, collected: '2025-06-15' },
      { pk: '6', q: -1, r: -1, collected: '2025-06-15' },
      { pk: '6', q: -1, r: 0, collected: '2025-06-15' },
      { pk: '6', q: -1, r: 1, collected: '2025-06-15' },
      { pk: '6', q: 0, r: -1, collected: '2025-06-15' },
      { pk: '6', q: 0, r: 1, collected: '2025-06-15' },
      { pk: '6', q: 1, r: -1, collected: '2025-06-15' },
      { pk: '6', q: 1, r: 0, collected: '2025-06-15' },
      { pk: '6', q: 1, r: 1, collected: '2025-06-15' }
    ];
    const result = findNearestEmptyCell(tiles);
    // Should find something at radius 2
    expect(Math.max(Math.abs(result.q), Math.abs(result.r))).toBe(2);
  });
});

describe('Persistence', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockLocalStorage[key] || null),
      setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
      removeItem: jest.fn(key => { delete mockLocalStorage[key]; })
    };
  });

  test('saveState produces valid JSON', () => {
    const state = {
      realStartTime: 1234567890,
      gameStartDate: '2025-06-01',
      speedMultiplier: 1,
      tiles: [{ pk: '6', q: 3, r: 2, collected: '2025-06-15' }],
      lastSaveTime: 1234567890
    };

    saveState(state);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'let-us-attend',
      expect.any(String)
    );

    const saved = JSON.parse(localStorage.setItem.mock.calls[0][1]);
    expect(saved.gameStartDate).toBe('2025-06-01');
    expect(saved.tiles.length).toBe(1);
  });

  test('loadState restores all fields correctly', () => {
    const state = {
      realStartTime: 1234567890,
      gameStartDate: '2025-06-01',
      speedMultiplier: 60,
      tiles: [{ pk: '6', q: 3, r: 2, collected: '2025-06-15' }],
      lastSaveTime: 1234567890
    };
    mockLocalStorage['let-us-attend'] = JSON.stringify(state);

    const loaded = loadState();

    expect(loaded.realStartTime).toBe(1234567890);
    expect(loaded.gameStartDate).toBe('2025-06-01');
    expect(loaded.speedMultiplier).toBe(60);
    expect(loaded.tiles.length).toBe(1);
    expect(loaded.tiles[0].pk).toBe('6');
  });

  test('round-trip: save -> load -> save produces identical output', () => {
    const state = {
      realStartTime: 1234567890,
      gameStartDate: '2025-06-01',
      speedMultiplier: 1,
      tiles: [
        { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
        { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
      ],
      lastSaveTime: 1234567890
    };

    saveState(state);
    const firstSave = mockLocalStorage['let-us-attend'];

    const loaded = loadState();
    saveState(loaded);
    const secondSave = mockLocalStorage['let-us-attend'];

    expect(JSON.parse(firstSave)).toEqual(JSON.parse(secondSave));
  });

  test('loadState handles missing localStorage gracefully', () => {
    const loaded = loadState();

    expect(loaded).toBeNull();
  });

  test('loadState handles corrupted localStorage gracefully', () => {
    mockLocalStorage['let-us-attend'] = 'not valid json {{{';

    const loaded = loadState();

    expect(loaded).toBeNull();
  });
});

describe('Decay Duration', () => {
  test('getDecayDurationMs returns 10 days at 1x speed', () => {
    const duration = getDecayDurationMs(1);
    expect(duration).toBe(MS_PER_DAY * 10);
  });

  test('getDecayDurationMs returns ~100 seconds at 8640x speed', () => {
    // At 8640x, 10 sec = 1 day, so 10 days = 100 sec
    const duration = getDecayDurationMs(8640);
    expect(duration).toBeCloseTo(100000, -2); // ~100,000ms = 100 seconds
  });

  test('getDecayDurationMs scales inversely with speed', () => {
    const duration1x = getDecayDurationMs(1);
    const duration2x = getDecayDurationMs(2);
    expect(duration1x).toBe(duration2x * 2);
  });
});

describe('Viewport-Centered Placement', () => {
  test('findNearestEmptyCellFromViewportCenter returns center when empty', () => {
    const tiles = [];
    const viewportState = {
      panX: 400,
      panY: 300,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const tileSize = 80;

    const result = findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize);
    // Center should be at 0,0 since viewport is centered on origin
    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
  });

  test('findNearestEmptyCellFromViewportCenter finds nearby cell when center occupied', () => {
    const tiles = [{ pk: '6', q: 0, r: 0, isCollected: false, placedAt: Date.now() }];
    const viewportState = {
      panX: 400,
      panY: 300,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const tileSize = 80;

    const result = findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize);
    // Should find a cell at radius 1
    expect(Math.max(Math.abs(result.q), Math.abs(result.r))).toBe(1);
  });

  test('findNearestEmptyCellFromViewportCenter respects pan offset', () => {
    const tiles = [];
    const viewportState = {
      panX: 0, // Panned so viewport left edge is at canvas origin
      panY: 0,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const tileSize = 80;

    const result = findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize);
    // Center of viewport (400, 300) should map to positive hex coordinates
    expect(result.q).toBeGreaterThan(0);
    expect(result.r).toBeGreaterThan(0);
  });

  test('findNearestEmptyCellFromViewportCenter does not stack uncollected tiles', () => {
    // Place an uncollected tile at center
    const tiles = [{ pk: '6', q: 0, r: 0, isCollected: false, placedAt: Date.now() }];
    const viewportState = {
      panX: 400,
      panY: 300,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const tileSize = 80;

    const result = findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize);
    // Should NOT return 0,0 since it's occupied
    expect(result.q !== 0 || result.r !== 0).toBe(true);
  });
});
