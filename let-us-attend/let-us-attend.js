/**
 * Let Us Attend - An incremental game for collecting Gospel readings
 *
 * Core game logic for time system, tile management, and persistence.
 */

// Tile states
const TileState = {
  PENDING: 'pending',
  AVAILABLE: 'available',
  COLLECTED: 'collected'
};

// Speed presets
const SPEED_PRESETS = [
  { label: '1x (Real-time)', value: 1 },
  { label: '10x', value: 10 },
  { label: '60x (1 min = 1 hr)', value: 60 },
  { label: '1440x (1 min = 1 day)', value: 1440 },
  { label: '86400x (1 sec = 1 day)', value: 86400 }
];

const STORAGE_KEY = 'let-us-attend';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate the current game date based on real time elapsed and speed multiplier.
 *
 * @param {number} realStartTime - Timestamp when game started/resumed
 * @param {string} gameStartDate - Game date when started/resumed (YYYY-MM-DD)
 * @param {number} speedMultiplier - Speed multiplier (1 = real-time)
 * @param {number} now - Current timestamp (for testing)
 * @returns {string} Current game date as YYYY-MM-DD
 */
function getCurrentGameDate(realStartTime, gameStartDate, speedMultiplier, now = Date.now()) {
  const realElapsed = now - realStartTime;
  const gameElapsed = realElapsed * speedMultiplier;
  const daysElapsed = Math.floor(gameElapsed / MS_PER_DAY);

  const startDate = new Date(gameStartDate + 'T00:00:00Z');
  const currentDate = new Date(startDate.getTime() + daysElapsed * MS_PER_DAY);

  return currentDate.toISOString().split('T')[0];
}

/**
 * Get the current reading based on schedule and game date.
 * Returns the most recent scheduled reading on or before the given date.
 *
 * @param {Array} schedule - Array of {date, pk} objects sorted by date
 * @param {string} gameDate - Current game date (YYYY-MM-DD)
 * @returns {Object|null} The current reading {date, pk} or null
 */
function getCurrentReading(schedule, gameDate) {
  let current = null;

  for (const entry of schedule) {
    if (entry.date <= gameDate) {
      current = entry;
    } else {
      break;
    }
  }

  return current;
}

/**
 * Get the next upcoming reading after the given date.
 *
 * @param {Array} schedule - Array of {date, pk} objects sorted by date
 * @param {string} gameDate - Current game date (YYYY-MM-DD)
 * @returns {Object|null} The next reading {date, pk} or null
 */
function getNextReading(schedule, gameDate) {
  for (const entry of schedule) {
    if (entry.date > gameDate) {
      return entry;
    }
  }
  return null;
}

/**
 * Check if a tile can be placed at a given position.
 * Tiles can be placed in empty cells or stacked on same-pk tiles.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {string} pk - Pericope ID of tile to place
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if placement is valid
 */
function canPlaceTile(tiles, pk, x, y) {
  const existing = tiles.filter(t => t.x === x && t.y === y);

  if (existing.length === 0) {
    return true;
  }

  // Can stack on same pk
  return existing.every(t => t.pk === pk);
}

/**
 * Count tile instances at a position.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Count of tiles at position
 */
function countInstancesAtPosition(tiles, x, y) {
  return tiles.filter(t => t.x === x && t.y === y).length;
}

/**
 * Process missed readings by removing oldest instance of each missed pk.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {Array} missedPks - Array of pericope IDs that were missed
 * @returns {Array} Updated tiles array with oldest instances removed
 */
function processMissedReadings(tiles, missedPks) {
  let result = [...tiles];

  for (const pk of missedPks) {
    const instances = result.filter(t => t.pk === pk);
    if (instances.length === 0) continue;

    // Find oldest by collected date
    instances.sort((a, b) => a.collected.localeCompare(b.collected));
    const oldest = instances[0];

    // Remove oldest instance
    const idx = result.findIndex(
      t => t.pk === oldest.pk && t.collected === oldest.collected && t.x === oldest.x && t.y === oldest.y
    );
    if (idx !== -1) {
      result.splice(idx, 1);
    }
  }

  return result;
}

