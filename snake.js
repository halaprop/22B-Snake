import { ConsoleGrid, Cout } from "./console-grid.js";

export class SnakeApp {
  constructor() {
    const gridParams = {
      canvas: document.getElementById("main-canvas"),
      rowCount: 20,
      colCount: 30,
      backgroundDots: true
    };
    this.sleepTimeout = 100;
    this.grid = new ConsoleGrid(gridParams);
    const coutEl = document.getElementById('cout-lines');
    this.cout = new Cout(coutEl);

    this.turnCount = 0;
    this.gameOver = false;

    this.snake = new Snake();
    this.snake.drawChars(this.grid);
    this.candy = Candy.randomCandy(this.snake, this.grid.rowCount, this.grid.colCount);
    this.candy.draw(this.grid);
    this.grid.setStatusLine(this.statusString());
  }

  metric() {
    const turnCount = this.turnCount;
    const length = this.snake.length();
    return turnCount == 0 ? 0 : 1.0 * length * length / turnCount;
  }

  statusString(status) {
    let result = `Length: ${this.snake.length()} Turns: ${this.turnCount}. Metric: ${this.metric().toFixed(3)}`;
    if (status) result += `. ${status}`;
    return result;
  }

  keydown(key) {
    let status = '';

    switch (key) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        this.snake.steer(key, this.grid, this.candy.row, this.candy.col);
        break;
      case 'Q':
      case 'q':
        this.gameOver = true;
      default: break;
    }

    if (!this.gameOver) {
      if (this.snake.willCrash(this.grid)) {
        this.gameOver = true;
        status = 'Ouch, my nose!';
      } else {
        this.snake.step(this.grid);
        if (this.snake.headIntersects(this.candy.row, this.candy.col)) {
          this.snake.eat(this.candy.calories);
          this.snake.color = this.candy.color;
          this.snake.drawChars(this.grid);

          this.candy = Candy.randomCandy(this.snake, this.grid.rowCount, this.grid.colCount);
          this.candy.draw(this.grid);
        }
      }
      this.turnCount++;
      this.grid.setStatusLine(this.statusString(status));
    }
    this.grid.setStatusLine(this.statusString(status));
  }

}

class ListNode {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  pushFront(value) {
    this.head = new ListNode(value, this.head);
  }

  popFront() {
    if (this.head) {
      this.head = this.head.next;
    }
  }

  pushBack(value) {
    const tail = this.tail();
    const newNode = new ListNode(value);
    if (tail) {
      tail.next = newNode;
    } else {
      this.head = newNode;
    }
  }

  popBack() {
    const tail = this.tail();
    if (tail) {
      if (this.head == tail) {
        this.head = null;
      } else {
        let node = this.head;
        while (node.next != tail) node = node.next;
        node.next = null;
      }
    }
  }

  tail() {
    let prevNode = null;
    for (let node = this.head; node; node = node.next) {
      prevNode = node;
    }
    return prevNode;
  }

  length() {
    let result = 0;
    for (let node = this.head; node; node = node.next) {
      result++;
    }
    return result;
  }
}

class Snake extends LinkedList {
  constructor() {
    super();
    this.calories = 0;
    this.color = 'white';
    this.glyph = 'o';
    this.headGlyph = '@';
    this.dRow = 0;
    this.dCol = 1;

    this.pushBack({ row: 5, col: 5 });
    this.pushBack({ row: 5, col: 4 });
    this.pushBack({ row: 5, col: 3 });
  }

  willCrash(grid) {
    const nextRow = this.head.value.row + this.dRow;
    const nextCol = this.head.value.col + this.dCol;

    const inBounds = nextRow >= 0 && nextRow < grid.rowCount && nextCol >= 0 && nextCol < grid.colCount;
    return !inBounds || this.intersects(nextRow, nextCol);
  }

  headIntersects(row, col) {
    return this.head.value.row == row && this.head.value.col == col;
  }

  intersects(row, col) {
    let result = false;
    let node = this.head;
    while (node) {
      if (node.value.row == row && node.value.col == col) {
        result = true;
        break;
      }
      node = node.next;
    }
    return result;
  }

  drawChars(grid) {
    let glyph = this.headGlyph;
    for (let node = this.head; node; node = node.next) {
      grid.drawCharAt(node.value.row, node.value.col, glyph, this.color);
      glyph = this.glyph;
    }
  }

  steer(key, grid, candyRow, candyCol) {
    this.dRow = 0;
    this.dCol = 0;
    switch (key) {
      case "ArrowLeft":
        this.dCol = -1;
        break;
      case "ArrowRight":
        this.dCol = 1;
        break;
      case "ArrowUp":
        this.dRow = -1;
        break;
      case "ArrowDown":
        this.dRow = 1;
        break;
      default: break;
    }
  }

  step(grid) {
    let nextRow = this.head.value.row + this.dRow;
    let nextCol = this.head.value.col + this.dCol;
    grid.drawCharAt(this.head.value.row, this.head.value.col, this.glyph, this.color);
    this.pushFront({ row: nextRow, col: nextCol });
    grid.drawCharAt(nextRow, nextCol, this.headGlyph, this.color);
    if (this.calories > 0) {
      this.calories--;
    } else {
      const tail = this.tail();
      grid.eraseCharAt(tail.value.row, tail.value.col);
      this.popBack();
    }
  }

  eat(calories) {
    this.calories += calories;
  }

}

class Candy {
  constructor(params) {
    Object.assign(this, params);
  }

  static randomCandy(snake, rowCount, colCount) {
    const { row, col } = this.randomPosition(snake, rowCount, colCount);
    const color = this.randomColor();
    const calories = Random.randBetween(1, 10);
    const glyph = `${calories}`;
    return new Candy({ row, col, calories, glyph, color });
  }

  static randomPosition(snake, rowCount, colCount) {
    let row, col;
    do {
      row = Random.randBetween(0, rowCount);
      col = Random.randBetween(0, colCount);
    } while (snake.intersects(row, col));
    return { row, col };
  }

  static randomColor() {
    //const colors = ['red', 'green', 'blue', 'yellow']
    const colors = ['red', 'lime', 'yellow', 'cyan', 'magenta', 'orange', 'pink']
    return colors[Random.randBetween(0, colors.length)];
  }

  draw(grid) {
    grid.drawCharAt(this.row, this.col, this.glyph, this.color);
  }
}

/* Implementation of rand() from ANSI C as per wikipedia's article on Linear Congruential Generators

https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use

modulus = 2**31 = 2147483648
multiplier = 1103515245
increment = 12345
bits returned 30..16, 15 bits means RAND_MAX = 32767

n = (n * multiplier + increment) % 2147483648
*/

class RandANSI {
  constructor(seed = 1) {
    this.seed = seed;
  }

  setSeed(seed) {
    this.seed = seed;
  }

  rand() {
    return ((this.seed = Number((BigInt(this.seed) * 1103515245n + 12345n) % 2147483648n)) >> 16) & 0x7FFF;
  }

  randBetween(min, max) {
    return min + this.rand() % (max - min);
  }
}

const Random = new RandANSI();