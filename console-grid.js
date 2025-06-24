

const kCellSize = 16;

// Note that this console grid is slower and more functional than the Game of Life version (LifeConsoleGrid)
// To get high performance, use that class, or use this one under the following conditions:
// backgroundDots = false
// Use only drawSet() and eraseAll()

export class ConsoleGrid {
  constructor(params) {
    this.canvas = params.canvas;
    this.rowCount = params.rowCount || 20;
    this.colCount = params.colCount || 30;
    this.backgroundDots = params.backgroundDots;
    this.hasStatusLine = params.hasStatusLine !== false;

    this.width = this.colCount * kCellSize;
    this.height = this.rowCount * kCellSize;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // scales the context to map 1 CSS px to 1 device px
    const ctx = this.canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.font = `${kCellSize * 0.8}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.hasStatusLine) {
      let statusLineEl = document.querySelector('.vt100.status-line');
      if (!statusLineEl) {
        statusLineEl = document.createElement("div");
        statusLineEl.className = "vt100 status-line";
        this.canvas.insertAdjacentElement("afterend", statusLineEl);
      }
      statusLineEl.style.width = `${this.width - 4}px`;
      this.statusLineEl = statusLineEl;
    }

    this.ctx = ctx;
    this.eraseAll();
  }

  drawSet(set) {
    let livingCells = 0;
    const ctx = this.ctx;
    ctx.fillStyle = 'white';
    const inset = 1;
    const insetCellSize = kCellSize - inset * 2;

    for (let key of set) {
      livingCells++;
      const row = Math.floor(key / this.colCount);
      const col = key % this.colCount;
      const x = col * kCellSize;
      const y = row * kCellSize;
      ctx.fillRect(x + inset, y + inset, insetCellSize, insetCellSize);
    }
    return livingCells;
  }

  eraseAll() {
    const ctx = this.ctx;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.backgroundDots) {
      for (let r = 0; r < this.rowCount; r++) {
        for (let c = 0; c < this.colCount; c++) {
          this.drawCharAt(r, c, "\u00B7", "#FFFFFF4D")
        }
      }
    }
  }

  cellCenter(row, col) {
    const cx = col * kCellSize + kCellSize / 2;
    const cy = row * kCellSize + kCellSize / 2;
    return { cx, cy };
  }

  drawCharAt(row, col, char, color = "white") {
    const ctx = this.ctx;

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(col * kCellSize, row * kCellSize, kCellSize, kCellSize);

    const { cx, cy } = this.cellCenter(row, col);
    ctx.fillStyle = color;

    ctx.fillText(char, cx, cy);
  }

  eraseCharAt(row, col) {
    const x = col * kCellSize;
    const y = row * kCellSize;
    this.ctx.clearRect(x, y, kCellSize, kCellSize);

    if (this.backgroundDots) {
      this.drawCharAt(row, col, "\u00B7", "#FFFFFF4D")
    }
  }

  setStatusLine(text) {
    if (this.hasStatusLine) {
      this.statusLineEl.innerText = text;
    }
  }
}


export class Cout {
  constructor(element) {
    this.element = element;
  }

  writeLine(line, append = false) {
    if (!this.element) return;
    if (append) {
      this.element.innerHTML += line + "<br>";
      this.element.scrollTop = this.element.scrollHeight;
    } else {
      this.element.innerHTML = line + "<br>";
    }
  }
}