/**
 * Check if placement is valid (considering stacking and reserved areas).
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {string} pk - Pericope ID of tile to place
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if placement is valid
 */
function isValidPlacement(tiles, pk, x, y) {
  // Center staging area is reserved (0, 0)
  if (x === 0 && y === 0) {
    return false;
  }

  return canPlaceTile(tiles, pk, x, y);
}

/**
 * Save game state to localStorage.
 *
 * @param {Object} state - Game state to save
 */
function saveState(state) {
  if (typeof localStorage === 'undefined') return;

  const toSave = {
    realStartTime: state.realStartTime,
    gameStartDate: state.gameStartDate,
    speedMultiplier: state.speedMultiplier,
    tiles: state.tiles,
    lastSaveTime: Date.now()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

/**
 * Load game state from localStorage.
 *
 * @returns {Object|null} Loaded state or null if not found/corrupted
 */
function loadState() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

/**
 * Create initial game state.
 *
 * @returns {Object} Fresh game state
 */
function createInitialState() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  return {
    realStartTime: now,
    gameStartDate: today,
    speedMultiplier: 1,
    tiles: [],
    lastSaveTime: now
  };
}

/**
 * Get readings that were missed between two schedule positions.
 *
 * @param {Array} schedule - Full schedule
 * @param {number} lastIndex - Index of last processed reading
 * @param {number} currentIndex - Index of current reading
 * @param {Array} collectedPks - PKs already collected (to exclude from missed)
 * @returns {Array} PKs of readings that were missed
 */
function getMissedReadings(schedule, lastIndex, currentIndex, collectedPks) {
  const missed = [];
  const collectedSet = new Set(collectedPks);

  for (let i = lastIndex + 1; i < currentIndex; i++) {
    const pk = schedule[i].pk;
    // Only count as missed if not already collected
    if (!collectedSet.has(pk)) {
      missed.push(pk);
    }
  }

  return missed;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TileState,
    SPEED_PRESETS,
    getCurrentGameDate,
    getCurrentReading,
    getNextReading,
    canPlaceTile,
    countInstancesAtPosition,
    processMissedReadings,
    isValidPlacement,
    saveState,
    loadState,
    createInitialState,
    getMissedReadings
  };
}

// ============================================================================
// UI Code (Browser only)
// ============================================================================

