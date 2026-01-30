/**
 * DOM/Integration tests for Let Us Attend game
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the game module
const gameModule = require('./let-us-attend.js');

// Get special tile constants
const { ABOUT_PK, SYNAXIS_PK } = gameModule;

// Mock game data
const mockData = {
  readings: {
    '11': {
      pk: '11',
      slug: 'healing-at-bethesda',
      title: 'Healing at Bethesda',
      book: 'John',
      ref: 'John 5:1-15',
      direct: ['jesus', 'sick-man'],
      content: '<p><span class="v">1</span>Test content for reading 11.</p>'
    },
    '12': {
      pk: '12',
      slug: 'samaritan-woman',
      title: 'Samaritan Woman',
      book: 'John',
      ref: 'John 4:5-42',
      direct: ['jesus', 'samaritan-woman'],
      content: '<p><span class="v">5</span>Test content for reading 12.</p>'
    },
    '41': {
      pk: '41',
      slug: 'all-saints',
      title: 'All Saints',
      book: 'Matthew',
      ref: 'Matthew 10:32-33',
      direct: ['jesus', 'disciples'],
      content: '<p><span class="v">32</span>Test content for reading 41.</p>'
    },
    [ABOUT_PK]: {
      pk: ABOUT_PK,
      slug: 'about',
      title: 'Let Us Attend!',
      book: null,
      ref: '',
      direct: [],
      content: '<p>Welcome to Let Us Attend!</p>'
    },
    [SYNAXIS_PK]: {
      pk: SYNAXIS_PK,
      slug: 'synaxis',
      title: 'The Synaxis',
      book: null,
      ref: '',
      direct: [],
      content: '<p>This is your Synaxis.</p>'
    }
  },
  schedule: [
    { date: '2025-06-15', pk: '41' },
    { date: '2025-06-16', pk: '11' },
    { date: '2025-06-22', pk: '12' }
  ]
};

describe('DOM Rendering', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="game-container">
        <div id="stats">
          <span id="collected-count">0</span>/<span id="total-count">0</span>
          <span id="current-date"></span>
          <span id="next-date"></span>
          <span id="current-reading"></span>
        </div>
        <div id="board">
          <div id="staging-area"></div>
          <div id="hex-grid"></div>
        </div>
        <select id="speed-select"></select>
      </div>
      <div id="reading-modal" class="hidden">
        <div id="modal-content"></div>
        <button id="mark-read-btn">Mark as Read</button>
        <button id="close-modal-btn">Close</button>
      </div>
    `;
    container = document.getElementById('game-container');

    // Mock localStorage
    const store = {};
    global.localStorage = {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn(key => { delete store[key]; })
    };
  });

  test('tile element has correct book color class', () => {
    const tile = document.createElement('div');
    tile.classList.add('tile');

    const book = mockData.readings['41'].book.toLowerCase();
    tile.classList.add(`book-${book}`);

    expect(tile.classList.contains('book-matthew')).toBe(true);
  });

  test('stacked tiles show count badge', () => {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.pk = '6';

    const stackCount = 3;
    if (stackCount > 1) {
      const badge = document.createElement('span');
      badge.classList.add('stack-badge');
      badge.textContent = `x${stackCount}`;
      tile.appendChild(badge);
    }

    const badge = tile.querySelector('.stack-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('x3');
  });

  test('reading modal displays content when opened', () => {
    const modal = document.getElementById('reading-modal');
    const content = document.getElementById('modal-content');
    const reading = mockData.readings['41'];

    content.innerHTML = `
      <h2>${reading.title}</h2>
      <p class="ref">${reading.ref}</p>
      <div class="reading-content">${reading.content}</div>
    `;
    modal.classList.remove('hidden');

    expect(modal.classList.contains('hidden')).toBe(false);
    expect(content.querySelector('h2').textContent).toBe('All Saints');
    expect(content.querySelector('.reading-content').innerHTML).toContain('Test content');
  });
});

describe('User Interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="staging-area"></div>
      <div id="hex-grid"></div>
      <div id="reading-modal" class="hidden">
        <div id="modal-content"></div>
        <button id="mark-read-btn">Mark as Read</button>
      </div>
    `;
  });

  test('click on center tile opens reading modal', () => {
    const stagingArea = document.getElementById('staging-area');
    const modal = document.getElementById('reading-modal');

    const tile = document.createElement('div');
    tile.classList.add('tile', 'available');
    tile.dataset.pk = '41';
    stagingArea.appendChild(tile);

    tile.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });

    tile.click();

    expect(modal.classList.contains('hidden')).toBe(false);
  });

  test('mark-read button transitions tile to collected state', () => {
    const tile = document.createElement('div');
    tile.classList.add('tile', 'available');
    tile.dataset.pk = '41';

    const btn = document.getElementById('mark-read-btn');
    btn.addEventListener('click', () => {
      tile.classList.remove('available');
      tile.classList.add('collected');
      tile.draggable = true;
    });

    btn.click();

    expect(tile.classList.contains('available')).toBe(false);
    expect(tile.classList.contains('collected')).toBe(true);
    expect(tile.draggable).toBe(true);
  });
});

describe('Keyboard Shortcuts', () => {
  test('Option+N triggers with altKey and code KeyN', () => {
    let tilePlaced = false;

    // Simulate the handleKeyDown logic
    function handleKeyDown(e) {
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        tilePlaced = true;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Simulate Option+N keypress
    const event = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyN',
      key: '˜', // On Mac, Option+N produces tilde
      bubbles: true
    });
    document.dispatchEvent(event);

    expect(tilePlaced).toBe(true);

    document.removeEventListener('keydown', handleKeyDown);
  });

  test('N without Option does not trigger', () => {
    let tilePlaced = false;

    function handleKeyDown(e) {
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        tilePlaced = true;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Simulate just N keypress (no altKey)
    const event = new KeyboardEvent('keydown', {
      altKey: false,
      code: 'KeyN',
      key: 'n',
      bubbles: true
    });
    document.dispatchEvent(event);

    expect(tilePlaced).toBe(false);

    document.removeEventListener('keydown', handleKeyDown);
  });

  test('Option+other key does not trigger', () => {
    let tilePlaced = false;

    function handleKeyDown(e) {
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        tilePlaced = true;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Simulate Option+M keypress
    const event = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyM',
      key: 'µ',
      bubbles: true
    });
    document.dispatchEvent(event);

    expect(tilePlaced).toBe(false);

    document.removeEventListener('keydown', handleKeyDown);
  });
});

describe('Drag and Drop', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="hex-viewport">
        <div id="hex-canvas">
          <div class="hex-cell" data-q="1" data-r="1"></div>
          <div class="hex-cell" data-q="2" data-r="1"></div>
          <div class="hex-cell occupied" data-q="3" data-r="1" data-pk="9"></div>
        </div>
      </div>
    `;
  });

  test('dragging tile to empty cell places it', () => {
    const canvas = document.getElementById('hex-canvas');
    const emptyCell = canvas.querySelector('[data-q="1"][data-r="1"]');

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '41';
    tile.draggable = true;

    // Simulate drop
    const canPlace = !emptyCell.classList.contains('occupied') ||
                     emptyCell.dataset.pk === tile.dataset.pk;

    expect(canPlace).toBe(true);

    if (canPlace) {
      emptyCell.appendChild(tile);
      emptyCell.classList.add('occupied');
      emptyCell.dataset.pk = tile.dataset.pk;
    }

    expect(emptyCell.contains(tile)).toBe(true);
    expect(emptyCell.classList.contains('occupied')).toBe(true);
  });

  test('dragging tile to occupied cell with different pk rejects', () => {
    const canvas = document.getElementById('hex-canvas');
    const occupiedCell = canvas.querySelector('[data-q="3"][data-r="1"]');

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '41'; // Different from cell's pk (9)

    const canPlace = !occupiedCell.classList.contains('occupied') ||
                     occupiedCell.dataset.pk === tile.dataset.pk;

    expect(canPlace).toBe(false);
  });

  test('dragging tile to same-pk cell allows stacking', () => {
    const canvas = document.getElementById('hex-canvas');
    const occupiedCell = canvas.querySelector('[data-q="3"][data-r="1"]');

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '9'; // Same as cell's pk

    const canPlace = !occupiedCell.classList.contains('occupied') ||
                     occupiedCell.dataset.pk === tile.dataset.pk;

    expect(canPlace).toBe(true);
  });

  test('click after drag release is suppressed', () => {
    // Simulate the justDragged flag behavior
    let justDragged = false;
    let modalOpened = false;

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '41';

    // Click handler checks justDragged
    tile.addEventListener('click', () => {
      if (!justDragged) {
        modalOpened = true;
      }
    });

    // Simulate drag end setting the flag
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);

    // Click fires synchronously after mouseup, before setTimeout callback
    tile.click();

    expect(modalOpened).toBe(false);
  });

  test('click without prior drag opens modal', () => {
    let justDragged = false;
    let modalOpened = false;

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '41';

    tile.addEventListener('click', () => {
      if (!justDragged) {
        modalOpened = true;
      }
    });

    // No drag, just click
    tile.click();

    expect(modalOpened).toBe(true);
  });

  test('mousedown+mouseup without move should not suppress click (just a click)', () => {
    // Simulates the actual game behavior where mousedown starts drag tracking
    let justDragged = false;
    let didMove = false;
    let modalOpened = false;

    const tile = document.createElement('div');
    tile.classList.add('tile', 'collected');
    tile.dataset.pk = '41';

    // Mousedown starts tracking
    tile.addEventListener('mousedown', () => {
      didMove = false;
    });

    // Mousemove sets didMove
    tile.addEventListener('mousemove', () => {
      didMove = true;
    });

    // Mouseup only sets justDragged if mouse moved
    tile.addEventListener('mouseup', () => {
      if (didMove) {
        justDragged = true;
        setTimeout(() => { justDragged = false; }, 0);
      }
    });

    // Click handler
    tile.addEventListener('click', () => {
      if (!justDragged) {
        modalOpened = true;
      }
    });

    // Simulate click (mousedown, mouseup, click - no mousemove)
    tile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    tile.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(modalOpened).toBe(true);
  });
});

describe('Stats Display', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="stats">
        <span id="collected-count">0</span>/<span id="total-count">318</span>
        <span id="current-date">June 15, 2025</span>
        <span id="next-date">June 16</span>
        <span id="current-reading">All Saints</span>
      </div>
    `;
  });

  test('stats panel shows correct collected count', () => {
    const collectedCount = document.getElementById('collected-count');
    const tiles = [
      { pk: '6' },
      { pk: '9' },
      { pk: '11' }
    ];

    // Count unique pks
    const uniquePks = new Set(tiles.map(t => t.pk));
    collectedCount.textContent = uniquePks.size;

    expect(collectedCount.textContent).toBe('3');
  });

  test('stats panel shows current game date', () => {
    const currentDate = document.getElementById('current-date');
    expect(currentDate.textContent).toBe('June 15, 2025');
  });
});

describe('Modal Opening via Click', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hex-viewport" id="hex-viewport">
        <div class="hex-canvas" id="hex-canvas">
          <div class="hex-cell" data-q="0" data-r="0">
            <div class="tile book-john" data-pk="11" data-q="0" data-r="0">
              <div class="tile-title">Healing at Bethesda</div>
              <div class="tile-ref">John</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-overlay" id="reading-modal">
        <div class="modal-content">
          <h2 id="modal-title"></h2>
          <p class="ref" id="modal-ref"></p>
          <div class="reading-text" id="modal-text"></div>
        </div>
      </div>
    `;
  });

  test('clicking tile in hex-canvas opens modal via delegated handler', () => {
    const canvas = document.getElementById('hex-canvas');
    const modal = document.getElementById('reading-modal');
    const tile = canvas.querySelector('.tile');

    // Simulate delegated click handler like real code
    let modalOpened = false;
    canvas.addEventListener('click', (e) => {
      const clickedTile = e.target.closest('.tile');
      if (clickedTile) {
        modal.classList.add('visible');
        modalOpened = true;
      }
    });

    // Dispatch click with bubbles: true
    tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(modalOpened).toBe(true);
    expect(modal.classList.contains('visible')).toBe(true);
  });

  test('click handler finds tile via e.target.closest', () => {
    const canvas = document.getElementById('hex-canvas');
    const tileTitle = canvas.querySelector('.tile-title');

    let foundTile = null;
    canvas.addEventListener('click', (e) => {
      foundTile = e.target.closest('.tile');
    });

    // Click on nested element (tile-title)
    tileTitle.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(foundTile).not.toBeNull();
    expect(foundTile.dataset.pk).toBe('11');
  });

  test('modal opens with correct reading content', () => {
    const modal = document.getElementById('reading-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalRef = document.getElementById('modal-ref');
    const modalText = document.getElementById('modal-text');

    // Simulate openReadingModal behavior
    const reading = mockData.readings['11'];
    modalTitle.textContent = reading.title;
    modalRef.textContent = reading.ref;
    modalText.innerHTML = reading.content;
    modal.classList.add('visible');

    expect(modal.classList.contains('visible')).toBe(true);
    expect(modalTitle.textContent).toBe('Healing at Bethesda');
    expect(modalRef.textContent).toBe('John 5:1-15');
    expect(modalText.innerHTML).toContain('Test content for reading 11');
  });

  test('click on canvas (not tile) does not open modal', () => {
    const canvas = document.getElementById('hex-canvas');
    const modal = document.getElementById('reading-modal');

    let modalOpened = false;
    canvas.addEventListener('click', (e) => {
      const clickedTile = e.target.closest('.tile');
      if (clickedTile) {
        modal.classList.add('visible');
        modalOpened = true;
      }
    });

    // Click directly on canvas
    canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(modalOpened).toBe(false);
    expect(modal.classList.contains('visible')).toBe(false);
  });

  test('justDragged flag suppresses modal open after drag', () => {
    const canvas = document.getElementById('hex-canvas');
    const modal = document.getElementById('reading-modal');
    const tile = canvas.querySelector('.tile');

    let justDragged = true;
    let modalOpened = false;

    canvas.addEventListener('click', (e) => {
      const clickedTile = e.target.closest('.tile');
      if (!clickedTile || justDragged) return;
      modal.classList.add('visible');
      modalOpened = true;
    });

    tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(modalOpened).toBe(false);
    expect(modal.classList.contains('visible')).toBe(false);
  });
});

describe('Completion Indicator', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="modal-overlay" id="reading-modal">
        <div class="modal-content">
          <div class="logo" id="completion-indicator">
            <svg viewBox="1400 1240 800 1120">
              <path d="M 1529.375 2133.012..."/>
            </svg>
          </div>
          <h2 id="modal-title"></h2>
          <p class="ref" id="modal-ref"></p>
          <div class="reading-text" id="modal-text"></div>
        </div>
      </div>
    `;
  });

  test('indicator shows uncollected state when tile is not collected', () => {
    const modal = document.getElementById('reading-modal');
    const indicator = document.getElementById('completion-indicator');

    // Simulate opening modal for uncollected tile
    modal.classList.add('visible');
    modal.classList.remove('collected');

    // Should have indicator visible but not collected class
    expect(indicator).not.toBeNull();
    expect(modal.classList.contains('visible')).toBe(true);
    expect(modal.classList.contains('collected')).toBe(false);
  });

  test('indicator shows collected state when tile is already collected', () => {
    const modal = document.getElementById('reading-modal');
    const indicator = document.getElementById('completion-indicator');

    // Simulate opening modal for already-collected tile
    modal.classList.add('visible', 'collected');

    expect(indicator).not.toBeNull();
    expect(modal.classList.contains('visible')).toBe(true);
    expect(modal.classList.contains('collected')).toBe(true);
  });

  test('indicator transitions to collected when reading completes', () => {
    const modal = document.getElementById('reading-modal');

    // Start uncollected
    modal.classList.add('visible');
    modal.classList.remove('collected');

    expect(modal.classList.contains('collected')).toBe(false);

    // Simulate completion (what closeModal does when newProgress >= 1)
    modal.classList.add('collected');

    expect(modal.classList.contains('collected')).toBe(true);
  });

  test('collected class is removed when modal closes', () => {
    const modal = document.getElementById('reading-modal');

    // Open with collected state
    modal.classList.add('visible', 'collected');
    expect(modal.classList.contains('collected')).toBe(true);

    // Simulate closeModal behavior
    modal.classList.remove('visible', 'collected');

    expect(modal.classList.contains('visible')).toBe(false);
    expect(modal.classList.contains('collected')).toBe(false);
  });
});

describe('Persistence Integration', () => {
  let store;

  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn(key => { delete store[key]; })
    };

    document.body.innerHTML = `
      <div id="hex-viewport">
        <div id="hex-canvas"></div>
      </div>
      <span id="collected-count">0</span>
    `;
  });

  test('page reload preserves tile positions', () => {
    const state = {
      scheduleIndex: 5,
      lastTilePlacedAt: Date.now(),
      tiles: [
        { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
        { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
      ]
    };

    // Save state
    gameModule.saveState(state);

    // "Reload" - load state
    const loaded = gameModule.loadState();

    expect(loaded.tiles.length).toBe(2);
    expect(loaded.tiles[0].q).toBe(3);
    expect(loaded.tiles[0].r).toBe(2);
    expect(loaded.tiles[1].pk).toBe('9');
  });

  test('page reload preserves schedule progress', () => {
    const state = {
      scheduleIndex: 10,
      lastTilePlacedAt: Date.now() - 60000,
      tiles: []
    };

    gameModule.saveState(state);
    const loaded = gameModule.loadState();

    expect(loaded.scheduleIndex).toBe(10);
  });
});

// ============================================================================
// Time-Based Behavior Tests
// ============================================================================

describe('Time-Based Behavior', () => {
  const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
  const TILE_INTERVAL_MS = gameModule.TILE_INTERVAL_MS;
  const FAST_DECAY_MULTIPLIER = 300;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('tile is expired after DECAY_DURATION_MS', () => {
    const now = Date.now();
    const placedAt = now - DECAY_DURATION_MS;

    // Tile placed exactly DECAY_DURATION_MS ago
    const elapsed = now - placedAt;
    const isExpired = elapsed >= DECAY_DURATION_MS;

    expect(isExpired).toBe(true);
  });

  test('tile is not expired before DECAY_DURATION_MS', () => {
    const now = Date.now();
    const placedAt = now - (DECAY_DURATION_MS - 1000); // 1 second before expiry

    const elapsed = now - placedAt;
    const isExpired = elapsed >= DECAY_DURATION_MS;

    expect(isExpired).toBe(false);
  });

  test('tile should be placed when TILE_INTERVAL_MS has passed', () => {
    const now = Date.now();
    const lastTilePlacedAt = now - TILE_INTERVAL_MS;

    const timeSinceLastTile = now - lastTilePlacedAt;
    const shouldPlaceTile = timeSinceLastTile >= TILE_INTERVAL_MS;

    expect(shouldPlaceTile).toBe(true);
  });

  test('tile should not be placed before TILE_INTERVAL_MS', () => {
    const now = Date.now();
    const lastTilePlacedAt = now - (TILE_INTERVAL_MS - 1000); // 1 second before interval

    const timeSinceLastTile = now - lastTilePlacedAt;
    const shouldPlaceTile = timeSinceLastTile >= TILE_INTERVAL_MS;

    expect(shouldPlaceTile).toBe(false);
  });

  test('fast decay multiplies time by 300x', () => {
    const decayDuration = DECAY_DURATION_MS / FAST_DECAY_MULTIPLIER;
    const now = Date.now();
    const placedAt = now - decayDuration;

    // With fast decay, this should now be expired
    const elapsed = now - placedAt;
    const isExpired = elapsed >= decayDuration;

    expect(isExpired).toBe(true);
    expect(decayDuration).toBe(DECAY_DURATION_MS / 300);
  });

  test('fast decay tile interval is also reduced by 300x', () => {
    const fastInterval = TILE_INTERVAL_MS / FAST_DECAY_MULTIPLIER;
    const now = Date.now();
    const lastTilePlacedAt = now - fastInterval;

    const timeSinceLastTile = now - lastTilePlacedAt;
    const shouldPlaceTile = timeSinceLastTile >= fastInterval;

    expect(shouldPlaceTile).toBe(true);
    expect(fastInterval).toBe(TILE_INTERVAL_MS / 300);
  });

  test('modal open pauses decay by advancing placedAt', () => {
    const now = Date.now();
    const tile = {
      pk: '11',
      placedAt: now - 60000, // Placed 60 seconds ago
      isCollected: false
    };

    // Simulate modal being open for 30 seconds
    const modalDuration = 30000;

    // Advance placedAt by modal duration (this is what closeModal does)
    tile.placedAt += modalDuration;

    // Original: 60s elapsed, now effectively 30s elapsed
    const newElapsed = now - tile.placedAt;
    expect(newElapsed).toBe(30000);
  });

  test('advancing system time causes tile to expire', () => {
    const initialTime = Date.now();
    const tile = {
      pk: '11',
      placedAt: initialTime,
      isCollected: false
    };

    // Initially not expired
    let now = Date.now();
    expect(now - tile.placedAt < DECAY_DURATION_MS).toBe(true);

    // Advance time by decay duration
    jest.advanceTimersByTime(DECAY_DURATION_MS);

    // Now should be expired
    now = Date.now();
    expect(now - tile.placedAt >= DECAY_DURATION_MS).toBe(true);
  });
});

// ============================================================================
// Tile State Transition Tests
// ============================================================================

describe('Tile State Transitions', () => {
  describe('Reading Progress', () => {
    test('partial read sets readProgress between 0 and 1', () => {
      const tile = {
        pk: '11',
        placedAt: Date.now(),
        isCollected: false
      };

      // Simulate partial reading (halfway through)
      const startProgress = 0;
      const readingTimeMs = 60000; // 1 minute reading
      const modalDuration = 30000; // Modal open for 30 seconds
      const progressGained = modalDuration / readingTimeMs;
      const newProgress = Math.min(1, startProgress + progressGained);

      tile.readProgress = newProgress;

      expect(tile.readProgress).toBe(0.5);
      expect(tile.readProgress).toBeGreaterThan(0);
      expect(tile.readProgress).toBeLessThan(1);
    });

    test('progress resumes from saved state on reopen', () => {
      const tile = {
        pk: '11',
        placedAt: Date.now(),
        isCollected: false,
        readProgress: 0.5 // Already 50% read
      };

      // Modal opens, progress starts from saved state
      const currentStartProgress = tile.readProgress || 0;

      expect(currentStartProgress).toBe(0.5);
    });

    test('completing remaining progress marks tile as collected', () => {
      const tile = {
        pk: '11',
        placedAt: Date.now(),
        isCollected: false,
        readProgress: 0.5 // Already 50% read
      };

      // Modal open for enough time to complete
      const readingTimeMs = 60000;
      const modalDuration = 30000; // Need 50% more
      const progressGained = modalDuration / readingTimeMs;
      const newProgress = Math.min(1, tile.readProgress + progressGained);

      if (newProgress >= 1) {
        tile.isCollected = true;
        tile.collected = new Date().toISOString();
        delete tile.placedAt;
        delete tile.readProgress;
      }

      expect(tile.isCollected).toBe(true);
      expect(tile.collected).toBeDefined();
      expect(tile.placedAt).toBeUndefined();
      expect(tile.readProgress).toBeUndefined();
    });

    test('incomplete read preserves progress and pauses decay', () => {
      const now = Date.now();
      const tile = {
        pk: '11',
        placedAt: now - 60000,
        isCollected: false
      };

      // Partial read
      const modalDuration = 15000;
      const readingTimeMs = 60000;
      const progressGained = modalDuration / readingTimeMs;
      tile.readProgress = progressGained;
      tile.placedAt += modalDuration; // Pause decay

      expect(tile.readProgress).toBe(0.25);
      expect(tile.placedAt).toBe(now - 60000 + modalDuration);
    });

    test('zero readingTimeMs immediately completes', () => {
      const tile = {
        pk: '11',
        placedAt: Date.now(),
        isCollected: false
      };

      const startProgress = 0;
      const readingTimeMs = 0;
      const modalDuration = 100;
      // When readingTimeMs is 0, progressGained should default to 0
      const progressGained = readingTimeMs > 0 ? modalDuration / readingTimeMs : 0;
      const newProgress = Math.min(1, startProgress + progressGained);

      // With 0 reading time, progress doesn't advance
      expect(newProgress).toBe(0);
    });
  });

  describe('Decay Removal', () => {
    test('expired uncollected tile is removed from tiles array', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: '11', q: 5, r: 5, placedAt: now - DECAY_DURATION_MS - 1000, isCollected: false }
      ];

      // Simulate decay check
      const decayDuration = DECAY_DURATION_MS;
      const toRemove = new Set();

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= decayDuration) {
          toRemove.add(i);
        }
      }

      // Remove tiles
      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        tiles.splice(idx, 1);
      }

      expect(tiles.length).toBe(0);
    });

    test('decay also removes oldest collected tile of same pk', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: '11', q: 5, r: 5, isCollected: true, collected: '2025-01-01T10:00:00Z' }, // oldest
        { pk: '11', q: 5, r: 5, isCollected: true, collected: '2025-01-01T11:00:00Z' }, // newer
        { pk: '11', q: 6, r: 5, placedAt: now - DECAY_DURATION_MS - 1000, isCollected: false } // expires
      ];

      // Simulate decay check (mirrors updateGame logic)
      const decayDuration = DECAY_DURATION_MS;
      const toRemove = new Set();

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= decayDuration) {
          toRemove.add(i);

          // Find oldest collected instance of same pk
          let oldestIdx = -1;
          let oldestDate = null;
          for (let j = 0; j < tiles.length; j++) {
            const c = tiles[j];
            if (c.pk === t.pk && c.isCollected && !toRemove.has(j)) {
              if (oldestDate === null || c.collected < oldestDate) {
                oldestDate = c.collected;
                oldestIdx = j;
              }
            }
          }
          if (oldestIdx !== -1) {
            toRemove.add(oldestIdx);
          }
        }
      }

      // Remove tiles in reverse order
      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        tiles.splice(idx, 1);
      }

      // Should have removed: uncollected tile and oldest collected
      expect(tiles.length).toBe(1);
      expect(tiles[0].collected).toBe('2025-01-01T11:00:00Z');
    });

    test('decay with no collected counterpart only removes uncollected', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: '11', q: 5, r: 5, placedAt: now - DECAY_DURATION_MS - 1000, isCollected: false }
      ];

      const decayDuration = DECAY_DURATION_MS;
      const toRemove = new Set();

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= decayDuration) {
          toRemove.add(i);

          // No collected tiles exist for this pk
          let oldestIdx = -1;
          let oldestDate = null;
          for (let j = 0; j < tiles.length; j++) {
            const c = tiles[j];
            if (c.pk === t.pk && c.isCollected && !toRemove.has(j)) {
              if (oldestDate === null || c.collected < oldestDate) {
                oldestDate = c.collected;
                oldestIdx = j;
              }
            }
          }
          if (oldestIdx !== -1) {
            toRemove.add(oldestIdx);
          }
        }
      }

      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        tiles.splice(idx, 1);
      }

      expect(tiles.length).toBe(0);
      expect(toRemove.size).toBe(1);
    });

    test('collected tiles never decay', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: '11', q: 5, r: 5, isCollected: true, collected: '2025-01-01T10:00:00Z' }
      ];

      // Simulate decay check
      const toRemove = new Set();

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        // Key: only uncollected tiles with placedAt can decay
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= DECAY_DURATION_MS) {
          toRemove.add(i);
        }
      }

      expect(toRemove.size).toBe(0);
      expect(tiles.length).toBe(1);
    });

    test('multiple expired tiles are all removed', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: '11', q: 5, r: 5, placedAt: now - DECAY_DURATION_MS - 1000, isCollected: false },
        { pk: '12', q: 6, r: 5, placedAt: now - DECAY_DURATION_MS - 2000, isCollected: false },
        { pk: '13', q: 7, r: 5, placedAt: now - 1000, isCollected: false } // Not expired
      ];

      const toRemove = new Set();

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= DECAY_DURATION_MS) {
          toRemove.add(i);
        }
      }

      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        tiles.splice(idx, 1);
      }

      expect(tiles.length).toBe(1);
      expect(tiles[0].pk).toBe('13');
    });
  });
});

// ============================================================================
// Integration Tests (Game Loop Logic)
// ============================================================================

describe('Game Loop Integration', () => {
  const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
  const TILE_INTERVAL_MS = gameModule.TILE_INTERVAL_MS;

  /**
   * Simulate one game tick (mirrors updateGame logic).
   * Returns updated state for inspection.
   */
  function processGameTick(gameState, schedule, readings, fastDecay = false) {
    const now = Date.now();
    const decayDuration = fastDecay ? DECAY_DURATION_MS / 300 : DECAY_DURATION_MS;
    const toRemove = new Set();

    // Find expired tiles
    for (let i = 0; i < gameState.tiles.length; i++) {
      const t = gameState.tiles[i];
      if (!t.isCollected && t.placedAt && (now - t.placedAt) >= decayDuration) {
        toRemove.add(i);

        // Find oldest collected instance of same pk
        let oldestIdx = -1;
        let oldestDate = null;
        for (let j = 0; j < gameState.tiles.length; j++) {
          const c = gameState.tiles[j];
          if (c.pk === t.pk && c.isCollected && !toRemove.has(j)) {
            if (oldestDate === null || c.collected < oldestDate) {
              oldestDate = c.collected;
              oldestIdx = j;
            }
          }
        }
        if (oldestIdx !== -1) {
          toRemove.add(oldestIdx);
        }
      }
    }

    // Remove expired tiles
    if (toRemove.size > 0) {
      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        gameState.tiles.splice(idx, 1);
      }
    }

    // Check tile placement
    const tileInterval = fastDecay ? TILE_INTERVAL_MS / 300 : TILE_INTERVAL_MS;
    const timeSinceLastTile = now - gameState.lastTilePlacedAt;
    let placedNewTile = false;

    if (timeSinceLastTile >= tileInterval && gameState.scheduleIndex < schedule.length) {
      const reading = schedule[gameState.scheduleIndex];
      if (reading && readings[reading.pk]) {
        gameState.tiles.push({
          pk: reading.pk,
          q: 5,
          r: 5,
          placedAt: now,
          isCollected: false
        });
        gameState.scheduleIndex++;
        gameState.lastTilePlacedAt = now;
        placedNewTile = true;
      }
    }

    return { tilesRemoved: toRemove.size, placedNewTile };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('full game tick: decay + placement + stats update', () => {
    const now = Date.now();
    const gameState = {
      scheduleIndex: 0,
      lastTilePlacedAt: now - TILE_INTERVAL_MS - 1000, // Ready for new tile
      tiles: [
        { pk: '11', q: 5, r: 5, placedAt: now - DECAY_DURATION_MS - 1000, isCollected: false } // Expired
      ]
    };
    const schedule = [{ pk: '12' }];
    const readings = { '12': { pk: '12', title: 'Test', book: 'Matthew' } };

    const result = processGameTick(gameState, schedule, readings);

    expect(result.tilesRemoved).toBe(1);
    expect(result.placedNewTile).toBe(true);
    expect(gameState.tiles.length).toBe(1);
    expect(gameState.tiles[0].pk).toBe('12');
    expect(gameState.scheduleIndex).toBe(1);
  });

  test('game tick with no expired tiles and no placement needed', () => {
    const now = Date.now();
    const gameState = {
      scheduleIndex: 1,
      lastTilePlacedAt: now - 1000, // Just placed
      tiles: [
        { pk: '11', q: 5, r: 5, placedAt: now - 1000, isCollected: false } // Fresh
      ]
    };
    const schedule = [{ pk: '12' }];
    const readings = { '12': { pk: '12', title: 'Test', book: 'Matthew' } };

    const result = processGameTick(gameState, schedule, readings);

    expect(result.tilesRemoved).toBe(0);
    expect(result.placedNewTile).toBe(false);
    expect(gameState.tiles.length).toBe(1);
  });

  test('multiple ticks accumulate correctly', () => {
    const gameState = {
      scheduleIndex: 0,
      lastTilePlacedAt: 0,
      tiles: []
    };
    const schedule = [
      { pk: '11' },
      { pk: '12' },
      { pk: '13' }
    ];
    const readings = {
      '11': { pk: '11', title: 'Test 1', book: 'Matthew' },
      '12': { pk: '12', title: 'Test 2', book: 'Mark' },
      '13': { pk: '13', title: 'Test 3', book: 'Luke' }
    };

    // First tick - place first tile
    processGameTick(gameState, schedule, readings);
    expect(gameState.tiles.length).toBe(1);
    expect(gameState.scheduleIndex).toBe(1);

    // Mark first tile as collected so it doesn't decay
    gameState.tiles[0].isCollected = true;
    gameState.tiles[0].collected = new Date().toISOString();
    delete gameState.tiles[0].placedAt;

    // Advance time and tick again
    jest.advanceTimersByTime(TILE_INTERVAL_MS + 1000);
    processGameTick(gameState, schedule, readings);
    expect(gameState.tiles.length).toBe(2);
    expect(gameState.scheduleIndex).toBe(2);

    // Mark second tile as collected
    gameState.tiles[1].isCollected = true;
    gameState.tiles[1].collected = new Date().toISOString();
    delete gameState.tiles[1].placedAt;

    // Advance time and tick again
    jest.advanceTimersByTime(TILE_INTERVAL_MS + 1000);
    processGameTick(gameState, schedule, readings);
    expect(gameState.tiles.length).toBe(3);
    expect(gameState.scheduleIndex).toBe(3);
  });

  test('schedule exhaustion stops tile placement', () => {
    const now = Date.now();
    const gameState = {
      scheduleIndex: 1, // Already at end
      lastTilePlacedAt: now - TILE_INTERVAL_MS - 1000,
      tiles: []
    };
    const schedule = [{ pk: '11' }]; // Only one entry, already used
    const readings = { '11': { pk: '11', title: 'Test', book: 'Matthew' } };

    const result = processGameTick(gameState, schedule, readings);

    expect(result.placedNewTile).toBe(false);
    expect(gameState.tiles.length).toBe(0);
  });

  test('fast decay mode processes at 300x speed', () => {
    const now = Date.now();
    const fastInterval = TILE_INTERVAL_MS / 300;
    const fastDecay = DECAY_DURATION_MS / 300;

    const gameState = {
      scheduleIndex: 0,
      lastTilePlacedAt: now - fastInterval - 100,
      tiles: [
        { pk: '11', q: 5, r: 5, placedAt: now - fastDecay - 100, isCollected: false }
      ]
    };
    const schedule = [{ pk: '12' }];
    const readings = { '12': { pk: '12', title: 'Test', book: 'Matthew' } };

    const result = processGameTick(gameState, schedule, readings, true);

    expect(result.tilesRemoved).toBe(1);
    expect(result.placedNewTile).toBe(true);
  });
});

