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
  { label: 'Real-time', value: 1 },
  { label: '10 sec = 1 day', value: 8640 }
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
 * Convert hex grid coordinates (q, r) to pixel coordinates.
 * Uses pointy-top hexagon layout with odd-r offset.
 *
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @param {number} tileSize - Width of hexagon (default 80)
 * @returns {Object} Pixel coordinates {x, y}
 */
function hexToPixel(q, r, tileSize = 80) {
  const w = tileSize;
  const h = w * 1.1547;
  const x = q * w + (r % 2 !== 0 ? w / 2 : 0);
  const y = r * (h * 0.75);
  return { x, y };
}

/**
 * Convert pixel coordinates to hex grid coordinates (q, r).
 * Uses pointy-top hexagon layout with odd-r offset.
 *
 * @param {number} px - Pixel x coordinate
 * @param {number} py - Pixel y coordinate
 * @param {number} tileSize - Width of hexagon (default 80)
 * @returns {Object} Hex coordinates {q, r}
 */
function pixelToHex(px, py, tileSize = 80) {
  const w = tileSize;
  const h = w * 1.1547;
  const rowHeight = h * 0.75;

  // Approximate row
  const r = Math.round(py / rowHeight);

  // Adjust x for odd row offset
  const adjustedX = px - (r % 2 !== 0 ? w / 2 : 0);
  const q = Math.round(adjustedX / w);

  return { q, r };
}

/**
 * Check if a tile can be placed at a given position.
 * Tiles can be placed in empty cells or stacked on same-pk tiles.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {string} pk - Pericope ID of tile to place
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @returns {boolean} True if placement is valid
 */