if (typeof window !== 'undefined') {
  // Game state
  let gameState = null;
  let gameData = null;
  let currentAvailablePk = null;
  let lastScheduleIndex = -1;
  let updateInterval = null;
  let draggedTile = null;

  // DOM elements
  let elements = {};

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Format short date
   */
  function formatShortDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Create a tile element
   */
  function createTileElement(pk, isAvailable = false) {
    const reading = gameData.readings[pk];
    if (!reading) return null;

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.pk = pk;
    tile.classList.add('book-' + reading.book.toLowerCase());

    if (isAvailable) {
      tile.classList.add('available');
    }

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = reading.title;
    tile.appendChild(title);

    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = reading.book;
    tile.appendChild(ref);

    return tile;
  }

  /**
   * Render the staging area
   */
  function renderStagingArea() {
    const stagingArea = elements.stagingArea;
    const emptyState = elements.emptyState;

    // Clear existing tile
    const existingTile = stagingArea.querySelector('.tile');
    if (existingTile) existingTile.remove();

    if (currentAvailablePk) {
      const tile = createTileElement(currentAvailablePk, true);
      if (tile) {
        tile.addEventListener('click', () => openReadingModal(currentAvailablePk));
        stagingArea.appendChild(tile);
        stagingArea.classList.add('has-tile');
        emptyState.classList.add('hidden');
      }
    } else {
      stagingArea.classList.remove('has-tile');
      emptyState.classList.remove('hidden');
    }
  }

  /**
   * Build hex grid structure
   */
  function buildHexGrid() {
    const grid = elements.hexGrid;
    grid.innerHTML = '';

    const rows = 7;
    const cols = 9;

    for (let y = 0; y < rows; y++) {
      const row = document.createElement('div');
      row.className = 'hex-row';

      const colsInRow = y % 2 === 0 ? cols : cols - 1;

      for (let x = 0; x < colsInRow; x++) {
        const cell = document.createElement('div');
        cell.className = 'hex-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        // Drag and drop handlers
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', handleDragLeave);
        cell.addEventListener('drop', handleDrop);

        row.appendChild(cell);
      }

      grid.appendChild(row);
    }
  }

  /**
   * Render placed tiles on the grid
   */
  function renderPlacedTiles() {
    // Group tiles by position
    const tilesByPosition = {};
    for (const tile of gameState.tiles) {
      const key = `${tile.x},${tile.y}`;
      if (!tilesByPosition[key]) {
        tilesByPosition[key] = [];
      }
      tilesByPosition[key].push(tile);
    }

    // Clear all cells first
    const cells = elements.hexGrid.querySelectorAll('.hex-cell');
    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.classList.remove('occupied');
      delete cell.dataset.pk;
    });

    // Render tiles
    for (const [key, tiles] of Object.entries(tilesByPosition)) {
      const [x, y] = key.split(',').map(Number);
      const cell = elements.hexGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (!cell) continue;

      const latestTile = tiles[tiles.length - 1];
      const tileEl = createTileElement(latestTile.pk, false);
      if (!tileEl) continue;

      tileEl.classList.add('collected');
      tileEl.draggable = true;
      tileEl.dataset.x = x;
      tileEl.dataset.y = y;

      // Stack badge
      if (tiles.length > 1) {
        const badge = document.createElement('span');
        badge.className = 'stack-badge';
        badge.textContent = 'x' + tiles.length;
        tileEl.appendChild(badge);
      }

      // Drag handlers
      tileEl.addEventListener('dragstart', handleDragStart);
      tileEl.addEventListener('dragend', handleDragEnd);

      // Click to view reading
      tileEl.addEventListener('click', (e) => {
        if (!e.target.closest('.tile').classList.contains('dragging')) {
          openReadingModal(latestTile.pk, true);
        }
      });

      cell.appendChild(tileEl);
      cell.classList.add('occupied');
      cell.dataset.pk = latestTile.pk;
    }
  }

  /**
   * Update stats display
   */
  function updateStats() {
    const gameDate = getCurrentGameDate(
      gameState.realStartTime,
      gameState.gameStartDate,
      gameState.speedMultiplier
    );

    const currentReading = getCurrentReading(gameData.schedule, gameDate);
    const nextReading = getNextReading(gameData.schedule, gameDate);

    // Collected count (unique pks)
    const uniquePks = new Set(gameState.tiles.map(t => t.pk));
    elements.collectedCount.textContent = uniquePks.size;
    elements.totalCount.textContent = Object.keys(gameData.readings).length;

    // Current date
    elements.currentDate.textContent = formatDate(gameDate);

    // Next reading date
    if (nextReading) {
      elements.nextDate.textContent = formatShortDate(nextReading.date);
    } else {
      elements.nextDate.textContent = '-';
    }

    // Current reading name
    if (currentReading && gameData.readings[currentReading.pk]) {
      elements.currentReading.textContent = gameData.readings[currentReading.pk].title;
    } else {
      elements.currentReading.textContent = '-';
    }
  }

  /**
   * Open reading modal
   */
  function openReadingModal(pk, viewOnly = false) {
    const reading = gameData.readings[pk];
    if (!reading) return;

    elements.modalTitle.textContent = reading.title;
    elements.modalRef.textContent = reading.ref;
    elements.modalText.innerHTML = reading.content;

    if (viewOnly) {
      elements.markReadBtn.classList.add('hidden');
    } else {
      elements.markReadBtn.classList.remove('hidden');
      elements.markReadBtn.onclick = () => collectReading(pk);
    }

    elements.modal.classList.add('visible');
  }

  /**
   * Close reading modal
   */
  function closeModal() {
    elements.modal.classList.remove('visible');
  }

  /**
   * Collect reading (mark as read)
   */
  function collectReading(pk) {
    closeModal();

    // Find empty cell
    const cells = elements.hexGrid.querySelectorAll('.hex-cell:not(.occupied)');
    if (cells.length === 0) return;

    const cell = cells[0];
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);

    const gameDate = getCurrentGameDate(
      gameState.realStartTime,
      gameState.gameStartDate,
      gameState.speedMultiplier
    );

    // Add tile to state
    gameState.tiles.push({
      pk: pk,
      x: x,
      y: y,
      collected: gameDate
    });

    // Clear current available
    currentAvailablePk = null;

    // Save and re-render
    saveState(gameState);
    renderStagingArea();
    renderPlacedTiles();
    updateStats();
  }

  /**
   * Drag start handler
   */
  function handleDragStart(e) {
    draggedTile = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  /**
   * Drag end handler
   */
  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTile = null;

    // Clear all drop indicators
    const cells = elements.hexGrid.querySelectorAll('.hex-cell');
    cells.forEach(cell => {
      cell.classList.remove('drop-target', 'drop-invalid');
    });
  }

  /**
   * Drag over handler
   */
  function handleDragOver(e) {
    e.preventDefault();
    if (!draggedTile) return;

    const cell = e.target.closest('.hex-cell');
    if (!cell) return;

    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const pk = draggedTile.dataset.pk;

    const valid = isValidPlacement(gameState.tiles, pk, x, y) ||
                  (cell.dataset.x === draggedTile.dataset.x && cell.dataset.y === draggedTile.dataset.y);

    cell.classList.remove('drop-target', 'drop-invalid');
    cell.classList.add(valid ? 'drop-target' : 'drop-invalid');
  }

  /**
   * Drag leave handler
   */
  function handleDragLeave(e) {
    const cell = e.target.closest('.hex-cell');
    if (cell) {
      cell.classList.remove('drop-target', 'drop-invalid');
    }
  }

  /**
   * Drop handler
   */
  function handleDrop(e) {
    e.preventDefault();
    if (!draggedTile) return;

    const cell = e.target.closest('.hex-cell');
    if (!cell) return;

    const newX = parseInt(cell.dataset.x);
    const newY = parseInt(cell.dataset.y);
    const oldX = parseInt(draggedTile.dataset.x);
    const oldY = parseInt(draggedTile.dataset.y);
    const pk = draggedTile.dataset.pk;

    // Same position - no change
    if (newX === oldX && newY === oldY) {
      cell.classList.remove('drop-target', 'drop-invalid');
      return;
    }

    // Check if valid
    if (!isValidPlacement(gameState.tiles, pk, newX, newY)) {
      cell.classList.remove('drop-target', 'drop-invalid');
      return;
    }

    // Move all tiles at old position to new position
    for (const tile of gameState.tiles) {
      if (tile.x === oldX && tile.y === oldY && tile.pk === pk) {
        tile.x = newX;
        tile.y = newY;
      }
    }

    // Save and re-render
    saveState(gameState);
    renderPlacedTiles();

    cell.classList.remove('drop-target', 'drop-invalid');
  }

  /**
   * Update game state based on current time
   */
  function updateGame() {
    const gameDate = getCurrentGameDate(
      gameState.realStartTime,
      gameState.gameStartDate,
      gameState.speedMultiplier
    );

    const currentReading = getCurrentReading(gameData.schedule, gameDate);

    if (currentReading) {
      // Find schedule index
      const currentIndex = gameData.schedule.findIndex(
        s => s.date === currentReading.date && s.pk === currentReading.pk
      );

      // Check if reading changed
      if (currentIndex !== lastScheduleIndex) {
        // Process missed readings if we jumped ahead
        if (lastScheduleIndex >= 0 && currentIndex > lastScheduleIndex + 1) {
          const collectedPks = gameState.tiles.map(t => t.pk);
          const missed = getMissedReadings(gameData.schedule, lastScheduleIndex, currentIndex, collectedPks);

          if (missed.length > 0) {
            gameState.tiles = processMissedReadings(gameState.tiles, missed);
            saveState(gameState);
            renderPlacedTiles();
          }
        }

        // Update current available
        const alreadyCollected = gameState.tiles.some(t => t.pk === currentReading.pk);
        if (!alreadyCollected) {
          currentAvailablePk = currentReading.pk;
        } else {
          // Already collected - make a new instance available
          currentAvailablePk = currentReading.pk;
        }

        lastScheduleIndex = currentIndex;
        renderStagingArea();
      }
    }

    updateStats();
  }

  /**
   * Handle speed change
   */
  function handleSpeedChange(e) {
    const newSpeed = parseInt(e.target.value);

    // Calculate current game date before changing speed
    const currentGameDate = getCurrentGameDate(
      gameState.realStartTime,
      gameState.gameStartDate,
      gameState.speedMultiplier
    );

    // Reset timing with new speed
    gameState.realStartTime = Date.now();
    gameState.gameStartDate = currentGameDate;
    gameState.speedMultiplier = newSpeed;

    saveState(gameState);
    updateGame();
  }

  /**
   * Initialize speed select
   */
  function initSpeedSelect() {
    const select = elements.speedSelect;
    select.innerHTML = '';

    for (const preset of SPEED_PRESETS) {
      const option = document.createElement('option');
      option.value = preset.value;
      option.textContent = preset.label;
      if (preset.value === gameState.speedMultiplier) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener('change', handleSpeedChange);
  }

  /**
   * Load game data from JSON
   */
  async function loadGameData() {
    try {
      const response = await fetch('let-us-attend.json');
      gameData = await response.json();
      return true;
    } catch (e) {
      console.error('Failed to load game data:', e);
      return false;
    }
  }

  /**
   * Initialize the game
   */
  async function initGame() {
    // Cache DOM elements
    elements = {
      stagingArea: document.getElementById('staging-area'),
      emptyState: document.getElementById('empty-state'),
      hexGrid: document.getElementById('hex-grid'),
      collectedCount: document.getElementById('collected-count'),
      totalCount: document.getElementById('total-count'),
      currentDate: document.getElementById('current-date'),
      nextDate: document.getElementById('next-date'),
      currentReading: document.getElementById('current-reading'),
      speedSelect: document.getElementById('speed-select'),
      modal: document.getElementById('reading-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalRef: document.getElementById('modal-ref'),
      modalText: document.getElementById('modal-text'),
      markReadBtn: document.getElementById('mark-read-btn'),
      closeModalBtn: document.getElementById('close-modal-btn')
    };

    // Load game data
    const loaded = await loadGameData();
    if (!loaded) {
      elements.emptyState.innerHTML = '<p>Failed to load game data</p>';
      return;
    }

    // Load or create game state
    gameState = loadState();
    if (!gameState) {
      gameState = createInitialState();
      saveState(gameState);
    } else {
      // Resume: update realStartTime to now, keep gameStartDate
      const savedGameDate = getCurrentGameDate(
        gameState.realStartTime,
        gameState.gameStartDate,
        gameState.speedMultiplier,
        gameState.lastSaveTime
      );
      gameState.realStartTime = Date.now();
      gameState.gameStartDate = savedGameDate;
      saveState(gameState);
    }

    // Initialize UI
    initSpeedSelect();
    buildHexGrid();
    renderPlacedTiles();
    updateGame();

    // Modal close handlers
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });

    // Start update loop
    updateInterval = setInterval(updateGame, 1000);

    // Save periodically
    setInterval(() => saveState(gameState), 30000);
  }

  // Expose initGame globally
  window.initGame = initGame;
}