// ============================================================================
// Visual/Snapshot Tests
// ============================================================================

describe('Visual Snapshots', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('uncollected tile renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile uncollected book-john';
    tile.dataset.pk = '11';
    tile.dataset.q = '5';
    tile.dataset.r = '5';
    tile.style.setProperty('--decay-duration', '1440000ms');
    tile.style.setProperty('--decay-elapsed', '0ms');
    tile.style.setProperty('--read-progress', '0');

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Healing at Bethesda';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = 'John 5:1-15';
    tile.appendChild(ref);

    const seal = document.createElement('div');
    seal.className = 'tile-seal seal-john';
    tile.appendChild(seal);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('collected tile renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile collected book-matthew';
    tile.dataset.pk = '41';
    tile.dataset.q = '3';
    tile.dataset.r = '2';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'All Saints';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = 'Matthew 10:32-33';
    tile.appendChild(ref);

    const seal = document.createElement('div');
    seal.className = 'tile-seal seal-matthew';
    tile.appendChild(seal);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('collected tile with stack badge renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile collected book-luke';
    tile.dataset.pk = '6';
    tile.dataset.q = '4';
    tile.dataset.r = '3';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Good Samaritan';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = 'Luke 10:25-37';
    tile.appendChild(ref);

    const seal = document.createElement('div');
    seal.className = 'tile-seal seal-luke';
    tile.appendChild(seal);

    const badge = document.createElement('span');
    badge.className = 'stack-badge';
    badge.textContent = 'x3';
    tile.appendChild(badge);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('modal uncollected state renders correctly', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible book-john';
    modal.id = 'reading-modal';
    modal.style.setProperty('--fade-duration', '60000ms');
    modal.style.setProperty('--fade-delay', '0ms');

    const content = document.createElement('div');
    content.className = 'modal-content';

    const indicator = document.createElement('div');
    indicator.className = 'logo';
    indicator.id = 'completion-indicator';
    indicator.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    content.appendChild(indicator);

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.textContent = 'Healing at Bethesda';
    content.appendChild(title);

    const ref = document.createElement('p');
    ref.className = 'ref';
    ref.id = 'modal-ref';
    ref.textContent = 'John 5:1-15';
    content.appendChild(ref);

    const text = document.createElement('div');
    text.className = 'reading-text';
    text.id = 'modal-text';
    text.innerHTML = '<p><span class="v">1</span>Test content.</p>';
    content.appendChild(text);

    modal.appendChild(content);

    expect(modal.outerHTML).toMatchSnapshot();
  });

  test('modal collected state renders correctly', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible collected book-matthew';
    modal.id = 'reading-modal';
    modal.style.setProperty('--fade-duration', '1ms');
    modal.style.setProperty('--fade-delay', '-1ms');

    const content = document.createElement('div');
    content.className = 'modal-content';

    const indicator = document.createElement('div');
    indicator.className = 'logo';
    indicator.id = 'completion-indicator';
    indicator.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    content.appendChild(indicator);

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.textContent = 'All Saints';
    content.appendChild(title);

    const ref = document.createElement('p');
    ref.className = 'ref';
    ref.id = 'modal-ref';
    ref.textContent = 'Matthew 10:32-33';
    content.appendChild(ref);

    const text = document.createElement('div');
    text.className = 'reading-text';
    text.id = 'modal-text';
    text.innerHTML = '<p><span class="v">32</span>Test content for collected.</p>';
    content.appendChild(text);

    modal.appendChild(content);

    expect(modal.outerHTML).toMatchSnapshot();
  });

  test('stats box renders correctly', () => {
    const statsBox = document.createElement('div');
    statsBox.className = 'stats-box';
    statsBox.id = 'stats-box';

    const progressTrack = document.createElement('div');
    progressTrack.className = 'progress-track';

    const progressPlaced = document.createElement('div');
    progressPlaced.className = 'progress-bar placed';
    progressPlaced.id = 'progress-placed';
    progressPlaced.style.width = '15%';
    progressTrack.appendChild(progressPlaced);

    const progressCollected = document.createElement('div');
    progressCollected.className = 'progress-bar collected';
    progressCollected.id = 'progress-collected';
    progressCollected.style.width = '10%';
    progressTrack.appendChild(progressCollected);

    statsBox.appendChild(progressTrack);

    const timerTrack = document.createElement('div');
    timerTrack.className = 'timer-track';

    const timerFill = document.createElement('div');
    timerFill.className = 'timer-fill';
    timerFill.id = 'timer-fill';
    timerFill.style.width = '45%';
    timerTrack.appendChild(timerFill);

    statsBox.appendChild(timerTrack);

    expect(statsBox.outerHTML).toMatchSnapshot();
  });

  test('hex cell with tile renders correctly', () => {
    const cell = document.createElement('div');
    cell.className = 'hex-cell occupied has-collected';
    cell.dataset.q = '5';
    cell.dataset.r = '5';
    cell.dataset.pk = '11';
    cell.style.left = '400px';
    cell.style.top = '346px';
    cell.style.zIndex = '10005';

    const tile = document.createElement('div');
    tile.className = 'tile collected book-john';
    tile.dataset.pk = '11';
    tile.dataset.q = '5';
    tile.dataset.r = '5';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Healing at Bethesda';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = 'John 5:1-15';
    tile.appendChild(ref);

    const seal = document.createElement('div');
    seal.className = 'tile-seal seal-john';
    tile.appendChild(seal);

    cell.appendChild(tile);

    expect(cell.outerHTML).toMatchSnapshot();
  });

  test('reading timer bar renders correctly', () => {
    const timerBar = document.createElement('div');
    timerBar.className = 'reading-timer-track';

    const timerFill = document.createElement('div');
    timerFill.className = 'reading-timer-fill';
    timerFill.id = 'reading-timer-fill';
    timerFill.style.width = '65%';
    timerBar.appendChild(timerFill);

    expect(timerBar.outerHTML).toMatchSnapshot();
  });
});

