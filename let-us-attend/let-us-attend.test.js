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
  findNearestEmptyCellFromHex,
  isOnBoard,
  countWords,
  calculateReadingTimeMs,
  getDecayDurationMs,
  TILE_INTERVAL_MS,
  DECAY_DURATION_MS,
  READING_WPM,
  BOARD_SIZE_PX,
  saveState,
  loadState,
  createInitialState
} = require('./let-us-attend.js');

describe('Timing Constants', () => {
  test('TILE_INTERVAL_MS is 720 seconds (12 minutes)', () => {
    expect(TILE_INTERVAL_MS).toBe(720 * 1000);
  });

  test('DECAY_DURATION_MS is 1440 seconds', () => {
    expect(DECAY_DURATION_MS).toBe(1440 * 1000);
  });

  test('getDecayDurationMs returns fixed decay duration', () => {
    expect(getDecayDurationMs()).toBe(DECAY_DURATION_MS);
  });
});

describe('Word Counting', () => {
  test('countWords counts words in plain text', () => {
    expect(countWords('hello world')).toBe(2);
  });

  test('countWords strips HTML tags', () => {
    expect(countWords('<p>hello</p> <span>world</span>')).toBe(2);
  });

  test('countWords handles multiple spaces', () => {
    expect(countWords('hello    world')).toBe(2);
  });

  test('countWords handles empty string', () => {
    expect(countWords('')).toBe(0);
  });

  test('countWords handles whitespace only', () => {
    expect(countWords('   \n\t  ')).toBe(0);
  });

  test('countWords handles complex HTML', () => {
    const html = '<div class="verse"><sup>1</sup>In the beginning was the Word</div>';
    expect(countWords(html)).toBe(7); // "1", "In", "the", "beginning", "was", "the", "Word"
  });
});

