/**
 * Let Us Attend - An incremental game for collecting Gospel readings
 *
 * Core game logic for time system, tile management, and persistence.
 */

// Fixed timing constants
const TILE_INTERVAL_MS = 720 * 1000;  // 720 seconds (12 minutes) between tile placements
const DECAY_DURATION_MS = 1440 * 1000; // 1440 seconds (24 minutes) decay per tile
const READING_WPM = 200; // Words per minute for reading time calculation

const STORAGE_KEY = 'let-us-attend';

// Board constants - fixed size canvas with background
const BOARD_TILES_WIDE = 64;
const BOARD_SIZE_PX = 8192; // 64 tiles at 128px each

/**
 * Check if hex coordinates are within the board bounds.
 * Board is BOARD_SIZE_PX x BOARD_SIZE_PX pixels.
 *
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @param {number} tileSize - Width of hexagon (default 80)
 * @returns {boolean} True if position is on the board
 */
function isOnBoard(q, r, tileSize = 80) {
  const pos = hexToPixel(q, r, tileSize);
  const hexHeight = tileSize * 1.1547;
  // Check if the tile fits within board bounds
  return pos.x >= 0 && pos.x + tileSize <= BOARD_SIZE_PX &&
         pos.y >= 0 && pos.y + hexHeight <= BOARD_SIZE_PX;
}

/**
 * Get the fixed decay duration in milliseconds.
 *
 * @returns {number} Decay duration in milliseconds
 */
function getDecayDurationMs() {
  return DECAY_DURATION_MS;
}

// Perspective scale range: 0.85 at r=-10 to 1.15 at r=10 (±15% from base)
const PERSPECTIVE_SCALE_FACTOR = 0.015;  // Scale change per row
const PERSPECTIVE_BASE_ROW = 0;          // Row with scale = 1.0

/**
 * Calculate perspective scale factor for a given row.
 * Lower rows (higher r, closer to viewer) appear larger.
 * Clamped to minimum 1.0 to avoid gaps from shrinking tiles.
 *
 * @param {number} r - Row coordinate
 * @returns {number} Scale factor (minimum 1.0)
 */
function getScaleForRow(r) {
  const scale = 1 + (r - PERSPECTIVE_BASE_ROW) * PERSPECTIVE_SCALE_FACTOR;
  return Math.max(1.0, scale);
}

/**
 * Calculate Y offset to account for cumulative scaling of rows.
 * With center-center origin, cells grow equally up and down, so offset
 * only needs to compensate for half the expansion per row.
 *
 * @param {number} r - Row coordinate
 * @param {number} rowHeight - Vertical spacing between row centers (hexHeight * 0.75)
 * @returns {number} Y offset in pixels
 */
function getPerspectiveYOffset(r, rowHeight) {
  // Cumulative offset: sum of (scale(i) - 1) * rowHeight / 2 for rows 0 to r-1
  // = k * rowHeight / 2 * (0 + 1 + ... + (r-1)) = k * rowHeight * r * (r-1) / 4
  if (r === 0) return 0;
  if (r > 0) {
    return PERSPECTIVE_SCALE_FACTOR * rowHeight * r * (r - 1) / 4;
  } else {
    return -PERSPECTIVE_SCALE_FACTOR * rowHeight * (-r) * (-r - 1) / 4;
  }
}

/**
 * Calculate X offset to account for horizontal scaling within a row.
 * Cells spread outward from center (q=0) based on scale factor.
 *
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @param {number} tileWidth - Width of a hex cell
 * @returns {number} X offset in pixels
 */
function getPerspectiveXOffset(q, r, tileWidth) {
  const scale = getScaleForRow(r);
  // Each cell expands by (scale - 1) * width, spread cells outward from q=0
  return q * tileWidth * (scale - 1);
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

  // Standard hex positioning (flat top-down view)
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
 * Find the nearest empty cell from viewport center.
 * For uncollected tiles, only finds truly empty cells (no stacking).
 * Uses true hex rings for concentric placement.
 * Only returns cells within board bounds.
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
  if (!occupied.has(`${centerHex.q},${centerHex.r}`) && isOnBoard(centerHex.q, centerHex.r, tileSize)) {
    return { q: centerHex.q, r: centerHex.r };
  }

  // Search by true hex rings in circular order
  for (let radius = 1; radius < 100; radius++) {
    const ring = getHexRing(centerHex.q, centerHex.r, radius);
    for (const cell of ring) {
      const key = `${cell.q},${cell.r}`;
      if (!occupied.has(key) && isOnBoard(cell.q, cell.r, tileSize)) {
        return cell;
      }
    }
  }

  // Fallback - find any empty cell on board starting from origin
  const originHex = { q: 0, r: 0 };
  if (!occupied.has('0,0') && isOnBoard(0, 0, tileSize)) {
    return originHex;
  }
  for (let radius = 1; radius < 100; radius++) {
    const ring = getHexRing(0, 0, radius);
    for (const cell of ring) {
      const key = `${cell.q},${cell.r}`;
      if (!occupied.has(key) && isOnBoard(cell.q, cell.r, tileSize)) {
        return cell;
      }
    }
  }

  // Final fallback (shouldn't happen)
  return { q: 0, r: 0 };
}