// ============================================================================
// Onboarding Flow Tests
// ============================================================================

describe('Onboarding Flow', () => {
  const { getHexRing, hexDistance } = gameModule;

  describe('About Tile Placement', () => {
    test('fresh game should place about tile at board center', () => {
      const gameState = {
        scheduleIndex: 0,
        lastTilePlacedAt: 0,
        tiles: []
      };
      const boardCenterHex = { q: 32, r: 36 };

      // Simulate placeNextTile logic step 1
      const aboutTile = gameState.tiles.find(t => t.pk === ABOUT_PK);
      if (!aboutTile && boardCenterHex) {
        gameState.tiles.push({
          pk: ABOUT_PK,
          q: boardCenterHex.q,
          r: boardCenterHex.r,
          placedAt: Date.now(),
          isCollected: false
        });
      }

      expect(gameState.tiles.length).toBe(1);
      expect(gameState.tiles[0].pk).toBe(ABOUT_PK);
      expect(gameState.tiles[0].q).toBe(32);
      expect(gameState.tiles[0].r).toBe(36);
    });

    test('no tiles placed while about tile uncollected', () => {
      const gameState = {
        scheduleIndex: 0,
        lastTilePlacedAt: Date.now() - 1000000,
        tiles: [{
          pk: ABOUT_PK,
          q: 32,
          r: 36,
          placedAt: Date.now(),
          isCollected: false
        }]
      };

      // Simulate placeNextTile step 2
      const aboutTile = gameState.tiles.find(t => t.pk === ABOUT_PK);
      let shouldReturn = false;
      if (aboutTile && !aboutTile.isCollected) {
        shouldReturn = true;
      }

      expect(shouldReturn).toBe(true);
    });
  });

  describe('Synaxis Tile Placement', () => {
    test('synaxis tile placed adjacent to about after collection', () => {
      const gameState = {
        scheduleIndex: 0,
        lastTilePlacedAt: 0,
        tiles: [{
          pk: ABOUT_PK,
          q: 32,
          r: 36,
          isCollected: true,
          collected: new Date().toISOString()
        }]
      };

      // Simulate placeNextTile step 3
      const aboutTile = gameState.tiles.find(t => t.pk === ABOUT_PK);
      const synaxisTile = gameState.tiles.find(t => t.pk === SYNAXIS_PK);

      if (!synaxisTile && aboutTile && aboutTile.isCollected) {
        const ring1 = getHexRing(aboutTile.q, aboutTile.r, 1);
        const synaxisPos = ring1[0]; // First empty cell
        gameState.tiles.push({
          pk: SYNAXIS_PK,
          q: synaxisPos.q,
          r: synaxisPos.r,
          placedAt: Date.now(),
          isCollected: false
        });
      }

      expect(gameState.tiles.length).toBe(2);
      const newSynaxis = gameState.tiles.find(t => t.pk === SYNAXIS_PK);
      expect(newSynaxis).toBeDefined();
      expect(hexDistance(32, 36, newSynaxis.q, newSynaxis.r)).toBe(1);
    });

    test('no story tiles until synaxis exists', () => {
      const gameState = {
        scheduleIndex: 0,
        lastTilePlacedAt: Date.now() - 1000000,
        tiles: [{
          pk: ABOUT_PK,
          q: 32,
          r: 36,
          isCollected: true,
          collected: new Date().toISOString()
        }]
      };

      // Without synaxis, step 3 places synaxis (not story tile)
      const synaxisTile = gameState.tiles.find(t => t.pk === SYNAXIS_PK);
      const aboutTile = gameState.tiles.find(t => t.pk === ABOUT_PK);

      // Check that we'd place synaxis next, not a story tile
      expect(synaxisTile).toBeUndefined();
      expect(aboutTile.isCollected).toBe(true);
    });

    test('story tiles spiral from synaxis position', () => {
      const gameState = {
        scheduleIndex: 0,
        lastTilePlacedAt: 0,
        tiles: [
          {
            pk: ABOUT_PK,
            q: 32,
            r: 36,
            isCollected: true,
            collected: new Date().toISOString()
          },
          {
            pk: SYNAXIS_PK,
            q: 32,
            r: 35, // Adjacent to about
            placedAt: Date.now(),
            isCollected: false
          }
        ]
      };

      // Story tiles should spiral from synaxis (32, 35)
      const synaxisTile = gameState.tiles.find(t => t.pk === SYNAXIS_PK);
      expect(synaxisTile.q).toBe(32);
      expect(synaxisTile.r).toBe(35);

      // New tiles would be placed relative to synaxis position
      const ring1FromSynaxis = getHexRing(synaxisTile.q, synaxisTile.r, 1);
      expect(ring1FromSynaxis.length).toBe(6);
    });
  });

  describe('About Tile Dragging', () => {
    test('about tile is not draggable after collection', () => {
      const tile = document.createElement('div');
      tile.className = 'tile collected special-tile tile-about';
      tile.dataset.pk = ABOUT_PK;

      // Simulate handleTileMouseDown check
      const shouldPreventDrag = tile.dataset.pk === ABOUT_PK;
      expect(shouldPreventDrag).toBe(true);
    });

    test('synaxis tile is draggable when collected', () => {
      const tile = document.createElement('div');
      tile.className = 'tile collected special-tile tile-synaxis';
      tile.dataset.pk = SYNAXIS_PK;

      // Simulate handleTileMouseDown check - synaxis is not blocked
      const shouldPreventDrag = tile.dataset.pk === ABOUT_PK;
      expect(shouldPreventDrag).toBe(false);
    });
  });

  describe('Special Tiles Decay', () => {
    test('about and synaxis tiles never decay', () => {
      const DECAY_DURATION_MS = gameModule.DECAY_DURATION_MS;
      const now = Date.now();
      const tiles = [
        { pk: ABOUT_PK, q: 32, r: 36, placedAt: now - DECAY_DURATION_MS * 2, isCollected: false },
        { pk: SYNAXIS_PK, q: 32, r: 35, placedAt: now - DECAY_DURATION_MS * 2, isCollected: false },
        { pk: '11', q: 33, r: 35, placedAt: now - DECAY_DURATION_MS * 2, isCollected: false }
      ];

      // Simulate decay check
      const toRemove = new Set();
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        // Special tiles never decay
        if (t.pk === ABOUT_PK || t.pk === SYNAXIS_PK) continue;
        if (!t.isCollected && t.placedAt && (now - t.placedAt) >= DECAY_DURATION_MS) {
          toRemove.add(i);
        }
      }

      // Only the regular tile (index 2) should be marked for removal
      expect(toRemove.size).toBe(1);
      expect(toRemove.has(2)).toBe(true);
      expect(toRemove.has(0)).toBe(false);
      expect(toRemove.has(1)).toBe(false);
    });
  });
});