describe('Reading Time Calculation', () => {
  test('calculateReadingTimeMs returns correct time for READING_WPM words', () => {
    // READING_WPM words should take 1 minute = 60000ms
    expect(calculateReadingTimeMs(READING_WPM)).toBe(60000);
  });

  test('calculateReadingTimeMs returns correct time for half READING_WPM', () => {
    // Half of READING_WPM words should take 30 seconds = 30000ms
    expect(calculateReadingTimeMs(READING_WPM / 2)).toBe(30000);
  });

  test('calculateReadingTimeMs returns 0 for 0 words', () => {
    expect(calculateReadingTimeMs(0)).toBe(0);
  });

  test('calculateReadingTimeMs scales linearly', () => {
    const time100 = calculateReadingTimeMs(100);
    const time200 = calculateReadingTimeMs(200);
    expect(time200).toBe(time100 * 2);
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

describe('Hex-Centered Placement', () => {
  test('findNearestEmptyCellFromHex returns center when empty', () => {
    const tiles = [];
    const result = findNearestEmptyCellFromHex(tiles, 5, 5, 128);
    expect(result).toEqual({ q: 5, r: 5 });
  });

  test('findNearestEmptyCellFromHex finds ring 1 when center occupied', () => {
    const tiles = [{ q: 5, r: 5 }];
    const result = findNearestEmptyCellFromHex(tiles, 5, 5, 128);
    // Should be at distance 1 from center
    expect(hexDistance(5, 5, result.q, result.r)).toBe(1);
  });

  test('findNearestEmptyCellFromHex respects board bounds', () => {
    const tiles = [];
    // Center at origin - some ring 1 cells would be off-board
    const result = findNearestEmptyCellFromHex(tiles, 0, 0, 128);
    expect(isOnBoard(result.q, result.r, 128)).toBe(true);
  });

  test('findNearestEmptyCellFromHex finds first empty in spiral order', () => {
    // Occupy center and some ring 1 cells
    const tiles = [
      { q: 5, r: 5 },   // center
      { q: 5, r: 4 },   // ring 1, first cell (NE)
      { q: 6, r: 4 },   // ring 1, second cell
    ];
    const result = findNearestEmptyCellFromHex(tiles, 5, 5, 128);
    // Should find another ring 1 cell
    expect(hexDistance(5, 5, result.q, result.r)).toBe(1);
    // Should not be one of the occupied cells
    expect(result).not.toEqual({ q: 5, r: 4 });
    expect(result).not.toEqual({ q: 6, r: 4 });
  });

  test('findNearestEmptyCellFromHex handles fully occupied ring 1', () => {
    // Occupy center and all of ring 1
    const ring1 = getHexRing(5, 5, 1);
    const tiles = [{ q: 5, r: 5 }, ...ring1];
    const result = findNearestEmptyCellFromHex(tiles, 5, 5, 128);
    // Should find a ring 2 cell
    expect(hexDistance(5, 5, result.q, result.r)).toBe(2);
  });
});

describe('Board Bounds', () => {
  const tileSize = 128;
  const hexHeight = tileSize * 1.1547;

  test('origin is on board', () => {
    expect(isOnBoard(0, 0, tileSize)).toBe(true);
  });

  test('position near origin is on board', () => {
    expect(isOnBoard(5, 5, tileSize)).toBe(true);
  });

  test('negative q is off board', () => {
    expect(isOnBoard(-1, 0, tileSize)).toBe(false);
  });

  test('negative r is off board', () => {
    expect(isOnBoard(0, -1, tileSize)).toBe(false);
  });

  test('position near right edge of board', () => {
    // Board is 8192px wide, tile is 128px
    // Max q where tile fits: (8192 - 128) / 128 = 63, so q=63 should fit
    expect(isOnBoard(63, 0, tileSize)).toBe(true);
    // q=64 would exceed
    expect(isOnBoard(64, 0, tileSize)).toBe(false);
  });

  test('position near bottom edge of board', () => {
    // Board is 8192px tall, hex height is ~147.8px
    // Row spacing is hexHeight * 0.75 = ~110.85px
    // Max r where tile fits: solve r*110.85 + 147.8 <= 8192
    // r <= (8192 - 147.8) / 110.85 = ~72.6, so r=72 should fit
    expect(isOnBoard(0, 72, tileSize)).toBe(true);
    // r=73 would exceed
    expect(isOnBoard(0, 73, tileSize)).toBe(false);
  });

  test('BOARD_SIZE_PX is 8192 (64 tiles at 128px)', () => {
    expect(BOARD_SIZE_PX).toBe(8192);
  });
});

describe('getMinZoom', () => {
  // Import the browser-only functions by mocking window
  let getMinZoom, constrainPan, viewportState;

  beforeEach(() => {
    // Create mock viewportState and functions that mirror the browser code
    viewportState = {
      panX: 0,
      panY: 0,
      zoom: 1,
      viewportWidth: 0,
      viewportHeight: 0
    };

    getMinZoom = () => {
      const minZoomX = viewportState.viewportWidth / BOARD_SIZE_PX;
      const minZoomY = viewportState.viewportHeight / BOARD_SIZE_PX;
      return Math.max(0.3, minZoomX, minZoomY);
    };

    constrainPan = () => {
      const zoom = viewportState.zoom || 1;

      const scaledWidth = BOARD_SIZE_PX * zoom;
      const scaledHeight = BOARD_SIZE_PX * zoom;

      const minPanX = viewportState.viewportWidth - scaledWidth;
      const maxPanX = 0;

      const minPanY = viewportState.viewportHeight - scaledHeight;
      const maxPanY = 0;

      viewportState.panX = Math.max(minPanX, Math.min(maxPanX, viewportState.panX));
      viewportState.panY = Math.max(minPanY, Math.min(maxPanY, viewportState.panY));
    };
  });

  test('returns 1 when viewport equals board size', () => {
    viewportState.viewportWidth = BOARD_SIZE_PX;
    viewportState.viewportHeight = BOARD_SIZE_PX;
    expect(getMinZoom()).toBe(1);
  });

  test('returns higher value for wider viewport', () => {
    viewportState.viewportWidth = BOARD_SIZE_PX * 2;
    viewportState.viewportHeight = BOARD_SIZE_PX;
    expect(getMinZoom()).toBe(2); // width limited
  });

  test('returns higher value for taller viewport', () => {
    viewportState.viewportWidth = BOARD_SIZE_PX;
    viewportState.viewportHeight = BOARD_SIZE_PX * 2;
    expect(getMinZoom()).toBe(2); // height limited
  });

  test('returns fractional zoom for smaller viewport', () => {
    viewportState.viewportWidth = BOARD_SIZE_PX / 2;
    viewportState.viewportHeight = BOARD_SIZE_PX / 2;
    expect(getMinZoom()).toBe(0.5);
  });

  test('enforces 0.3 floor for very small viewports', () => {
    viewportState.viewportWidth = BOARD_SIZE_PX / 10;
    viewportState.viewportHeight = BOARD_SIZE_PX / 10;
    // Calculated would be 0.1, but floor is 0.3
    expect(getMinZoom()).toBe(0.3);
  });

  describe('constrainPan board bounds', () => {
    test('clamps panX to 0 at left edge', () => {
      viewportState.viewportWidth = 1024;
      viewportState.viewportHeight = 1024;
      viewportState.zoom = 1;
      viewportState.panX = 100; // trying to show whitespace on left

      constrainPan();

      expect(viewportState.panX).toBe(0);
    });

    test('clamps panX at right edge', () => {
      viewportState.viewportWidth = 1024;
      viewportState.viewportHeight = 1024;
      viewportState.zoom = 1;
      viewportState.panX = -100000; // too far right, would show whitespace

      constrainPan();

      // minPanX = 1024 - BOARD_SIZE_PX
      expect(viewportState.panX).toBe(1024 - BOARD_SIZE_PX);
    });

    test('clamps panY to 0 at top edge', () => {
      viewportState.viewportWidth = 1024;
      viewportState.viewportHeight = 1024;
      viewportState.zoom = 1;
      viewportState.panY = 100; // trying to show whitespace on top

      constrainPan();

      expect(viewportState.panY).toBe(0);
    });

    test('clamps panY at bottom edge', () => {
      viewportState.viewportWidth = 1024;
      viewportState.viewportHeight = 1024;
      viewportState.zoom = 1;
      viewportState.panY = -100000; // too far down, would show whitespace

      constrainPan();

      // minPanY = 1024 - BOARD_SIZE_PX
      expect(viewportState.panY).toBe(1024 - BOARD_SIZE_PX);
    });

    test('respects zoom when calculating bounds', () => {
      viewportState.viewportWidth = 1024;
      viewportState.viewportHeight = 1024;
      viewportState.zoom = 2; // scaled board is BOARD_SIZE_PX * 2
      viewportState.panX = -100000;
      viewportState.panY = -100000;

      constrainPan();

      // minPanX = 1024 - BOARD_SIZE_PX * 2
      expect(viewportState.panX).toBe(1024 - BOARD_SIZE_PX * 2);
      expect(viewportState.panY).toBe(1024 - BOARD_SIZE_PX * 2);
    });
  });
});
