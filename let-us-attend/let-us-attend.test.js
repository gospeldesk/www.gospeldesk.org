/**
 * Unit tests for Let Us Attend game logic
 * @jest-environment node
 */

const {
  getCurrentGameDate,
  getCurrentReading,
  getNextReading,
  canPlaceTile,
  countInstancesAtPosition,
  processMissedReadings,
  isValidPlacement,
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

describe('Repeat/Stacking Logic', () => {
  const tiles = [
    { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
    { pk: '6', x: 3, y: 2, collected: '2026-06-14' }, // Stacked
    { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
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
      { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
      { pk: '6', x: 3, y: 2, collected: '2026-06-14' },
      { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(2);
    expect(result.find(t => t.pk === '6' && t.collected === '2025-06-15')).toBeUndefined();
    expect(result.find(t => t.pk === '6' && t.collected === '2026-06-14')).toBeDefined();
    expect(result.find(t => t.pk === '9')).toBeDefined();
  });

  test('processMissedReadings does nothing if pk not in collection', () => {
    const tiles = [
      { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(1);
    expect(result[0].pk).toBe('9');
  });

  test('processMissedReadings handles multiple missed readings', () => {
    const tiles = [
      { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
      { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
    ];

    const result = processMissedReadings(tiles, ['6', '9']);

    expect(result.length).toBe(0);
  });

  test('processMissedReadings removes only oldest of stacked tiles', () => {
    const tiles = [
      { pk: '6', x: 1, y: 1, collected: '2024-01-01' }, // Oldest
      { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
      { pk: '6', x: 3, y: 2, collected: '2026-06-14' }  // Newest
    ];

    const result = processMissedReadings(tiles, ['6']);

    expect(result.length).toBe(2);
    expect(result.find(t => t.collected === '2024-01-01')).toBeUndefined();
  });
});

describe('Collision Detection', () => {
  const tiles = [
    { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
    { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
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

  test('isValidPlacement returns false for center staging area', () => {
    expect(isValidPlacement(tiles, '11', 0, 0)).toBe(false);
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
      tiles: [{ pk: '6', x: 3, y: 2, collected: '2025-06-15' }],
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
      tiles: [{ pk: '6', x: 3, y: 2, collected: '2025-06-15' }],
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
        { pk: '6', x: 3, y: 2, collected: '2025-06-15' },
        { pk: '9', x: 4, y: 2, collected: '2025-06-22' }
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