function canPlaceTile(tiles, pk, q, r) {
  const existing = tiles.filter(t => t.q === q && t.r === r);

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
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @returns {number} Count of tiles at position
 */
function countInstancesAtPosition(tiles, q, r) {
  return tiles.filter(t => t.q === q && t.r === r).length;
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
      t => t.pk === oldest.pk && t.collected === oldest.collected && t.q === oldest.q && t.r === oldest.r
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
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @returns {boolean} True if placement is valid
 */
function isValidPlacement(tiles, pk, q, r) {
  return canPlaceTile(tiles, pk, q, r);
}

/**
 * Find the nearest empty cell by spiraling outward from the origin.
 *
 * @param {Array} tiles - Array of placed tiles
 * @returns {Object} Hex coordinates {q, r} of nearest empty cell
 */
function findNearestEmptyCell(tiles) {
  const occupied = new Set(tiles.map(t => `${t.q},${t.r}`));

  // Spiral outward from origin
  // Check origin first
  if (!occupied.has('0,0')) {
    return { q: 0, r: 0 };
  }

  // Spiral pattern: for each radius, check all cells at that distance
  for (let radius = 1; radius < 100; radius++) {
    // Check cells in a rough spiral/ring pattern
    for (let r = -radius; r <= radius; r++) {
      for (let q = -radius; q <= radius; q++) {
        // Only check cells roughly at this radius
        const dist = Math.max(Math.abs(q), Math.abs(r));
        if (dist !== radius) continue;

        const key = `${q},${r}`;
        if (!occupied.has(key)) {
          return { q, r };
        }
      }
    }
  }

  // Fallback (should never reach)
  return { q: 0, r: 0 };
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
    hexToPixel,
    pixelToHex,
    canPlaceTile,
    countInstancesAtPosition,
    processMissedReadings,
    isValidPlacement,
    findNearestEmptyCell,
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

  // Viewport state for infinite canvas
  let viewportState = {
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    viewportWidth: 0,
    viewportHeight: 0
  };

  // Cache of rendered hex cells: "q,r" -> DOM element
  let cellCache = new Map();

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
   * Get tile size from CSS variable
   */
  function getTileSize() {
    const style = getComputedStyle(document.documentElement);
    return parseInt(style.getPropertyValue('--tile-size')) || 80;
  }

  /**
   * Setup the hex viewport with pan handlers
   */
  function setupViewport() {
    const viewport = elements.hexViewport;
    const canvas = elements.hexCanvas;

    // Get viewport dimensions
    viewportState.viewportWidth = viewport.clientWidth;
    viewportState.viewportHeight = viewport.clientHeight;

    // Center the canvas initially so (0,0) is in the middle
    viewportState.panX = viewportState.viewportWidth / 2;
    viewportState.panY = viewportState.viewportHeight / 2;

    // Mouse pan handlers
    viewport.addEventListener('mousedown', handlePanStart);
    viewport.addEventListener('mousemove', handlePanMove);
    viewport.addEventListener('mouseup', handlePanEnd);
    viewport.addEventListener('mouseleave', handlePanEnd);

    // Touch pan handlers
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    // Handle resize
    window.addEventListener('resize', () => {
      viewportState.viewportWidth = viewport.clientWidth;
      viewportState.viewportHeight = viewport.clientHeight;
      renderVisibleHexes();
    });

    // Initial render
    renderVisibleHexes();
  }

  /**
   * Handle pan start (mousedown)
   */
  function handlePanStart(e) {
    // Only pan with left mouse button and not on a tile
    if (e.button !== 0) return;
    if (e.target.closest('.tile')) return;

    viewportState.isDragging = true;
    viewportState.lastMouseX = e.clientX;
    viewportState.lastMouseY = e.clientY;
    elements.hexViewport.classList.add('dragging');
  }

  /**
   * Handle pan move (mousemove)
   */
  function handlePanMove(e) {
    if (!viewportState.isDragging) return;

    const dx = e.clientX - viewportState.lastMouseX;
    const dy = e.clientY - viewportState.lastMouseY;

    viewportState.panX += dx;
    viewportState.panY += dy;

    viewportState.lastMouseX = e.clientX;
    viewportState.lastMouseY = e.clientY;

    renderVisibleHexes();
  }

  /**
   * Handle pan end (mouseup/mouseleave)
   */
  function handlePanEnd() {
    viewportState.isDragging = false;
    elements.hexViewport.classList.remove('dragging');
  }

  /**
   * Handle touch start
   */
  function handleTouchStart(e) {
    if (e.target.closest('.tile')) return;
    if (e.touches.length !== 1) return;

    viewportState.isDragging = true;
    viewportState.lastMouseX = e.touches[0].clientX;
    viewportState.lastMouseY = e.touches[0].clientY;
    elements.hexViewport.classList.add('dragging');
  }

  /**
   * Handle touch move
   */
  function handleTouchMove(e) {
    if (!viewportState.isDragging) return;
    if (e.touches.length !== 1) return;

    e.preventDefault();

    const dx = e.touches[0].clientX - viewportState.lastMouseX;
    const dy = e.touches[0].clientY - viewportState.lastMouseY;

    viewportState.panX += dx;
    viewportState.panY += dy;

    viewportState.lastMouseX = e.touches[0].clientX;
    viewportState.lastMouseY = e.touches[0].clientY;

    renderVisibleHexes();
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd() {
    viewportState.isDragging = false;
    elements.hexViewport.classList.remove('dragging');
  }

  /**
   * Render visible hexes based on viewport and pan position
   */
  function renderVisibleHexes() {
    const tileSize = getTileSize();
    const hexHeight = tileSize * 1.1547;
    const rowHeight = hexHeight * 0.75;

    // Calculate visible range with padding
    const padding = 2; // Extra cells around visible area
    const minQ = Math.floor((-viewportState.panX - tileSize) / tileSize) - padding;
    const maxQ = Math.ceil((viewportState.viewportWidth - viewportState.panX + tileSize) / tileSize) + padding;
    const minR = Math.floor((-viewportState.panY - hexHeight) / rowHeight) - padding;
    const maxR = Math.ceil((viewportState.viewportHeight - viewportState.panY + hexHeight) / rowHeight) + padding;

    // Track which cells should exist
    const visibleKeys = new Set();

    // Create or update visible cells
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const key = `${q},${r}`;
        visibleKeys.add(key);

        let cell = cellCache.get(key);

        if (!cell) {
          // Create new cell
          cell = document.createElement('div');
          cell.className = 'hex-cell';
          cell.dataset.q = q;
          cell.dataset.r = r;

          // Drag and drop handlers
          cell.addEventListener('dragover', handleDragOver);
          cell.addEventListener('dragleave', handleDragLeave);
          cell.addEventListener('drop', handleDrop);

          elements.hexCanvas.appendChild(cell);
          cellCache.set(key, cell);
        }

        // Update position
        const pos = hexToPixel(q, r, tileSize);
        cell.style.left = (pos.x + viewportState.panX) + 'px';
        cell.style.top = (pos.y + viewportState.panY) + 'px';
      }
    }

    // Remove cells that are no longer visible
    for (const [key, cell] of cellCache) {
      if (!visibleKeys.has(key)) {
        cell.remove();
        cellCache.delete(key);
      }
    }

    // Update canvas transform
    elements.hexCanvas.style.transform = `translate(0, 0)`;

    // Render placed tiles
    renderPlacedTiles();
  }

  /**
   * Render placed tiles on the grid
   */
  function renderPlacedTiles() {
    if (!gameState) return;

    // Group tiles by position
    const tilesByPosition = {};
    for (const tile of gameState.tiles) {
      const key = `${tile.q},${tile.r}`;
      if (!tilesByPosition[key]) {
        tilesByPosition[key] = [];
      }
      tilesByPosition[key].push(tile);
    }

    // Clear all cells first
    for (const cell of cellCache.values()) {
      cell.innerHTML = '';
      cell.classList.remove('occupied');
      delete cell.dataset.pk;
    }

    // Render tiles
    for (const [key, tiles] of Object.entries(tilesByPosition)) {
      const cell = cellCache.get(key);
      if (!cell) continue;

      const [q, r] = key.split(',').map(Number);
      const latestTile = tiles[tiles.length - 1];
      const tileEl = createTileElement(latestTile.pk, false);
      if (!tileEl) continue;

      tileEl.classList.add('collected');
      tileEl.draggable = true;
      tileEl.dataset.q = q;
      tileEl.dataset.r = r;

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

    // Find nearest empty cell spiraling from origin
    const { q, r } = findNearestEmptyCell(gameState.tiles);

    const gameDate = getCurrentGameDate(
      gameState.realStartTime,
      gameState.gameStartDate,
      gameState.speedMultiplier
    );

    // Add tile to state
    gameState.tiles.push({
      pk: pk,
      q: q,
      r: r,
      collected: gameDate
    });

    // Clear current available
    currentAvailablePk = null;

    // Save and re-render
    saveState(gameState);
    renderStagingArea();
    renderVisibleHexes();
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
    for (const cell of cellCache.values()) {
      cell.classList.remove('drop-target', 'drop-invalid');
    }
  }

  /**
   * Drag over handler
   */
  function handleDragOver(e) {
    e.preventDefault();
    if (!draggedTile) return;

    const cell = e.target.closest('.hex-cell');
    if (!cell) return;

    const q = parseInt(cell.dataset.q);
    const r = parseInt(cell.dataset.r);
    const pk = draggedTile.dataset.pk;

    const valid = isValidPlacement(gameState.tiles, pk, q, r) ||
                  (cell.dataset.q === draggedTile.dataset.q && cell.dataset.r === draggedTile.dataset.r);

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

    const newQ = parseInt(cell.dataset.q);
    const newR = parseInt(cell.dataset.r);
    const oldQ = parseInt(draggedTile.dataset.q);
    const oldR = parseInt(draggedTile.dataset.r);
    const pk = draggedTile.dataset.pk;

    // Same position - no change
    if (newQ === oldQ && newR === oldR) {
      cell.classList.remove('drop-target', 'drop-invalid');
      return;
    }

    // Check if valid
    if (!isValidPlacement(gameState.tiles, pk, newQ, newR)) {
      cell.classList.remove('drop-target', 'drop-invalid');
      return;
    }

    // Move all tiles at old position to new position
    for (const tile of gameState.tiles) {
      if (tile.q === oldQ && tile.r === oldR && tile.pk === pk) {
        tile.q = newQ;
        tile.r = newR;
      }
    }

    // Save and re-render
    saveState(gameState);
    renderVisibleHexes();

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
      hexViewport: document.getElementById('hex-viewport'),
      hexCanvas: document.getElementById('hex-canvas'),
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
    setupViewport();
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
