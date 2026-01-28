/**
 * Let Us Attend - An incremental game for collecting Gospel readings
 *
 * Core game logic for time system, tile management, and persistence.
 */

// Fixed timing constants
const TILE_INTERVAL_MS = 120 * 1000;  // 120 seconds between tile placements
const DECAY_DURATION_MS = 1440 * 1000; // 1440 seconds (24 minutes) decay per tile

const STORAGE_KEY = 'let-us-attend';

/**
 * Get the fixed decay duration in milliseconds.
 *
 * @returns {number} Decay duration in milliseconds
 */
function getDecayDurationMs() {
  return DECAY_DURATION_MS;
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
 * Calculate hex distance between two cells using cube coordinates.
 * Converts odd-r offset coordinates to cube coordinates for accurate distance.
 *
 * @param {number} q1 - Column of first cell
 * @param {number} r1 - Row of first cell
 * @param {number} q2 - Column of second cell
 * @param {number} r2 - Row of second cell
 * @returns {number} Hex distance between the two cells
 */
function hexDistance(q1, r1, q2, r2) {
  // Convert odd-r offset to cube coordinates
  const x1 = q1 - (r1 - (r1 & 1)) / 2;
  const z1 = r1;
  const y1 = -x1 - z1;

  const x2 = q2 - (r2 - (r2 & 1)) / 2;
  const z2 = r2;
  const y2 = -x2 - z2;

  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}

/**
 * Generate cells in a hex ring at given radius, in circular order.
 * Uses cube coordinates internally for proper ring traversal.
 *
 * @param {number} centerQ - Center column
 * @param {number} centerR - Center row
 * @param {number} radius - Ring radius (0 returns just center)
 * @returns {Array} Array of {q, r} coordinates in ring order
 */
function getHexRing(centerQ, centerR, radius) {
  if (radius === 0) {
    return [{ q: centerQ, r: centerR }];
  }

  // Convert center to cube coordinates
  const cx = centerQ - (centerR - (centerR & 1)) / 2;
  const cz = centerR;

  // Cube direction vectors (pointy-top, clockwise from E)
  const cubeDirs = [
    [+1, -1, 0],  // 0: E
    [0, -1, +1],  // 1: SE
    [-1, 0, +1],  // 2: SW
    [-1, +1, 0],  // 3: W
    [0, +1, -1],  // 4: NW
    [+1, 0, -1],  // 5: NE
  ];

  const results = [];

  // Start at center + radius * direction[5] (NE corner)
  let x = cx + radius * cubeDirs[5][0];
  let z = cz + radius * cubeDirs[5][2];

  // Walk around the ring: 6 sides, radius steps each, starting from SE direction
  for (let i = 0; i < 6; i++) {
    const side = (i + 1) % 6; // Start at direction 1 (SE) instead of 0 (E)
    for (let step = 0; step < radius; step++) {
      // Convert cube to odd-r offset
      const q = x + (z - (z & 1)) / 2;
      const r = z;
      results.push({ q, r });

      // Move in direction[side]
      x += cubeDirs[side][0];
      z += cubeDirs[side][2];
    }
  }

  // Rotate results so each ring starts at NE of where previous ring ended
  // This creates a continuous spiral effect
  // Ring r should start at position (5r + 1) % (6r)
  if (radius > 1) {
    const startIndex = (5 * radius + 1) % (6 * radius);
    return [...results.slice(startIndex), ...results.slice(0, startIndex)];
  }

  return results;
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
 * Find the nearest empty cell from viewport center.
 * For uncollected tiles, only finds truly empty cells (no stacking).
 * Uses true hex rings for concentric placement.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {Object} viewportState - Viewport state with panX, panY, viewportWidth, viewportHeight
 * @param {number} tileSize - Width of hexagon
 * @returns {Object} Hex coordinates {q, r} of nearest empty cell
 */
function findNearestEmptyCellFromViewportCenter(tiles, viewportState, tileSize) {
  // Calculate viewport center in canvas coordinates (account for zoom)
  const zoom = viewportState.zoom || 1;
  const centerX = (viewportState.viewportWidth / 2 - viewportState.panX) / zoom;
  const centerY = (viewportState.viewportHeight / 2 - viewportState.panY) / zoom;

  // Convert to hex coordinates
  const centerHex = pixelToHex(centerX, centerY, tileSize);

  // Build set of all occupied cells (uncollected tiles can't stack)
  const occupied = new Set(tiles.map(t => `${t.q},${t.r}`));

  // Check center first
  if (!occupied.has(`${centerHex.q},${centerHex.r}`)) {
    return { q: centerHex.q, r: centerHex.r };
  }

  // Search by true hex rings in circular order
  for (let radius = 1; radius < 100; radius++) {
    const ring = getHexRing(centerHex.q, centerHex.r, radius);
    for (const cell of ring) {
      const key = `${cell.q},${cell.r}`;
      if (!occupied.has(key)) {
        return cell;
      }
    }
  }

  // Fallback
  return { q: centerHex.q, r: centerHex.r };
}

/**
 * Save game state to localStorage.
 *
 * @param {Object} state - Game state to save
 */
function saveState(state) {
  if (typeof localStorage === 'undefined') return;

  const toSave = {
    scheduleIndex: state.scheduleIndex,
    lastTilePlacedAt: state.lastTilePlacedAt,
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
  return {
    scheduleIndex: 0,
    lastTilePlacedAt: 0, // Will place first tile immediately
    tiles: []
  };
}

/**
 * Calculate constrained pan values to keep at least one tile visible.
 * Only considers tiles visible in the perpendicular axis.
 *
 * @param {Array} tiles - Array of {q, r} tile positions
 * @param {Object} viewportState - {panX, panY, zoom, viewportWidth, viewportHeight}
 * @param {number} tileSize - Base tile size in pixels
 * @returns {Object} Constrained {panX, panY}
 */
function calculateConstrainedPan(tiles, viewportState, tileSize) {
  if (!tiles || tiles.length === 0) {
    return { panX: viewportState.panX, panY: viewportState.panY };
  }

  const hexHeight = tileSize * 1.1547;
  const zoom = viewportState.zoom || 1;
  const margin = tileSize * zoom * 0.5;

  let panX = viewportState.panX;
  let panY = viewportState.panY;

  // Get tile positions in canvas coordinates
  const tilePositions = tiles.map(tile => {
    const pos = hexToPixel(tile.q, tile.r, tileSize);
    return {
      left: pos.x,
      right: pos.x + tileSize,
      top: pos.y,
      bottom: pos.y + hexHeight
    };
  });

  // Find tiles that are vertically visible (for horizontal constraint)
  const verticallyVisible = tilePositions.filter(t => {
    const screenTop = panY + t.top * zoom;
    const screenBottom = panY + t.bottom * zoom;
    return screenBottom > 0 && screenTop < viewportState.viewportHeight;
  });

  // Find tiles that are horizontally visible (for vertical constraint)
  const horizontallyVisible = tilePositions.filter(t => {
    const screenLeft = panX + t.left * zoom;
    const screenRight = panX + t.right * zoom;
    return screenRight > 0 && screenLeft < viewportState.viewportWidth;
  });

  // Horizontal constraint: based on vertically-visible tiles
  if (verticallyVisible.length > 0) {
    const minX = Math.min(...verticallyVisible.map(t => t.left));
    const maxX = Math.max(...verticallyVisible.map(t => t.right));
    const minPanX = margin - maxX * zoom;
    const maxPanX = viewportState.viewportWidth - margin - minX * zoom;
    panX = Math.max(minPanX, Math.min(maxPanX, panX));
  }

  // Vertical constraint: based on horizontally-visible tiles
  if (horizontallyVisible.length > 0) {
    const minY = Math.min(...horizontallyVisible.map(t => t.top));
    const maxY = Math.max(...horizontallyVisible.map(t => t.bottom));
    const minPanY = margin - maxY * zoom;
    const maxPanY = viewportState.viewportHeight - margin - minY * zoom;
    panY = Math.max(minPanY, Math.min(maxPanY, panY));
  }

  return { panX, panY };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TILE_INTERVAL_MS,
    DECAY_DURATION_MS,
    getDecayDurationMs,
    hexToPixel,
    pixelToHex,
    hexDistance,
    getHexRing,
    canPlaceTile,
    isValidPlacement,
    findNearestEmptyCellFromViewportCenter,
    calculateConstrainedPan,
    saveState,
    loadState,
    createInitialState
  };
}

// ============================================================================
// UI Code (Browser only)
// ============================================================================

if (typeof window !== 'undefined') {
  // Game state
  let gameState = null;
  let gameData = null;
  let updateInterval = null;
  let dragState = null; // { tile, startQ, startR, bookClass, didMove }
  let fastDecay = false; // 300x decay speed when opt+d held
  const FAST_DECAY_MULTIPLIER = 300;
  let justDragged = false; // Suppress click after drag

  // Viewport state for infinite canvas
  let viewportState = {
    panX: 0,
    panY: 0,
    zoom: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    viewportWidth: 0,
    viewportHeight: 0
  };

  // Cache of rendered hex cells: "q,r" -> DOM element
  let cellCache = new Map();

  // Spatial index for O(1) tile lookups: "q,r" -> Tile[]
  let tileIndex = new Map();

  /**
   * Rebuild the spatial index from gameState.tiles
   */
  function rebuildTileIndex() {
    tileIndex.clear();
    if (!gameState) return;
    for (const tile of gameState.tiles) {
      const key = `${tile.q},${tile.r}`;
      if (!tileIndex.has(key)) tileIndex.set(key, []);
      tileIndex.get(key).push(tile);
    }
  }

  /**
   * Get tiles at a position using spatial index
   */
  function getTilesAt(q, r) {
    return tileIndex.get(`${q},${r}`) || [];
  }

  /**
   * Check if placement is valid using spatial index (O(1) lookup)
   */
  function canPlaceTileIndexed(pk, q, r) {
    const existing = getTilesAt(q, r);
    if (existing.length === 0) return true;
    return existing.every(t => t.pk === pk);
  }

  // DOM elements
  let elements = {};

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

    // Scroll wheel pan handler
    viewport.addEventListener('wheel', handleWheel, { passive: false });

    // Delegated tile event handlers (prevents memory leak from per-tile listeners)
    canvas.addEventListener('mousedown', (e) => {
      const tile = e.target.closest('.tile');
      if (tile) handleTileMouseDown(e);
    });

    canvas.addEventListener('click', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile || justDragged || tile.classList.contains('dragging')) return;
      const pk = tile.dataset.pk;
      const isCollected = tile.classList.contains('collected');
      openReadingModal(pk, isCollected);
    });

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

    constrainPan();
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

    constrainPan();
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
   * Constrain pan so at least one tile is always visible
   */
  function constrainPan() {
    if (!gameState || gameState.tiles.length === 0) return;

    const tileSize = getTileSize();
    const constrained = calculateConstrainedPan(gameState.tiles, viewportState, tileSize);
    viewportState.panX = constrained.panX;
    viewportState.panY = constrained.panY;
  }

  /**
   * Handle scroll wheel for panning and pinch-to-zoom
   */
  function handleWheel(e) {
    e.preventDefault();

    if (e.ctrlKey) {
      // Pinch to zoom
      const zoomFactor = 1 - e.deltaY * 0.01;
      const newZoom = Math.min(3, Math.max(0.3, viewportState.zoom * zoomFactor));

      // Zoom toward cursor position
      const rect = elements.hexViewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Adjust pan to keep cursor point stable
      const zoomChange = newZoom / viewportState.zoom;
      viewportState.panX = cursorX - (cursorX - viewportState.panX) * zoomChange;
      viewportState.panY = cursorY - (cursorY - viewportState.panY) * zoomChange;

      viewportState.zoom = newZoom;
    } else {
      // Regular scroll for panning
      viewportState.panX -= e.deltaX;
      viewportState.panY -= e.deltaY;
    }

    constrainPan();
    renderVisibleHexes();
  }

  /**
   * Render visible hexes based on viewport and pan position
   */
  function renderVisibleHexes() {
    const tileSize = getTileSize();
    const hexHeight = tileSize * 1.1547;
    const rowHeight = hexHeight * 0.75;
    const zoom = viewportState.zoom;

    // Calculate visible range in canvas space (account for zoom)
    const padding = 2; // Extra cells around visible area
    const visibleMinX = -viewportState.panX / zoom;
    const visibleMaxX = (viewportState.viewportWidth - viewportState.panX) / zoom;
    const visibleMinY = -viewportState.panY / zoom;
    const visibleMaxY = (viewportState.viewportHeight - viewportState.panY) / zoom;

    const minQ = Math.floor((visibleMinX - tileSize) / tileSize) - padding;
    const maxQ = Math.ceil((visibleMaxX + tileSize) / tileSize) + padding;
    const minR = Math.floor((visibleMinY - hexHeight) / rowHeight) - padding;
    const maxR = Math.ceil((visibleMaxY + hexHeight) / rowHeight) + padding;

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

          elements.hexCanvas.appendChild(cell);
          cellCache.set(key, cell);
        }

        // Update position (in canvas space, pan/zoom applied to canvas)
        const pos = hexToPixel(q, r, tileSize);
        cell.style.left = pos.x + 'px';
        cell.style.top = pos.y + 'px';
      }
    }

    // Remove cells that are no longer visible
    for (const [key, cell] of cellCache) {
      if (!visibleKeys.has(key)) {
        cell.remove();
        cellCache.delete(key);
      }
    }

    // Apply pan and zoom to canvas
    elements.hexCanvas.style.transform = `translate(${viewportState.panX}px, ${viewportState.panY}px) scale(${viewportState.zoom})`;
    elements.hexCanvas.style.transformOrigin = '0 0';

    // Render placed tiles
    renderPlacedTiles();
  }

  /**
   * Render placed tiles on the grid
   */
  function renderPlacedTiles() {
    if (!gameState) return;

    const decayDuration = fastDecay ? getDecayDurationMs() / FAST_DECAY_MULTIPLIER : getDecayDurationMs();
    const now = Date.now();

    // Group tiles by position (only collected tiles can stack)
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

      tileEl.dataset.q = q;
      tileEl.dataset.r = r;

      if (latestTile.isCollected) {
        // Collected tile: draggable, solid
        tileEl.classList.add('collected');

        // Stack badge (only for collected tiles)
        const collectedCount = tiles.filter(t => t.isCollected).length;
        if (collectedCount > 1) {
          const badge = document.createElement('span');
          badge.className = 'stack-badge';
          badge.textContent = 'x' + collectedCount;
          tileEl.appendChild(badge);
        }
      } else {
        // Uncollected tile: decaying, but still draggable
        tileEl.classList.add('decaying');

        // Set CSS animation variables for smooth fade
        const elapsed = now - latestTile.placedAt;
        tileEl.style.setProperty('--decay-duration', decayDuration + 'ms');
        tileEl.style.setProperty('--decay-elapsed', elapsed + 'ms');
      }

      cell.appendChild(tileEl);
      cell.classList.add('occupied');
      cell.dataset.pk = latestTile.pk;
    }
  }

  /**
   * Update stats display
   */
  function updateStats() {
    // Collected count (unique pks)
    const collectedTiles = gameState.tiles.filter(t => t.isCollected);
    const uniquePks = new Set(collectedTiles.map(t => t.pk));
    elements.collectedCount.textContent = uniquePks.size;
    elements.totalCount.textContent = Object.keys(gameData.readings).length;

    // Next tile countdown
    const now = Date.now();
    const timeSinceLastTile = now - gameState.lastTilePlacedAt;
    const timeUntilNext = Math.max(0, TILE_INTERVAL_MS - timeSinceLastTile);
    const secondsUntilNext = Math.ceil(timeUntilNext / 1000);

    if (secondsUntilNext > 0) {
      elements.nextTile.textContent = secondsUntilNext + 's';
    } else {
      elements.nextTile.textContent = 'Ready';
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

    // Find uncollected tile with matching pk
    const tile = gameState.tiles.find(t => t.pk === pk && !t.isCollected);
    if (!tile) return;

    // Mark tile as collected (stays in place)
    tile.isCollected = true;
    tile.collected = new Date().toISOString();
    delete tile.placedAt;

    // Save and re-render
    saveState(gameState);
    renderVisibleHexes();
    updateStats();
  }

  /**
   * Tile mousedown - start drag
   */
  function handleTileMouseDown(e) {
    if (e.button !== 0) return; // Left click only
    e.preventDefault(); // Prevent text selection
    e.stopPropagation(); // Don't trigger viewport pan

    const tile = e.target.closest('.tile');
    if (!tile) return;

    const q = parseInt(tile.dataset.q);
    const r = parseInt(tile.dataset.r);
    const bookClass = Array.from(tile.classList).find(c => c.startsWith('book-'));

    dragState = {
      tile: tile,
      startQ: q,
      startR: r,
      pk: tile.dataset.pk,
      bookClass: bookClass,
      didMove: false,
      lastHighlightedCell: null
    };

    tile.classList.add('dragging');
    document.body.classList.add('dragging-tile');
    if (bookClass) {
      document.body.dataset.dragBook = bookClass.replace('book-', '');
    }

    // Add global listeners
    document.addEventListener('mousemove', handleTileDragMove);
    document.addEventListener('mouseup', handleTileDragEnd);
  }

  /**
   * Tile drag move - highlight drop targets
   */
  function handleTileDragMove(e) {
    if (!dragState) return;

    dragState.didMove = true;

    // Clear previous highlight (O(1) instead of O(n))
    if (dragState.lastHighlightedCell) {
      dragState.lastHighlightedCell.classList.remove('drop-target', 'drop-invalid');
    }

    // Find cell under cursor
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.hex-cell');
    if (!cell) {
      dragState.lastHighlightedCell = null;
      return;
    }

    const q = parseInt(cell.dataset.q);
    const r = parseInt(cell.dataset.r);

    const valid = canPlaceTileIndexed(dragState.pk, q, r) ||
                  (q === dragState.startQ && r === dragState.startR);

    cell.classList.add(valid ? 'drop-target' : 'drop-invalid');
    dragState.lastHighlightedCell = cell;
  }

  /**
   * Tile drag end - drop or cancel
   */
  function handleTileDragEnd(e) {
    if (!dragState) return;

    // Remove global listeners
    document.removeEventListener('mousemove', handleTileDragMove);
    document.removeEventListener('mouseup', handleTileDragEnd);

    // Find cell under cursor
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.hex-cell');

    if (cell) {
      const newQ = parseInt(cell.dataset.q);
      const newR = parseInt(cell.dataset.r);

      // Check if valid move
      if ((newQ !== dragState.startQ || newR !== dragState.startR) &&
          canPlaceTileIndexed(dragState.pk, newQ, newR)) {

        // Move all tiles at old position to new position
        for (const tile of gameState.tiles) {
          if (tile.q === dragState.startQ && tile.r === dragState.startR && tile.pk === dragState.pk) {
            tile.q = newQ;
            tile.r = newR;
          }
        }

        rebuildTileIndex();
        saveState(gameState);
        renderVisibleHexes();
      }
    }

    // Clear highlight
    if (dragState.lastHighlightedCell) {
      dragState.lastHighlightedCell.classList.remove('drop-target', 'drop-invalid');
    }

    // Clean up
    if (dragState.tile) {
      dragState.tile.classList.remove('dragging');
    }
    document.body.classList.remove('dragging-tile');
    delete document.body.dataset.dragBook;

    // Suppress the click event that follows mouseup, but only if mouse actually moved
    if (dragState.didMove) {
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
    }

    dragState = null;
  }

  /**
   * Place the next tile from the schedule
   */
  function placeNextTile() {
    if (!gameData || !gameData.schedule || !gameState) {
      return; // Game not initialized
    }

    // Skip entries with missing reading data
    while (gameState.scheduleIndex < gameData.schedule.length) {
      const entry = gameData.schedule[gameState.scheduleIndex];
      if (entry && gameData.readings[entry.pk]) {
        break; // Found valid reading
      }
      gameState.scheduleIndex++;
    }

    if (gameState.scheduleIndex >= gameData.schedule.length) {
      return; // No more valid tiles
    }

    const reading = gameData.schedule[gameState.scheduleIndex];
    const tileSize = getTileSize();
    const { q, r } = findNearestEmptyCellFromViewportCenter(
      gameState.tiles,
      viewportState,
      tileSize
    );

    gameState.tiles.push({
      pk: reading.pk,
      q: q,
      r: r,
      placedAt: Date.now(),
      isCollected: false
    });

    gameState.scheduleIndex++;
    gameState.lastTilePlacedAt = Date.now();

    rebuildTileIndex();
    saveState(gameState);
    renderVisibleHexes();
  }

  /**
   * Update game state based on current time
   */
  function updateGame() {
    const now = Date.now();
    const decayDuration = fastDecay ? getDecayDurationMs() / FAST_DECAY_MULTIPLIER : getDecayDurationMs();
    const toRemove = new Set();

    // Single pass: find expired tiles and their oldest collected counterparts
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

    // Batch removal in reverse order to preserve indices
    if (toRemove.size > 0) {
      const sortedIndices = [...toRemove].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        gameState.tiles.splice(idx, 1);
      }
      rebuildTileIndex();
      saveState(gameState);
      renderVisibleHexes();
    }

    // Check if it's time to place a new tile
    const timeSinceLastTile = now - gameState.lastTilePlacedAt;
    if (timeSinceLastTile >= TILE_INTERVAL_MS) {
      placeNextTile();
    }

    updateStats();
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(e) {
    // Option+Shift+N to reset localStorage and reload
    if (e.altKey && e.shiftKey && e.code === 'KeyN') {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
      return;
    }
    // Option+N (Alt+N) to manually place next tile
    if (e.altKey && e.code === 'KeyN') {
      e.preventDefault();
      placeNextTile();
    }
    // Option+D to enable 100x fast decay
    if (e.altKey && e.code === 'KeyD' && !fastDecay) {
      e.preventDefault();
      const now = Date.now();

      // Adjust placedAt so decay fraction stays the same with faster duration
      // decayFraction = elapsed / normalDuration = newElapsed / fastDuration
      // newElapsed = elapsed / multiplier, so newPlacedAt = now - elapsed/multiplier
      for (const tile of gameState.tiles) {
        if (!tile.isCollected && tile.placedAt) {
          const elapsed = now - tile.placedAt;
          tile.placedAt = now - elapsed / FAST_DECAY_MULTIPLIER;
        }
      }

      fastDecay = true;
      renderVisibleHexes();
    }
  }

  /**
   * Handle key up
   */
  function handleKeyUp(e) {
    // Release Option+D to disable fast decay
    if (e.code === 'KeyD' && fastDecay) {
      const now = Date.now();

      // Reverse the adjustment: convert fast elapsed back to normal elapsed
      // newElapsed = elapsed * multiplier, so newPlacedAt = now - elapsed * multiplier
      for (const tile of gameState.tiles) {
        if (!tile.isCollected && tile.placedAt) {
          const elapsed = now - tile.placedAt;
          tile.placedAt = now - elapsed * FAST_DECAY_MULTIPLIER;
        }
      }

      fastDecay = false;
      saveState(gameState);
      renderVisibleHexes();
    }
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
      hexViewport: document.getElementById('hex-viewport'),
      hexCanvas: document.getElementById('hex-canvas'),
      collectedCount: document.getElementById('collected-count'),
      totalCount: document.getElementById('total-count'),
      nextTile: document.getElementById('next-tile'),
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
      console.error('Failed to load game data');
      return;
    }

    // Load or create game state
    gameState = loadState();
    if (!gameState) {
      gameState = createInitialState();
      saveState(gameState);
    }
    rebuildTileIndex();

    // Initialize UI
    setupViewport();
    updateGame();

    // Modal close handlers
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Start update loop
    updateInterval = setInterval(updateGame, 1000);

    // Save periodically
    setInterval(() => saveState(gameState), 30000);
  }

  // Expose initGame globally
  window.initGame = initGame;
}
