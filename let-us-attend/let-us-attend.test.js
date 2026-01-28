/**
 * Unit tests for Let Us Attend game logic
 * @jest-environment node
 */

const {
  hexToPixel,
  pixelToHex,
  hexDistance,
  getHexRing,
  canPlaceTile,
  countInstancesAtPosition,
  processMissedReadings,
  isValidPlacement,
  findNearestEmptyCell,
  findNearestEmptyCellFromViewportCenter,
  calculateConstrainedPan,
  getDecayDurationMs,
  TILE_INTERVAL_MS,
  DECAY_DURATION_MS,
  saveState,
  loadState,
  createInitialState,
  TileState
} = require('./let-us-attend.js');

describe('Tile State Machine', () => {
  test('TileState has correct values', () => {
    expect(TileState.PENDING).toBe('pending');
    expect(TileState.AVAILABLE).toBe('available');
    expect(TileState.COLLECTED).toBe('collected');
  });
});

describe('Timing Constants', () => {
  test('TILE_INTERVAL_MS is 120 seconds', () => {
    expect(TILE_INTERVAL_MS).toBe(120 * 1000);
  });

  test('DECAY_DURATION_MS is 1440 seconds', () => {
    expect(DECAY_DURATION_MS).toBe(1440 * 1000);
  });

  test('getDecayDurationMs returns fixed decay duration', () => {
    expect(getDecayDurationMs()).toBe(DECAY_DURATION_MS);
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

describe('Hex Distance', () => {
  test('distance from cell to itself is 0', () => {
    expect(hexDistance(0, 0, 0, 0)).toBe(0);
    expect(hexDistance(3, 2, 3, 2)).toBe(0);
  });

  test('distance to adjacent cell is 1', () => {
    // Direct neighbors of (0, 0)
    expect(hexDistance(0, 0, 1, 0)).toBe(1);  // E
    expect(hexDistance(0, 0, 0, 1)).toBe(1);  // SE
    expect(hexDistance(0, 0, -1, 1)).toBe(1); // SW
    expect(hexDistance(0, 0, -1, 0)).toBe(1); // W
    expect(hexDistance(0, 0, -1, -1)).toBe(1); // NW
    expect(hexDistance(0, 0, 0, -1)).toBe(1);  // NE
  });

  test('distance to ring 2 cells is 2', () => {
    expect(hexDistance(0, 0, 2, 0)).toBe(2);
    expect(hexDistance(0, 0, 0, 2)).toBe(2);
    expect(hexDistance(0, 0, -2, 0)).toBe(2);
    expect(hexDistance(0, 0, 0, -2)).toBe(2);
  });

  test('distance is symmetric', () => {
    expect(hexDistance(0, 0, 3, 2)).toBe(hexDistance(3, 2, 0, 0));
    expect(hexDistance(1, 1, 4, 3)).toBe(hexDistance(4, 3, 1, 1));
  });
});

describe('Hex Ring Generation', () => {
  test('ring 0 returns just the center', () => {
    const ring = getHexRing(0, 0, 0);
    expect(ring).toEqual([{ q: 0, r: 0 }]);
  });

  test('ring 0 with non-origin center', () => {
    const ring = getHexRing(3, 2, 0);
    expect(ring).toEqual([{ q: 3, r: 2 }]);
  });

  test('ring 1 has 6 cells', () => {
    const ring = getHexRing(0, 0, 1);
    expect(ring.length).toBe(6);
  });

  test('ring 1 starts at NE', () => {
    const ring = getHexRing(0, 0, 1);
    // First cell should be NE of center (0, -1)
    expect(ring[0]).toEqual({ q: 0, r: -1 });
  });

  test('ring 1 cells are all at distance 1 from center', () => {
    const ring = getHexRing(0, 0, 1);
    for (const cell of ring) {
      expect(hexDistance(0, 0, cell.q, cell.r)).toBe(1);
    }
  });

  test('ring 2 has 12 cells', () => {
    const ring = getHexRing(0, 0, 2);
    expect(ring.length).toBe(12);
  });

  test('ring 2 cells are all at distance 2 from center', () => {
    const ring = getHexRing(0, 0, 2);
    for (const cell of ring) {
      expect(hexDistance(0, 0, cell.q, cell.r)).toBe(2);
    }
  });

  test('ring 2 starts at NE of ring 1 end (spiral continuity)', () => {
    const ring1 = getHexRing(0, 0, 1);
    const ring2 = getHexRing(0, 0, 2);

    // Ring 1 ends at NW (-1, -1)
    const ring1End = ring1[ring1.length - 1];
    expect(ring1End).toEqual({ q: -1, r: -1 });

    // Ring 2 should start at NE of that, which is (0, -2)
    expect(ring2[0]).toEqual({ q: 0, r: -2 });
  });

  test('ring 3 has 18 cells', () => {
    const ring = getHexRing(0, 0, 3);
    expect(ring.length).toBe(18);
  });

  test('ring cells are unique (no duplicates)', () => {
    const ring = getHexRing(0, 0, 3);
    const keys = ring.map(c => `${c.q},${c.r}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(ring.length);
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
      scheduleIndex: 5,
      lastTilePlacedAt: 1234567890,
      tiles: [{ pk: '6', q: 3, r: 2, collected: '2025-06-15' }]
    };

    saveState(state);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'let-us-attend',
      expect.any(String)
    );

    const saved = JSON.parse(localStorage.setItem.mock.calls[0][1]);
    expect(saved.scheduleIndex).toBe(5);
    expect(saved.lastTilePlacedAt).toBe(1234567890);
    expect(saved.tiles.length).toBe(1);
  });

  test('loadState restores all fields correctly', () => {
    const state = {
      scheduleIndex: 10,
      lastTilePlacedAt: 1234567890,
      tiles: [{ pk: '6', q: 3, r: 2, collected: '2025-06-15' }],
      lastSaveTime: 1234567890
    };
    mockLocalStorage['let-us-attend'] = JSON.stringify(state);

    const loaded = loadState();

    expect(loaded.scheduleIndex).toBe(10);
    expect(loaded.lastTilePlacedAt).toBe(1234567890);
    expect(loaded.tiles.length).toBe(1);
    expect(loaded.tiles[0].pk).toBe('6');
  });

  test('createInitialState returns correct structure', () => {
    const state = createInitialState();

    expect(state.scheduleIndex).toBe(0);
    expect(state.lastTilePlacedAt).toBe(0);
    expect(state.tiles).toEqual([]);
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

  test('findNearestEmptyCellFromViewportCenter handles zoom', () => {
    const tiles = [];
    const viewportState = {
      panX: 400,
      panY: 300,
      zoom: 2,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const tileSize = 80;

    const result = findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize);
    // With zoom=2, viewport center in canvas coords is different
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

describe('Pan Constraint', () => {
  const tileSize = 80;

  test('returns unchanged pan when no tiles', () => {
    const viewportState = {
      panX: 100,
      panY: 100,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result = calculateConstrainedPan([], viewportState, tileSize);

    expect(result.panX).toBe(100);
    expect(result.panY).toBe(100);
  });

  test('constrains pan to keep single tile visible', () => {
    const tiles = [{ q: 0, r: 0 }];
    const viewportState = {
      panX: -1000, // Way off to the left
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result = calculateConstrainedPan(tiles, viewportState, tileSize);

    // Pan should be constrained so tile is visible
    // Tile at (0,0) has right edge at tileSize (80)
    // Right edge screen pos = panX + 80 * zoom should be >= margin
    expect(result.panX).toBeGreaterThan(-1000);
  });

  test('horizontal constraint only considers vertically visible tiles', () => {
    // Two tiles: one at origin, one far above (off screen vertically)
    const tiles = [
      { q: 0, r: 0 },   // At origin, visible
      { q: 5, r: -10 }  // Far up and right, off screen vertically
    ];
    const viewportState = {
      panX: 400,  // Centered on origin tile
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result = calculateConstrainedPan(tiles, viewportState, tileSize);

    // The far-away tile should not affect horizontal constraint
    // We should be able to pan left without being blocked by the distant tile
    const tilesOnlyOrigin = [{ q: 0, r: 0 }];
    const resultOriginOnly = calculateConstrainedPan(tilesOnlyOrigin, viewportState, tileSize);

    // Constraints should be similar since the off-screen tile is ignored
    expect(result.panX).toBe(resultOriginOnly.panX);
  });

  test('vertical constraint only considers horizontally visible tiles', () => {
    // Two tiles: one at origin, one far to the right (off screen horizontally)
    const tiles = [
      { q: 0, r: 0 },   // At origin, visible
      { q: 20, r: 5 }   // Far right and down, off screen horizontally
    ];
    const viewportState = {
      panX: 400,  // Centered on origin tile
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result = calculateConstrainedPan(tiles, viewportState, tileSize);

    // The far-away tile should not affect vertical constraint
    const tilesOnlyOrigin = [{ q: 0, r: 0 }];
    const resultOriginOnly = calculateConstrainedPan(tilesOnlyOrigin, viewportState, tileSize);

    // Constraints should be similar since the off-screen tile is ignored
    expect(result.panY).toBe(resultOriginOnly.panY);
  });

  test('respects zoom level', () => {
    const tiles = [{ q: 0, r: 0 }];
    const viewportState1 = {
      panX: -500,
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };
    const viewportState2 = {
      panX: -500,
      panY: 300,
      zoom: 2, // Zoomed in
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result1 = calculateConstrainedPan(tiles, viewportState1, tileSize);
    const result2 = calculateConstrainedPan(tiles, viewportState2, tileSize);

    // At higher zoom, the constraint should be different
    expect(result1.panX).not.toBe(result2.panX);
  });

  test('handles missing zoom (defaults to 1)', () => {
    const tiles = [{ q: 0, r: 0 }];
    const viewportState = {
      panX: 400,
      panY: 300,
      // zoom is missing
      viewportWidth: 800,
      viewportHeight: 600
    };

    // Should not throw
    const result = calculateConstrainedPan(tiles, viewportState, tileSize);
    expect(result.panX).toBeDefined();
    expect(result.panY).toBeDefined();
  });

  test('handles null tiles array', () => {
    const viewportState = {
      panX: 100,
      panY: 100,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const result = calculateConstrainedPan(null, viewportState, tileSize);
    expect(result.panX).toBe(100);
    expect(result.panY).toBe(100);
  });

  test('handles tiles at negative coordinates', () => {
    const tiles = [{ q: -2, r: 0 }]; // Tile to the left of origin, on same row
    const viewportState = {
      panX: 400,  // Centered view
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    // First verify the tile is visible with this pan
    const result = calculateConstrainedPan(tiles, viewportState, tileSize);

    // Now try to pan way right (which would move tile off left edge)
    const viewportStateRight = {
      panX: 1000,  // Panned far right
      panY: 300,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600
    };

    const resultConstrained = calculateConstrainedPan(tiles, viewportStateRight, tileSize);
    // Pan should be constrained - can't go as far right
    expect(resultConstrained.panX).toBeLessThan(1000);
  });
});