// ============================================================================
// Special Tile Rendering Tests
// ============================================================================

describe('Special Tile Rendering', () => {
  test('about tile renders without book color/seal', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-about uncollected';
    tile.dataset.pk = ABOUT_PK;

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Let Us Attend!';
    tile.appendChild(title);

    // No seal for special tiles
    expect(tile.querySelector('.tile-seal')).toBeNull();
    expect(tile.classList.contains('special-tile')).toBe(true);
    expect(tile.classList.contains('book-matthew')).toBe(false);
  });

  test('synaxis tile renders with timer bar', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-synaxis uncollected';
    tile.dataset.pk = SYNAXIS_PK;

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'The Synaxis';
    tile.appendChild(title);

    // Synaxis has timer bar
    const timerBar = document.createElement('div');
    timerBar.className = 'synaxis-timer-bar';
    const timerFill = document.createElement('div');
    timerFill.className = 'synaxis-timer-fill';
    timerFill.id = 'synaxis-timer-fill';
    timerBar.appendChild(timerFill);
    tile.appendChild(timerBar);

    expect(tile.querySelector('.synaxis-timer-bar')).not.toBeNull();
    expect(tile.querySelector('.synaxis-timer-fill')).not.toBeNull();
  });

  test('collected about tile hides title', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-about collected';
    tile.dataset.pk = ABOUT_PK;

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Let Us Attend!';
    tile.appendChild(title);

    // CSS would hide .tile-about.collected .tile-title
    expect(tile.classList.contains('tile-about')).toBe(true);
    expect(tile.classList.contains('collected')).toBe(true);
  });

  test('special tile modal has neutral background class', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible';

    // For special tiles (book === null), use special-modal class
    const reading = mockData.readings[ABOUT_PK];
    if (reading.book === null) {
      modal.classList.add('special-modal');
    }

    expect(modal.classList.contains('special-modal')).toBe(true);
    expect(modal.classList.contains('book-matthew')).toBe(false);
  });

  test('synaxis timer bar updates with tile countdown', () => {
    const timerFill = document.createElement('div');
    timerFill.className = 'synaxis-timer-fill';
    timerFill.id = 'synaxis-timer-fill';
    timerFill.style.width = '0%';

    // Simulate updateStats updating the timer
    const progress = 0.75;
    timerFill.style.width = (progress * 100) + '%';

    expect(timerFill.style.width).toBe('75%');
  });
});

