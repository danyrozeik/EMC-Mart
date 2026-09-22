(() => {
  const COLS = 10;
  const ROWS = 20;

  const board = document.getElementById("board");
  const ctx = board.getContext("2d");
  const CELL = board.width / COLS;

  const nextCanvas = document.getElementById("next");
  const nextCtx = nextCanvas.getContext("2d");

  const holdCanvas = document.getElementById("hold");
  const holdCtx = holdCanvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const startBtn = document.getElementById("startBtn");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");

  const BEST_KEY = "stackdrop-best-score";
  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    // localStorage unavailable (private mode, etc.) - best stays session-only
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch (e) {
      // ignore
    }
  }

  const COLORS = {
    I: "#5ce1e6",
    J: "#5c7cff",
    L: "#ffb454",
    O: "#ffe14d",
    S: "#6dff8c",
    T: "#c96dff",
    Z: "#ff6d6d",
  };

  const SHAPES = {
    I: [
      [0, 1], [1, 1], [2, 1], [3, 1],
    ],
    J: [
      [0, 0], [0, 1], [1, 1], [2, 1],
    ],
    L: [
      [2, 0], [0, 1], [1, 1], [2, 1],
    ],
    O: [
      [1, 0], [2, 0], [1, 1], [2, 1],
    ],
    S: [
      [1, 0], [2, 0], [0, 1], [1, 1],
    ],
    T: [
      [1, 0], [0, 1], [1, 1], [2, 1],
    ],
    Z: [
      [0, 0], [1, 0], [1, 1], [2, 1],
    ],
  };

  const PIECE_KEYS = Object.keys(SHAPES);

  function rotateCells(cells) {
    // rotate around the piece's local 4x4-ish bounding box, using (x,y) -> (y, size-1-x)
    const size = 4;
    return cells.map(([x, y]) => [y, size - 1 - x]);
  }

  function newBag() {
    const bag = [...PIECE_KEYS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  let bag = [];
  function nextPieceKey() {
    if (bag.length === 0) bag = newBag();
    return bag.pop();
  }

  function makePiece(key) {
    return {
      key,
      cells: SHAPES[key].map((c) => [...c]),
      x: 3,
      y: -1,
    };
  }

  let grid, current, next, held, holdUsed, score, lines, level, dropCounter, dropInterval;
  let lastTime = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let rafId = null;

  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function resetState() {
    grid = emptyGrid();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropCounter = 0;
    bag = [];
    current = makePiece(nextPieceKey());
    next = makePiece(nextPieceKey());
    held = null;
    holdUsed = false;
    gameOver = false;
    updateStats();
  }

  function updateStats() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    linesEl.textContent = lines;
    levelEl.textContent = level;
  }

  function collides(cells, offX, offY) {
    for (const [cx, cy] of cells) {
      const x = cx + offX;
      const y = cy + offY;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && grid[y][x]) return true;
    }
    return false;
  }

  function merge() {
    for (const [cx, cy] of current.cells) {
      const x = cx + current.x;
      const y = cy + current.y;
      if (y >= 0) grid[y][x] = current.key;
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every((cell) => cell !== null)) {
        grid.splice(y, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        y++; // re-check same index after shift
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * level;
      score += points;
      lines += cleared;
      const newLevel = Math.floor(lines / 10) + 1;
      if (newLevel !== level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 80);
      }
      updateStats();
    }
  }

  function spawnNext() {
    current = next;
    current.x = 3;
    current.y = -1;
    next = makePiece(nextPieceKey());
    if (collides(current.cells, current.x, current.y)) {
      endGame();
    }
  }

  function lockPiece() {
    merge();
    clearLines();
    spawnNext();
    holdUsed = false;
  }

  function move(dx) {
    if (!collides(current.cells, current.x + dx, current.y)) {
      current.x += dx;
    }
  }

  function softDrop() {
    if (!collides(current.cells, current.x, current.y + 1)) {
      current.y += 1;
      score += 1;
      updateStats();
    } else {
      lockPiece();
    }
    dropCounter = 0;
  }

  function hardDrop() {
    let dist = 0;
    while (!collides(current.cells, current.x, current.y + 1)) {
      current.y += 1;
      dist++;
    }
    score += dist * 2;
    updateStats();
    lockPiece();
    dropCounter = 0;
  }

  function holdPiece() {
    if (holdUsed) return;
    holdUsed = true;
    const heldKey = current.key;
    if (held === null) {
      held = heldKey;
      spawnNext();
    } else {
      const swapped = held;
      held = heldKey;
      current = makePiece(swapped);
      if (collides(current.cells, current.x, current.y)) {
        endGame();
      }
    }
  }

  function rotate() {
    if (current.key === "O") return;
    const rotated = rotateCells(current.cells);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(rotated, current.x + k, current.y)) {
        current.cells = rotated;
        current.x += k;
        return;
      }
    }
  }

  function drawCell(context, x, y, color, cellSize) {
    context.fillStyle = color;
    context.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    context.strokeStyle = "rgba(255,255,255,0.15)";
    context.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 2, cellSize - 2);
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, board.width, board.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = grid[y][x];
        if (cell) drawCell(ctx, x, y, COLORS[cell], CELL);
      }
    }

    if (!gameOver) {
      for (const [cx, cy] of current.cells) {
        const x = cx + current.x;
        const y = cy + current.y;
        if (y >= 0) drawCell(ctx, x, y, COLORS[current.key], CELL);
      }
    }

    nextCtx.fillStyle = "#000";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const nCell = nextCanvas.width / 4;
    for (const [cx, cy] of next.cells) {
      drawCell(nextCtx, cx, cy, COLORS[next.key], nCell);
    }

    holdCtx.fillStyle = "#000";
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (held) {
      const hCell = holdCanvas.width / 4;
      const color = holdUsed ? shade(COLORS[held]) : COLORS[held];
      for (const [cx, cy] of SHAPES[held]) {
        drawCell(holdCtx, cx, cy, color, hCell);
      }
    }
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgb(${r * 0.45 | 0}, ${g * 0.45 | 0}, ${b * 0.45 | 0})`;
  }

  function update(time = 0) {
    if (!running || paused || gameOver) return;
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      softDrop();
    }
    draw();
    rafId = requestAnimationFrame(update);
  }

  function endGame() {
    gameOver = true;
    running = false;
    const isNewBest = score > best;
    if (isNewBest) {
      best = score;
      saveBest();
      updateStats();
    }
    showOverlay(`Game Over\nScore: ${score}${isNewBest ? "\nNew best!" : ""}\nPress Start to retry`);
  }

  function showOverlay(text) {
    overlayText.textContent = text;
    overlayText.style.whiteSpace = "pre-line";
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    resetState();
    running = true;
    paused = false;
    lastTime = 0;
    hideOverlay();
    startBtn.textContent = "Restart";
    draw();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    if (paused) {
      showOverlay("Paused");
    } else {
      hideOverlay();
      lastTime = performance.now();
      rafId = requestAnimationFrame(update);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") {
      togglePause();
      return;
    }
    if (!running || paused || gameOver) return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        move(-1);
        draw();
        break;
      case "ArrowRight":
        e.preventDefault();
        move(1);
        draw();
        break;
      case "ArrowDown":
        e.preventDefault();
        softDrop();
        draw();
        break;
      case "ArrowUp":
        e.preventDefault();
        rotate();
        draw();
        break;
      case " ":
        e.preventDefault();
        hardDrop();
        draw();
        break;
      case "c":
      case "C":
      case "Shift":
        e.preventDefault();
        holdPiece();
        draw();
        break;
    }
  });

  startBtn.addEventListener("click", startGame);

  function bindTouch(id, action) {
    const el = document.getElementById(id);
    el.addEventListener(
      "touchstart",
      (e) => {
        if (e.cancelable) e.preventDefault();
        if (!running || paused || gameOver) return;
        action();
        draw();
      },
      { passive: false }
    );
    el.addEventListener("click", () => {
      if (!running || paused || gameOver) return;
      action();
      draw();
    });
  }

  bindTouch("tLeft", () => move(-1));
  bindTouch("tRight", () => move(1));
  bindTouch("tRotate", rotate);
  bindTouch("tDown", softDrop);
  bindTouch("tDrop", hardDrop);
  bindTouch("tHold", holdPiece);

  // Initial idle state
  resetState();
  draw();
  showOverlay("Press Start");
})();
