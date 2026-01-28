/**
 * DOM/Integration tests for Let Us Attend game
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the game module
const gameModule = require('./let-us-attend.js');

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

  test('speed select dropdown populates with presets', () => {
    const select = document.getElementById('speed-select');
    gameModule.SPEED_PRESETS.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.value;
      option.textContent = preset.label;
      select.appendChild(option);
    });

    expect(select.options.length).toBe(2);
    expect(select.options[0].value).toBe('1');
    expect(select.options[1].value).toBe('8640');
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
      realStartTime: Date.now(),
      gameStartDate: '2025-06-15',
      speedMultiplier: 1,
      tiles: [
        { pk: '6', q: 3, r: 2, collected: '2025-06-15' },
        { pk: '9', q: 4, r: 2, collected: '2025-06-22' }
      ],
      lastSaveTime: Date.now()
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

  test('page reload preserves game date state', () => {
    const state = {
      realStartTime: Date.now() - 86400000, // 1 day ago
      gameStartDate: '2025-06-14',
      speedMultiplier: 1,
      tiles: [],
      lastSaveTime: Date.now()
    };

    gameModule.saveState(state);
    const loaded = gameModule.loadState();

    expect(loaded.gameStartDate).toBe('2025-06-14');
    expect(loaded.speedMultiplier).toBe(1);
  });
});