/**
 * Find the nearest empty cell from a given hex position.
 * Uses true hex rings for concentric placement.
 * Only returns cells within board bounds.
 *
 * @param {Array} tiles - Array of placed tiles
 * @param {number} centerQ - Center hex column
 * @param {number} centerR - Center hex row
 * @param {number} tileSize - Width of hexagon
 * @returns {Object} Hex coordinates {q, r} of nearest empty cell
 */
function findNearestEmptyCellFromHex(tiles, centerQ, centerR, tileSize) {
  // Build set of all occupied cells
  const occupied = new Set(tiles.map(t => `${t.q},${t.r}`));

  // Check center first
  if (!occupied.has(`${centerQ},${centerR}`) && isOnBoard(centerQ, centerR, tileSize)) {
    return { q: centerQ, r: centerR };
  }

  // Search by true hex rings in circular order
  for (let radius = 1; radius < 100; radius++) {
    const ring = getHexRing(centerQ, centerR, radius);
    for (const cell of ring) {
      const key = `${cell.q},${cell.r}`;
      if (!occupied.has(key) && isOnBoard(cell.q, cell.r, tileSize)) {
        return cell;
      }
    }
  }

  // Final fallback (shouldn't happen)
  return { q: centerQ, r: centerR };
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
 * Count words in HTML content by stripping tags and splitting on whitespace.
 *
 * @param {string} html - HTML content string
 * @returns {number} Word count
 */
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Calculate reading time in milliseconds based on word count.
 *
 * @param {number} wordCount - Number of words
 * @returns {number} Reading time in milliseconds
 */
function calculateReadingTimeMs(wordCount) {
  return (wordCount / READING_WPM) * 60 * 1000;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TILE_INTERVAL_MS,
    DECAY_DURATION_MS,
    READING_WPM,
    PERSPECTIVE_SCALE_FACTOR,
    PERSPECTIVE_BASE_ROW,
    BOARD_TILES_WIDE,
    BOARD_SIZE_PX,
    getDecayDurationMs,
    hexToPixel,
    pixelToHex,
    hexDistance,
    getHexRing,
    getScaleForRow,
    getPerspectiveYOffset,
    getPerspectiveXOffset,
    isOnBoard,
    canPlaceTile,
    findNearestEmptyCellFromViewportCenter,
    findNearestEmptyCellFromHex,
    countWords,
    calculateReadingTimeMs,
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
  const FAST_MODAL_MULTIPLIER = 30;
  let justDragged = false; // Suppress click after drag
  let currentReadingPk = null; // Track which reading's modal is open
  let modalOpenedAt = null; // Track when modal was opened for decay pause
  let currentReadingTimeMs = null; // Full reading time for current modal
  let currentStartProgress = 0; // Progress when modal was opened (0-1)

  // Viewport state for infinite canvas
  let viewportState = {
    panX: 0,
    panY: 0,
    zoom: 2,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    viewportWidth: 0,
    viewportHeight: 0
  };

  // Cache of rendered hex cells: "q,r" -> DOM element
  let cellCache = new Map();

  // Track visible range for incremental updates
  let lastVisibleRange = { minQ: 0, maxQ: 0, minR: 0, maxR: 0 };

  // Spatial index for O(1) tile lookups: "q,r" -> Tile[]
  let tileIndex = new Map();

  // Center hex for initial tile placement
  let boardCenterHex = null;

  // Current viewport center hex (updated when panning)
  let viewportCenterHex = null;

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
   * Also checks board bounds.
   */
  function canPlaceTileIndexed(pk, q, r) {
    // Must be on board
    if (!isOnBoard(q, r, getTileSize())) return false;
    const existing = getTilesAt(q, r);
    if (existing.length === 0) return true;
    return existing.every(t => t.pk === pk);
  }

  /**
   * Check if modal is currently open
   */
  function isModalOpen() {
    return elements.modal && elements.modal.classList.contains('visible');
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

    // Title text
    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = reading.title;
    tile.appendChild(title);

    // Reference text (hidden but kept for accessibility)
    const ref = document.createElement('div');
    ref.className = 'tile-ref';
    ref.textContent = reading.ref;
    tile.appendChild(ref);

    // Book seal
    const seal = document.createElement('div');
    seal.className = 'tile-seal seal-' + reading.book.toLowerCase();
    tile.appendChild(seal);

    if (isAvailable) {
      tile.classList.add('available');
    }

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

    // Set board size
    canvas.style.width = BOARD_SIZE_PX + 'px';
    canvas.style.height = BOARD_SIZE_PX + 'px';

    // Get viewport dimensions
    viewportState.viewportWidth = viewport.clientWidth;
    viewportState.viewportHeight = viewport.clientHeight;

    // Center on the tile closest to board center
    const zoom = viewportState.zoom;
    const tileSize = getTileSize();
    const hexHeight = tileSize * 1.1547;
    const boardCenterX = BOARD_SIZE_PX / 2;
    const boardCenterY = BOARD_SIZE_PX / 2;
    boardCenterHex = pixelToHex(boardCenterX, boardCenterY, tileSize);
    const tilePos = hexToPixel(boardCenterHex.q, boardCenterHex.r, tileSize);
    const tileCenterX = tilePos.x + tileSize / 2;
    const tileCenterY = tilePos.y + hexHeight / 2;
    viewportState.panX = viewportState.viewportWidth / 2 - tileCenterX * zoom;
    viewportState.panY = viewportState.viewportHeight / 2 - tileCenterY * zoom;
    constrainPan();
    // Set viewport center to exact tile hex (overrides rounding from constrainPan)
    viewportCenterHex = { q: boardCenterHex.q, r: boardCenterHex.r };

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
      openReadingModal(pk);
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
    // Block pan while modal is open
    if (isModalOpen()) return;
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
    updatePan();
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
    // Block pan while modal is open
    if (isModalOpen()) return;
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
    updatePan();
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd() {
    viewportState.isDragging = false;
    elements.hexViewport.classList.remove('dragging');
  }

  /**
   * Calculate minimum zoom so board always covers viewport
   */
  function getMinZoom() {
    const minZoomX = viewportState.viewportWidth / BOARD_SIZE_PX;
    const minZoomY = viewportState.viewportHeight / BOARD_SIZE_PX;
    return Math.max(0.3, minZoomX, minZoomY);
  }

  /**
   * Constrain pan to keep viewport within board bounds
   */
  function constrainPan() {
    const zoom = viewportState.zoom || 1;

    const scaledWidth = BOARD_SIZE_PX * zoom;
    const scaledHeight = BOARD_SIZE_PX * zoom;

    // Board edge = viewport edge (no margin)
    const minPanX = viewportState.viewportWidth - scaledWidth;
    const maxPanX = 0;

    const minPanY = viewportState.viewportHeight - scaledHeight;
    const maxPanY = 0;

    viewportState.panX = Math.max(minPanX, Math.min(maxPanX, viewportState.panX));
    viewportState.panY = Math.max(minPanY, Math.min(maxPanY, viewportState.panY));

    // Update viewport center hex
    const tileSize = getTileSize();
    const centerX = (viewportState.viewportWidth / 2 - viewportState.panX) / zoom;
    const centerY = (viewportState.viewportHeight / 2 - viewportState.panY) / zoom;
    viewportCenterHex = pixelToHex(centerX, centerY, tileSize);
  }

  /**
   * Handle scroll wheel for panning and pinch-to-zoom
   */
  function handleWheel(e) {
    // Block pan/zoom while modal is open
    if (isModalOpen()) return;
    e.preventDefault();

    if (e.ctrlKey) {
      // Pinch to zoom
      const zoomFactor = 1 - e.deltaY * 0.01;
      const newZoom = Math.min(5, Math.max(getMinZoom(), viewportState.zoom * zoomFactor));

      // Zoom toward cursor position
      const rect = elements.hexViewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Adjust pan to keep cursor point stable
      const zoomChange = newZoom / viewportState.zoom;
      viewportState.panX = cursorX - (cursorX - viewportState.panX) * zoomChange;
      viewportState.panY = cursorY - (cursorY - viewportState.panY) * zoomChange;

      viewportState.zoom = newZoom;
      constrainPan();
      updatePan(); // Zoom only changes transform, use fast path
      updateBackgroundBlur();
    } else {
      // Regular scroll for panning - use fast path
      viewportState.panX -= e.deltaX;
      viewportState.panY -= e.deltaY;
      constrainPan();
      updatePan();
    }
  }

  /**
   * Calculate the visible cell range based on current viewport
   */
  function calculateVisibleRange() {
    const tileSize = getTileSize();
    const hexHeight = tileSize * 1.1547;
    const rowHeight = hexHeight * 0.75;
    const zoom = viewportState.zoom;
    const padding = 2;

    const visibleMinX = -viewportState.panX / zoom;
    const visibleMaxX = (viewportState.viewportWidth - viewportState.panX) / zoom;
    const visibleMinY = -viewportState.panY / zoom;
    const visibleMaxY = (viewportState.viewportHeight - viewportState.panY) / zoom;

    return {
      minQ: Math.floor((visibleMinX - tileSize) / tileSize) - padding,
      maxQ: Math.ceil((visibleMaxX + tileSize) / tileSize) + padding,
      minR: Math.floor((visibleMinY - hexHeight) / rowHeight) - padding,
      maxR: Math.ceil((visibleMaxY + hexHeight) / rowHeight) + padding
    };
  }

  /**
   * Update background blur and opacity based on zoom level
   * Clear when zoomed out, lightly blurred when zoomed in
   */
  function updateBackgroundBlur() {
    // Blur starts at zoom 1, maxes at zoom 5 (4px)
    const blur = Math.max(0, (viewportState.zoom - 1) / 4 * 4);
    // Opacity scales from 0.2 (blur 0) to 0.67 (blur 4)
    const opacity = 0.2 + (blur / 4) * 0.47;
    elements.hexCanvas.style.setProperty('--bg-blur', blur + 'px');
    elements.hexCanvas.style.setProperty('--bg-opacity', opacity);
  }

  /**
   * Update only the canvas transform (fast path for panning)
   */
  function updateCanvasTransform() {
    elements.hexCanvas.style.transform = `translate(${viewportState.panX}px, ${viewportState.panY}px) scale(${viewportState.zoom})`;
  }

  /**
   * Check if visible range changed and update cells if needed.
   * Returns array of new cell keys, or null if no change.
   */
  function updateVisibleCellsIfNeeded() {
    const range = calculateVisibleRange();

    // Check if range changed
    if (range.minQ === lastVisibleRange.minQ &&
        range.maxQ === lastVisibleRange.maxQ &&
        range.minR === lastVisibleRange.minR &&
        range.maxR === lastVisibleRange.maxR) {
      return null;
    }

    lastVisibleRange = range;

    const tileSize = getTileSize();
    const visibleKeys = new Set();
    const newCellKeys = [];

    // Create or update visible cells
    for (let r = range.minR; r <= range.maxR; r++) {
      for (let q = range.minQ; q <= range.maxQ; q++) {
        const key = `${q},${r}`;
        visibleKeys.add(key);

        let cell = cellCache.get(key);

        if (!cell) {
          cell = document.createElement('div');
          cell.className = 'hex-cell';
          cell.dataset.q = q;
          cell.dataset.r = r;

          const pos = hexToPixel(q, r, tileSize);
          cell.style.left = pos.x + 'px';
          cell.style.top = pos.y + 'px';
          // Z-index for depth ordering: lower rows (higher r) appear in front
          cell.style.zIndex = 10000 + r;

          elements.hexCanvas.appendChild(cell);
          cellCache.set(key, cell);
          newCellKeys.push(key);
        }
      }
    }

    // Remove cells that are no longer visible
    for (const [key, cell] of cellCache) {
      if (!visibleKeys.has(key)) {
        cell.remove();
        cellCache.delete(key);
      }
    }

    return newCellKeys;
  }

  /**
   * Render visible hexes based on viewport and pan position
   */
  function renderVisibleHexes() {
    updateVisibleCellsIfNeeded();
    updateCanvasTransform();
    updateBackgroundBlur();
    elements.hexCanvas.style.transformOrigin = '0 0';
    renderPlacedTiles();
  }

  /**
   * Fast pan update - only updates transform and adds new edge cells if needed
   */
  function updatePan() {
    updateCanvasTransform();
    const newCells = updateVisibleCellsIfNeeded();
    if (newCells && newCells.length > 0) {
      // Only render tiles into newly visible cells
      renderTilesIntoCells(newCells);
    }
  }

  /**
   * Render tiles only into specific cells (for incremental edge updates)
   */
  function renderTilesIntoCells(cellKeys) {
    if (!gameState) return;

    const decayDuration = fastDecay ? getDecayDurationMs() / FAST_DECAY_MULTIPLIER : getDecayDurationMs();
    const now = Date.now();

    for (const key of cellKeys) {
      const cell = cellCache.get(key);
      if (!cell) continue;

      // Check if there's a tile at this position
      const tilesAtPos = getTilesAt(...key.split(',').map(Number));
      if (tilesAtPos.length === 0) continue;

      const [q, r] = key.split(',').map(Number);
      const latestTile = tilesAtPos[tilesAtPos.length - 1];
      const tileEl = createTileElement(latestTile.pk, false);
      if (!tileEl) continue;

      tileEl.dataset.q = q;
      tileEl.dataset.r = r;

      if (latestTile.isCollected) {
        tileEl.classList.add('collected');
        const collectedCount = tilesAtPos.filter(t => t.isCollected).length;
        if (collectedCount > 1) {
          const badge = document.createElement('span');
          badge.className = 'stack-badge';
          badge.textContent = 'x' + collectedCount;
          tileEl.appendChild(badge);
        }
      } else {
        tileEl.classList.add('uncollected');
        const elapsed = now - latestTile.placedAt;
        tileEl.style.setProperty('--decay-duration', decayDuration + 'ms');
        tileEl.style.setProperty('--decay-elapsed', elapsed + 'ms');
        tileEl.style.setProperty('--read-progress', latestTile.readProgress || 0);
      }

      cell.appendChild(tileEl);
      cell.classList.add('occupied');
      if (latestTile.isCollected) {
        cell.classList.add('has-collected');
      }
      cell.dataset.pk = latestTile.pk;
    }
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
      cell.classList.remove('occupied', 'has-collected');
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
        tileEl.classList.add('uncollected');

        // Set CSS animation variables for smooth fade
        const elapsed = now - latestTile.placedAt;
        tileEl.style.setProperty('--decay-duration', decayDuration + 'ms');
        tileEl.style.setProperty('--decay-elapsed', elapsed + 'ms');
        tileEl.style.setProperty('--read-progress', latestTile.readProgress || 0);
      }

      cell.appendChild(tileEl);
      cell.classList.add('occupied');
      if (latestTile.isCollected) {
        cell.classList.add('has-collected');
      }
      cell.dataset.pk = latestTile.pk;
    }
  }

  /**
   * Update stats display
   */
  function updateStats() {
    const total = Object.keys(gameData.readings).length;

    // Collected count (unique pks)
    const collectedTiles = gameState.tiles.filter(t => t.isCollected);
    const uniqueCollectedPks = new Set(collectedTiles.map(t => t.pk));
    const collectedPct = (uniqueCollectedPks.size / total) * 100;

    // Placed count (unique pks currently on board)
    const uniquePlacedPks = new Set(gameState.tiles.map(t => t.pk));
    const placedPct = (uniquePlacedPks.size / total) * 100;

    // Update progress bars
    elements.progressPlaced.style.width = placedPct + '%';
    elements.progressCollected.style.width = collectedPct + '%';

    // Timer bar - shows progress toward next tile
    const now = Date.now();
    const tileInterval = fastDecay ? TILE_INTERVAL_MS / FAST_DECAY_MULTIPLIER : TILE_INTERVAL_MS;
    const timeSinceLastTile = now - gameState.lastTilePlacedAt;
    const progress = Math.min(1, timeSinceLastTile / tileInterval);
    elements.timerFill.style.width = (progress * 100) + '%';

    // Reading timer bar - shows progress toward completing current reading
    if (isModalOpen() && modalOpenedAt && currentReadingTimeMs) {
      const elapsed = now - modalOpenedAt;
      const progressGained = currentReadingTimeMs > 0 ? elapsed / currentReadingTimeMs : 0;
      const readingProgress = Math.min(1, currentStartProgress + progressGained);
      elements.readingTimerFill.style.width = (readingProgress * 100) + '%';
    }
  }

  /**
   * Open reading modal
   */
  function openReadingModal(pk) {
    const reading = gameData.readings[pk];
    if (!reading) return;

    // Track for decay pausing
    currentReadingPk = pk;
    modalOpenedAt = Date.now();

    elements.modalTitle.textContent = reading.title;
    elements.modalRef.textContent = reading.ref;
    elements.modalText.innerHTML = reading.content;

    // Set overlay color based on book
    elements.modal.classList.remove('book-matthew', 'book-mark', 'book-luke', 'book-john');
    elements.modal.classList.add('book-' + reading.book.toLowerCase());

    // Calculate reading time
    const wordCount = countWords(reading.content);
    currentReadingTimeMs = calculateReadingTimeMs(wordCount);

    // Find the tile to check if collected and get read progress
    const tile = gameState.tiles.find(t => t.pk === pk);
    const isCollected = tile && tile.isCollected;

    if (isCollected) {
      // Already collected - show full book color instantly
      elements.modal.style.setProperty('--fade-duration', '1ms');
      elements.modal.style.setProperty('--fade-delay', '-1ms');
      currentStartProgress = 1;
    } else {
      // Uncollected - animate from saved progress using negative delay
      currentStartProgress = (tile && tile.readProgress) || 0;
      elements.modal.style.setProperty('--fade-duration', currentReadingTimeMs + 'ms');
      elements.modal.style.setProperty('--fade-delay', (-currentStartProgress * currentReadingTimeMs) + 'ms');
    }

    // Set collected class based on tile state (for completion indicator)
    if (isCollected) {
      elements.modal.classList.add('collected');
    } else {
      elements.modal.classList.remove('collected');
    }

    // Initialize reading timer bar
    elements.readingTimerFill.style.width = (currentStartProgress * 100) + '%';

    elements.modal.classList.add('visible');

    // Listen for overlay fade animation end to mark as collected
    if (!isCollected) {
      const handleOverlayAnimationEnd = (e) => {
        if (e.animationName !== 'overlay-fade') return;
        elements.modal.removeEventListener('animationend', handleOverlayAnimationEnd);
        const tile = gameState.tiles.find(t => t.pk === currentReadingPk && !t.isCollected);
        if (tile) {
          tile.isCollected = true;
          tile.collected = new Date().toISOString();
          delete tile.placedAt;
          delete tile.readProgress;
          elements.modal.classList.add('collected');
          saveState(gameState);
          renderVisibleHexes();
          updateStats();
        }
      };
      elements.modal.addEventListener('animationend', handleOverlayAnimationEnd);
    }

    // Scroll to top and update scroll indicators
    const content = elements.modal.querySelector('.modal-content');
    if (content) {
      content.scrollTop = 0;
      updateScrollIndicators(content);
    }
  }

  /**
   * Update scroll indicator classes based on scroll position
   */
  function updateScrollIndicators(content) {
    const canScrollUp = content.scrollTop > 1;
    const canScrollDown = content.scrollTop < content.scrollHeight - content.clientHeight - 1;
    content.classList.toggle('scroll-top', canScrollUp);
    content.classList.toggle('scroll-bottom', canScrollDown);
  }

  /**
   * Close reading modal
   */
  function closeModal() {
    if (currentReadingPk && modalOpenedAt) {
      const tile = gameState.tiles.find(t => t.pk === currentReadingPk && !t.isCollected);
      if (tile) {
        const modalDuration = Date.now() - modalOpenedAt;

        // Calculate new read progress
        const progressGained = currentReadingTimeMs > 0 ? modalDuration / currentReadingTimeMs : 0;
        const newProgress = Math.min(1, currentStartProgress + progressGained);

        if (newProgress >= 1) {
          // Fully read - mark as collected
          tile.isCollected = true;
          tile.collected = new Date().toISOString();
          delete tile.placedAt;
          delete tile.readProgress;
          elements.modal.classList.add('collected');
          renderVisibleHexes();
          updateStats();
        } else {
          // Partially read - save progress and pause decay
          tile.readProgress = newProgress;
          if (tile.placedAt) {
            tile.placedAt += modalDuration;
          }
        }
        saveState(gameState);
      }
    }
    currentReadingPk = null;
    modalOpenedAt = null;
    currentReadingTimeMs = null;
    currentStartProgress = 0;
    elements.readingTimerFill.style.width = '0%';
    elements.modal.classList.remove('visible', 'collected');
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

    // Only allow drag on collected tiles
    if (!tile.classList.contains('collected')) return;

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

    // Add global listeners
    document.addEventListener('mousemove', handleTileDragMove);
    document.addEventListener('mouseup', handleTileDragEnd);
  }

  /**
   * Tile drag move - highlight drop target
   */
  function handleTileDragMove(e) {
    if (!dragState) return;

    dragState.didMove = true;

    // Clear previous highlight
    if (dragState.lastHighlightedCell) {
      dragState.lastHighlightedCell.classList.remove('drop-target', 'drop-invalid');
    }

    // Find cell under cursor
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.hex-cell');

    if (cell) {
      const q = parseInt(cell.dataset.q);
      const r = parseInt(cell.dataset.r);

      const valid = canPlaceTileIndexed(dragState.pk, q, r) ||
                    (q === dragState.startQ && r === dragState.startR);

      cell.classList.add(valid ? 'drop-target' : 'drop-invalid');
      dragState.lastHighlightedCell = cell;
    } else {
      dragState.lastHighlightedCell = null;
    }
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

    // Use board center for first tile, otherwise find nearest empty cell from viewport center
    let q, r;
    if (gameState.tiles.length === 0 && boardCenterHex) {
      q = boardCenterHex.q;
      r = boardCenterHex.r;
    } else {
      ({ q, r } = findNearestEmptyCellFromHex(
        gameState.tiles,
        viewportCenterHex.q,
        viewportCenterHex.r,
        tileSize
      ));
    }

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
    const tileInterval = fastDecay ? TILE_INTERVAL_MS / FAST_DECAY_MULTIPLIER : TILE_INTERVAL_MS;
    const timeSinceLastTile = now - gameState.lastTilePlacedAt;
    if (timeSinceLastTile >= tileInterval) {
      placeNextTile();
    }

    updateStats();
  }

  /**
   * Apply zoom centered on viewport
   */
  function applyZoom(newZoom) {
    newZoom = Math.min(5, Math.max(getMinZoom(), newZoom));
    if (newZoom === viewportState.zoom) return;

    // Zoom toward viewport center
    const centerX = viewportState.viewportWidth / 2;
    const centerY = viewportState.viewportHeight / 2;
    const zoomChange = newZoom / viewportState.zoom;
    viewportState.panX = centerX - (centerX - viewportState.panX) * zoomChange;
    viewportState.panY = centerY - (centerY - viewportState.panY) * zoomChange;
    viewportState.zoom = newZoom;

    constrainPan();
    updatePan();
    updateBackgroundBlur();
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(e) {
    // Override browser zoom: Cmd/Ctrl + Plus/Minus/Zero
    if ((e.metaKey || e.ctrlKey)) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        if (!isModalOpen()) applyZoom(viewportState.zoom * 1.25);
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        if (!isModalOpen()) applyZoom(viewportState.zoom / 1.25);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        if (!isModalOpen()) applyZoom(2);
        return;
      }
    }

    // Escape to close modal
    if (e.code === 'Escape' && isModalOpen()) {
      e.preventDefault();
      closeModal();
      return;
    }
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
    // Option+Shift+M to mark all uncollected tiles as collected
    if (e.altKey && e.shiftKey && e.code === 'KeyM') {
      e.preventDefault();
      const now = new Date().toISOString();
      for (const tile of gameState.tiles) {
        if (!tile.isCollected) {
          tile.isCollected = true;
          tile.collected = now;
          delete tile.placedAt;
          delete tile.readProgress;
        }
      }
      saveState(gameState);
      renderVisibleHexes();
      updateStats();
      return;
    }
    // Option+M to mark current reading as fully read (testing shortcut)
    if (e.altKey && e.code === 'KeyM' && isModalOpen() && currentReadingPk) {
      e.preventDefault();
      const tile = gameState.tiles.find(t => t.pk === currentReadingPk && !t.isCollected);
      if (tile) {
        tile.isCollected = true;
        tile.collected = new Date().toISOString();
        delete tile.placedAt;
        delete tile.readProgress;
        elements.modal.classList.add('collected');
        // Jump background to full color
        elements.modal.style.setProperty('--fade-duration', '1ms');
        elements.modal.style.setProperty('--fade-delay', '-1ms');
        saveState(gameState);
        renderVisibleHexes();
        updateStats();
      }
    }
    // Option+D to enable 300x fast mode (decay, tile timer, modal fade)
    if (e.altKey && e.code === 'KeyD' && !fastDecay) {
      e.preventDefault();
      const now = Date.now();

      // Adjust placedAt so decay fraction stays the same with faster duration
      for (const tile of gameState.tiles) {
        if (!tile.isCollected && tile.placedAt) {
          const elapsed = now - tile.placedAt;
          tile.placedAt = now - elapsed / FAST_DECAY_MULTIPLIER;
        }
      }

      // Adjust tile timer
      const tileElapsed = now - gameState.lastTilePlacedAt;
      gameState.lastTilePlacedAt = now - tileElapsed / FAST_DECAY_MULTIPLIER;

      // Accelerate modal fade if open (only for uncollected)
      if (isModalOpen() && modalOpenedAt && currentReadingTimeMs) {
        const tile = gameState.tiles.find(t => t.pk === currentReadingPk && !t.isCollected);
        if (tile) {
          // Calculate current progress
          const elapsed = now - modalOpenedAt;
          const progressGained = elapsed / currentReadingTimeMs;
          const currentProgress = Math.min(1, currentStartProgress + progressGained);

          // Restart animation at current progress with accelerated speed
          const fastDuration = currentReadingTimeMs / FAST_MODAL_MULTIPLIER;
          elements.modal.style.setProperty('--fade-duration', fastDuration + 'ms');
          elements.modal.style.setProperty('--fade-delay', (-currentProgress * fastDuration) + 'ms');
          elements.modal.classList.remove('visible');
          elements.modal.offsetHeight; // Trigger reflow
          elements.modal.classList.add('visible');

          // Update tracking: we're now at currentProgress, timer restarts
          currentStartProgress = currentProgress;
          currentReadingTimeMs = fastDuration;
          modalOpenedAt = now;
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
    // Release Option+D to disable fast mode
    if (e.code === 'KeyD' && fastDecay) {
      const now = Date.now();

      // Reverse decay adjustment
      for (const tile of gameState.tiles) {
        if (!tile.isCollected && tile.placedAt) {
          const elapsed = now - tile.placedAt;
          tile.placedAt = now - elapsed * FAST_DECAY_MULTIPLIER;
        }
      }

      // Reverse tile timer adjustment
      const tileElapsed = now - gameState.lastTilePlacedAt;
      gameState.lastTilePlacedAt = now - tileElapsed * FAST_DECAY_MULTIPLIER;

      // Restore modal fade duration if open (only for uncollected)
      if (isModalOpen() && currentReadingTimeMs) {
        const tile = gameState.tiles.find(t => t.pk === currentReadingPk && !t.isCollected);
        if (tile) {
          // Calculate current progress
          const elapsed = now - modalOpenedAt;
          const progressGained = elapsed / currentReadingTimeMs;
          const currentProgress = Math.min(1, currentStartProgress + progressGained);

          // Restore to normal speed
          const reading = gameData.readings[currentReadingPk];
          const wordCount = countWords(reading.content);
          const normalDuration = calculateReadingTimeMs(wordCount);

          elements.modal.style.setProperty('--fade-duration', normalDuration + 'ms');
          elements.modal.style.setProperty('--fade-delay', (-currentProgress * normalDuration) + 'ms');
          elements.modal.classList.remove('visible');
          elements.modal.offsetHeight; // Trigger reflow
          elements.modal.classList.add('visible');

          // Update tracking
          currentStartProgress = currentProgress;
          currentReadingTimeMs = normalDuration;
          modalOpenedAt = now;
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
      loading: document.getElementById('loading'),
      loadingTimerFill: document.getElementById('loading-timer-fill'),
      hexViewport: document.getElementById('hex-viewport'),
      hexCanvas: document.getElementById('hex-canvas'),
      statsBox: document.getElementById('stats-box'),
      progressPlaced: document.getElementById('progress-placed'),
      progressCollected: document.getElementById('progress-collected'),
      timerFill: document.getElementById('timer-fill'),
      modal: document.getElementById('reading-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalRef: document.getElementById('modal-ref'),
      readingTimerFill: document.getElementById('reading-timer-fill'),
      modalText: document.getElementById('modal-text')
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

    // Show board (must happen before setupViewport reads dimensions)
    elements.hexViewport.classList.remove('hidden');
    elements.statsBox.classList.remove('hidden');

    // Initialize UI
    setupViewport();
    updateGame();

    // Animate loading timer over 3 seconds, then reveal board
    const loadingDuration = 3000;
    const loadingStart = Date.now();

    function animateLoading() {
      const elapsed = Date.now() - loadingStart;
      const progress = Math.min(elapsed / loadingDuration, 1);
      elements.loadingTimerFill.style.width = (progress * 100) + '%';

      if (progress < 1) {
        requestAnimationFrame(animateLoading);
      } else {
        // Fade in board, hide loading
        elements.hexViewport.classList.add('visible');
        elements.loading.classList.add('fade-out');
      }
    }
    requestAnimationFrame(animateLoading);

    // Click on overlay background closes modal (not content area)
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });

    // Click on completion indicator closes modal
    document.getElementById('completion-indicator').addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    // Scroll indicators for modal
    const modalContent = elements.modal.querySelector('.modal-content');
    modalContent.addEventListener('scroll', () => updateScrollIndicators(modalContent));

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Start update loop (~30fps for smooth timer bar)
    updateInterval = setInterval(updateGame, 33);

    // Save periodically
    setInterval(() => saveState(gameState), 30000);
  }

  // Expose initGame globally
  window.initGame = initGame;
}