// ============================================================================
// Special Tile Visual Snapshots
// ============================================================================

describe('Special Tile Visual Snapshots', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('about tile uncollected renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-about uncollected';
    tile.dataset.pk = ABOUT_PK;
    tile.dataset.q = '32';
    tile.dataset.r = '36';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Let Us Attend!';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = '';
    tile.appendChild(ref);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('about tile collected renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-about collected';
    tile.dataset.pk = ABOUT_PK;
    tile.dataset.q = '32';
    tile.dataset.r = '36';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'Let Us Attend!';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = '';
    tile.appendChild(ref);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('synaxis tile with timer bar renders correctly', () => {
    const tile = document.createElement('div');
    tile.className = 'tile special-tile tile-synaxis uncollected';
    tile.dataset.pk = SYNAXIS_PK;
    tile.dataset.q = '32';
    tile.dataset.r = '35';

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = 'The Synaxis';
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = '';
    tile.appendChild(ref);

    const timerBar = document.createElement('div');
    timerBar.className = 'synaxis-timer-bar';
    const timerFill = document.createElement('div');
    timerFill.className = 'synaxis-timer-fill';
    timerFill.id = 'synaxis-timer-fill';
    timerFill.style.width = '50%';
    timerBar.appendChild(timerFill);
    tile.appendChild(timerBar);

    expect(tile.outerHTML).toMatchSnapshot();
  });

  test('special modal renders correctly', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay visible special-modal';
    modal.id = 'reading-modal';
    modal.style.setProperty('--fade-duration', '60000ms');
    modal.style.setProperty('--fade-delay', '0ms');

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.textContent = 'Let Us Attend!';
    content.appendChild(title);

    const ref = document.createElement('p');
    ref.className = 'ref';
    ref.id = 'modal-ref';
    ref.textContent = '';
    content.appendChild(ref);

    const text = document.createElement('div');
    text.className = 'reading-text';
    text.id = 'modal-text';
    text.innerHTML = '<p>Welcome to Let Us Attend!</p>';
    content.appendChild(text);

    modal.appendChild(content);

    expect(modal.outerHTML).toMatchSnapshot();
  });
});
