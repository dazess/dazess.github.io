(() => {
  'use strict';
  const SIZE = 6;
  const STORAGE_KEY = 'rcf-fruit-box-best';
  const board = document.getElementById('fruit-board');
  const game = document.querySelector('.fruit-game');
  const start = document.getElementById('game-start');
  const reset = document.getElementById('game-reset');
  const scoreDisplay = document.getElementById('score');
  const bestDisplay = document.getElementById('best');
  const stateDisplay = document.getElementById('game-state');
  const totalDisplay = document.getElementById('selection-total');
  const message = document.getElementById('game-message');
  const apple = '<svg class="apple-shape" viewBox="0 0 48 52" aria-hidden="true"><path class="apple-body" d="M24 15C9 6 2 19 6 33c2 10 8 16 13 15 3-1 7-1 10 0 5 1 11-5 13-15 4-14-3-27-18-18Z"/><path class="apple-stem" d="M24 16c-1-6 1-10 4-12"/><path class="apple-leaf" d="M26 9C30 2 37 3 38 3c-1 6-6 9-12 6Z"/></svg>';
  const selectionBox = document.createElement('span');
  selectionBox.className = 'fruit-selection';
  selectionBox.setAttribute('aria-hidden', 'true');
  let values = [], cells = [];
  let state = 'idle', score = 0, best = 0;
  let anchor = null, corner = null, pointer = null;
  let focusIndex = 0;
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved)) best = Math.min(SIZE * SIZE, Math.max(0, Math.floor(saved)));
  } catch { /* Persistence is optional. */ }
  bestDisplay.textContent = String(best);

  function makeBoard() {
    values = Array.from({ length: SIZE * SIZE }, () => 1 + Math.floor(Math.random() * 9));
    // Every fresh board offers at least one valid rectangle.
    values[0] = 1 + Math.floor(Math.random() * 9);
    values[1] = 10 - values[0];
    board.replaceChildren();
    cells = values.map((value, index) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'fruit-cell';
      cell.dataset.index = String(index);
      cell.innerHTML = `${apple}<span class="fruit-number">${value}</span>`;
      cell.tabIndex = index === 0 ? 0 : -1;
      board.append(cell);
      return cell;
    });
    board.append(selectionBox);
    focusIndex = 0;
    refreshCells();
  }

  function refreshCells() {
    cells.forEach((cell, index) => {
      const value = values[index];
      cell.disabled = state !== 'running';
      cell.classList.toggle('empty', value === null);
      cell.dataset.value = value === null ? '' : String(value);
      cell.querySelector('.fruit-number').textContent = value === null ? '' : String(value);
      cell.setAttribute('aria-label', `Row ${Math.floor(index / SIZE) + 1}, column ${index % SIZE + 1}: ${value === null ? 'empty' : `apple ${value}`}`);
    });
  }

  function selectedIndices(from = anchor, to = corner) {
    if (from === null || to === null) return [];
    const top = Math.min(Math.floor(from / SIZE), Math.floor(to / SIZE));
    const bottom = Math.max(Math.floor(from / SIZE), Math.floor(to / SIZE));
    const left = Math.min(from % SIZE, to % SIZE), right = Math.max(from % SIZE, to % SIZE);
    const indices = [];
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) indices.push(row * SIZE + col);
    }
    return indices;
  }

  function showSelection() {
    const indices = selectedIndices();
    const sum = indices.reduce((total, index) => total + (values[index] || 0), 0);
    totalDisplay.textContent = String(sum);
    totalDisplay.classList.toggle('valid-total', sum === 10);
    const selected = new Set(indices);
    cells.forEach((cell, index) => {
      cell.classList.toggle('selected', selected.has(index));
      cell.setAttribute('aria-pressed', String(selected.has(index)));
    });
    selectionBox.classList.toggle('valid', sum === 10);
    selectionBox.hidden = indices.length === 0;
    if (!indices.length) return;
    const first = cells[indices[0]].getBoundingClientRect();
    const last = cells[indices[indices.length - 1]].getBoundingClientRect();
    const bounds = board.getBoundingClientRect();
    Object.assign(selectionBox.style, {
      left: `${first.left - bounds.left}px`, top: `${first.top - bounds.top}px`,
      width: `${last.right - first.left}px`, height: `${last.bottom - first.top}px`
    });
  }

  function cancelSelection() {
    const activePointer = pointer;
    pointer = null;
    if (activePointer && board.hasPointerCapture(activePointer.id)) board.releasePointerCapture(activePointer.id);
    anchor = null;
    corner = null;
    showSelection();
  }

  function hasMove() {
    // Cleared apples leave gaps. Rectangles can span those empty positions.
    for (let top = 0; top < SIZE; top++) {
      const columns = Array(SIZE).fill(0);
      for (let bottom = top; bottom < SIZE; bottom++) {
        for (let col = 0; col < SIZE; col++) columns[col] += values[bottom * SIZE + col] || 0;
        for (let left = 0; left < SIZE; left++) {
          let sum = 0;
          for (let right = left; right < SIZE; right++) {
            sum += columns[right];
            if (sum === 10) return true;
            if (sum > 10) break;
          }
        }
      }
    }
    return false;
  }

  function saveBest() {
    if (score <= best) return;
    best = score;
    bestDisplay.textContent = String(best);
    try { localStorage.setItem(STORAGE_KEY, String(best)); } catch { /* Optional storage. */ }
  }

  function finish(reason) {
    state = 'finished';
    cancelSelection();
    const focusWasOnBoard = board.contains(document.activeElement);
    refreshCells();
    if (focusWasOnBoard) start.focus({ preventScroll: true });
    saveBest();
    game.classList.toggle('won', reason === 'cleared');
    stateDisplay.textContent = reason === 'cleared' ? 'Board cleared' : 'No moves left';
    message.textContent = reason === 'cleared' ? `All ${SIZE * SIZE} apples cleared. Final score: ${score}.` : `No rectangles total 10. Final score: ${score}. Start a new game to continue.`;
    start.textContent = 'Play again';
    start.disabled = false;
    reset.disabled = false;
  }

  function commitSelection() {
    if (state !== 'running') return;
    const selected = selectedIndices().filter(index => values[index] !== null);
    const sum = selected.reduce((total, index) => total + values[index], 0);
    if (sum === 10 && selected.length) {
      selected.forEach(index => { values[index] = null; });
      score += selected.length;
      scoreDisplay.textContent = String(score);
      saveBest();
      message.textContent = `${selected.length} apples cleared. Score: ${score}.`;
      cancelSelection();
      refreshCells();
      if (values.every(value => value === null)) finish('cleared');
      else if (!hasMove()) finish('no-moves');
    } else {
      message.textContent = `Selection total: ${sum}. Select a rectangle that totals 10.`;
      cancelSelection();
    }
  }

  function setCorner(index, announce = false) {
    if (anchor === null) {
      anchor = index;
      corner = index;
      showSelection();
      if (announce) message.textContent = `First corner set. Selection total: ${totalDisplay.textContent}. Move to the opposite corner and press Space.`;
    } else {
      corner = index;
      commitSelection();
    }
  }

  function pointIndex(x, y) {
    const first = cells[0].getBoundingClientRect(), second = cells[1].getBoundingClientRect();
    const nextRow = cells[SIZE].getBoundingClientRect();
    const col = Math.max(0, Math.min(SIZE - 1, Math.floor((x - first.left) / (second.left - first.left))));
    const row = Math.max(0, Math.min(SIZE - 1, Math.floor((y - first.top) / (nextRow.top - first.top))));
    return row * SIZE + col;
  }

  board.addEventListener('pointerdown', event => {
    if (state !== 'running' || !event.isPrimary || event.button !== 0 || pointer) return;
    event.preventDefault();
    const index = pointIndex(event.clientX, event.clientY);
    pointer = { id: event.pointerId, origin: index, hadAnchor: anchor !== null, moved: false };
    if (anchor === null) anchor = index;
    corner = index;
    board.setPointerCapture(event.pointerId);
    showSelection();
  });
  board.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId || state !== 'running') return;
    corner = pointIndex(event.clientX, event.clientY);
    if (corner !== pointer.origin) pointer.moved = true;
    showSelection();
  });
  board.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId || state !== 'running') return;
    const completed = pointer;
    corner = pointIndex(event.clientX, event.clientY);
    pointer = null;
    if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
    if (completed.moved || completed.hadAnchor || corner !== completed.origin) commitSelection();
    else message.textContent = 'First corner set. Select the opposite corner, or drag a rectangle.';
  });
  board.addEventListener('pointercancel', cancelSelection);
  board.addEventListener('lostpointercapture', () => { if (pointer) cancelSelection(); });
  board.addEventListener('click', event => {
    // Assistive-technology activation has no pointer sequence.
    if (event.detail !== 0 || state !== 'running') return;
    const cell = event.target.closest('.fruit-cell');
    if (cell) setCorner(Number(cell.dataset.index), true);
  });
  board.addEventListener('keydown', event => {
    if (state !== 'running' || event.altKey || event.ctrlKey || event.metaKey) return;
    const cell = event.target.closest('.fruit-cell');
    if (!cell) return;
    focusIndex = Number(cell.dataset.index);
    let next = focusIndex;
    if (event.key === 'ArrowLeft') next = focusIndex % SIZE === 0 ? focusIndex : focusIndex - 1;
    else if (event.key === 'ArrowRight') next = focusIndex % SIZE === SIZE - 1 ? focusIndex : focusIndex + 1;
    else if (event.key === 'ArrowUp') next = Math.max(0, focusIndex - SIZE);
    else if (event.key === 'ArrowDown') next = Math.min(SIZE * SIZE - 1, focusIndex + SIZE);
    else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) setCorner(focusIndex, true);
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelSelection();
      message.textContent = 'Selection cancelled.';
      return;
    } else return;
    event.preventDefault();
    cells[focusIndex].tabIndex = -1;
    focusIndex = next;
    cells[focusIndex].tabIndex = 0;
    cells[focusIndex].focus({ preventScroll: true });
    if (anchor !== null) {
      corner = focusIndex;
      showSelection();
      message.textContent = `Selection total: ${totalDisplay.textContent}. Press Space to confirm, or Escape to cancel.`;
    }
  });

  function begin() {
    state = 'running';
    score = 0;
    scoreDisplay.textContent = '0';
    game.classList.remove('won');
    makeBoard();
    cancelSelection();
    refreshCells();
    stateDisplay.textContent = 'Playing';
    start.textContent = 'Game in progress';
    start.disabled = true;
    reset.disabled = false;
    message.textContent = 'Select a rectangle of apples totaling 10.';
  }
  start.addEventListener('click', begin);
  reset.addEventListener('click', () => {
    state = 'idle';
    score = 0;
    cancelSelection();
    makeBoard();
    game.classList.remove('won');
    scoreDisplay.textContent = '0';
    stateDisplay.textContent = 'Ready to play';
    message.textContent = 'New board ready. Select Start game to begin.';
    start.textContent = 'Start game';
    start.disabled = false;
    reset.disabled = true;
    start.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelSelection(); });
  new ResizeObserver(() => { if (anchor !== null) showSelection(); }).observe(board);
  makeBoard();
  cancelSelection();
})();
