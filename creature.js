import { ConsoleGrid, Cout } from "./console-grid.js";

export class CreaturesApp {
  static kInitialPlayerCalories = 120;
  static kCaloriesConsumedPerMove = 5;

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

    this.playerRow = 5;
    this.playerCol = 5;
    this.playerCalories = CreaturesApp.kInitialPlayerCalories;
    this.turnCount = 0;
    this.gameOver = false;

    this.creatureList = new CreatureList();
    this.creatureList.addCreaturesFromFile();

    this.creatureList.draw(this.grid);
    this.grid.drawCharAt(this.playerRow, this.playerCol, '@', 'white');
    this.grid.setStatusLine(this.statusString(this.playerCalories, ''));
    this.cout.writeLine(this.creatureList.toString());
  }

  statusString(calories, status) {
    return `Turn ${this.turnCount}. Player has ${calories} cals. ${status}`;
  }

  keydown(key) {
    if (this.gameOver) return;
    
    let playerMoved = false;
    let status = '';

    this.creatureList.erase(this.grid);
    this.grid.eraseCharAt(this.playerRow, this.playerCol);

    switch (key) {
      case "ArrowUp":
        if (this.playerRow > 0) {
          playerMoved = true;
          this.playerRow--;
        }
        break;
      case "ArrowDown":
        if (this.playerRow + 1 < this.grid.rowCount) {
          playerMoved = true;
          this.playerRow++;
        }
        break;
      case "ArrowLeft":
        if (this.playerCol > 0) {
          playerMoved = true;
          this.playerCol--;
        }
        break;
      case "ArrowRight":
        if (this.playerCol + 1 < this.grid.colCount) {
          playerMoved = true;
          this.playerCol++;
        }
        break;
      case 'Q':
      case 'q':
        this.gameOver = true;
        break;
      default: break;
    }

    if (!this.gameOver) {
      if (playerMoved) {
        this.playerCalories -= CreaturesApp.kCaloriesConsumedPerMove;
      }

      this.creatureList.takeTurns(this.grid.rowCount, this.grid.colCount);
      let creatureToEat = this.creatureList.creatureAtPosition(this.playerRow, this.playerCol);
      if (creatureToEat) {
        status = "Ate the " + creatureToEat.name;
        this.playerCalories += creatureToEat.calories;
        this.creatureList.removeCreature(creatureToEat);
        if (this.creatureList.creatureCount() == 0) {
          status = "Having eaten everything, player wins!";
          this.gameOver = true;
        }
      }

      if (this.playerCalories <= 0) {
        status = "Having starved, player dies.";
        this.gameOver = true;
      }
      this.turnCount++;
    }

    this.creatureList.draw(this.grid);
    this.grid.drawCharAt(this.playerRow, this.playerCol, '@', 'white');
    this.grid.setStatusLine(this.statusString(this.playerCalories, status));
    this.cout.writeLine(this.creatureList.toString());
  }
}


class Creature {
  // creature info has name, glyph, row, col, dRow, dCol, calories
  constructor(creatureInfo) {
    Object.assign(this, creatureInfo);
    this.initialCalories = this.calories;
  }

  static kCaloriesConsumedPerMove = 5;
  static kCaloriesGainedPerMeal = 60;
  static kCaloriesGainedPerRest = 5;

  positionEquals(row, col) {
    return this.row == row && this.col == col;
  }

  takeTurn(rowCount, colCount) {
    if (this.resting) {
      this.rest();
    } else {
      this.move(rowCount, colCount);
    }
  }

  move(rowCount, colCount) {
    let candidateRow = this.row + this.dRow;
    if (candidateRow < 0 || candidateRow >= rowCount) {
      this.dRow *= -1;
      candidateRow = this.row + this.dRow;
    }
    let candidateCol = this.col + this.dCol;
    if (candidateCol < 0 || candidateCol >= colCount) {
      this.dCol *= -1;
      candidateCol = this.col + this.dCol;
    }
    if (this.row != candidateRow || this.col != candidateCol) {
      this.row = candidateRow;
      this.col = candidateCol;
      this.calories -= Creature.kCaloriesConsumedPerMove;
      if (this.calories <= 0) {
        this.resting = true;
      }
    }
  }

  rest() {
    this.calories += Creature.kCaloriesGainedPerRest;
    if (this.calories > 0.75 * this.initialCalories) {
      this.resting = false;
    }
  }

  draw(grid) {
    grid.drawCharAt(this.row, this.col, this.glyph, this.color);
  }

  erase(grid) {
    grid.eraseCharAt(this.row, this.col);
  }

  toString() {
    return `${this.name.padEnd(10)} (${this.glyph}) ${this.calories.toString().padStart(4)}`;
  }

}

class CreatureList {
  constructor() {
  }

  // for now, we'll use a literal array
  addCreaturesFromFile() {
    // note that this differs from student projects in that random colors are assigned here:
    const creaturesInfo = [
      { name: "Mouse", glyph: "M", row: 5, col: 2, dRow: 1, dCol: 1, calories: 90, color: "aqua" },
      { name: "Rabbit", glyph: "R", row: 8, col: 27, dRow: 1, dCol: -1, calories: 110, color: "green" },
      { name: "Boar", glyph: "B", row: 18, col: 18, dRow: -1, dCol: 0, calories: 240, color: "yellow" },
      { name: "Squirrel", glyph: "S", row: 9, col: 4, dRow: -1, dCol: -1, calories: 100, color: "violet" },
      { name: "Deer", glyph: "D", row: 12, col: 15, dRow: 1, dCol: 0, calories: 350, color: "magenta" },
      { name: "Fox", glyph: "F", row: 6, col: 19, dRow: -1, dCol: 1, calories: 150, color: "orange" },
      { name: "Raccoon", glyph: "C", row: 10, col: 7, dRow: 0, dCol: 1, calories: 120, color: "crimson" },
      { name: "Owl", glyph: "O", row: 3, col: 25, dRow: 1, dCol: -1, calories: 140, color: "deepskyblue" },
      { name: "Hedgehog", glyph: "H", row: 15, col: 10, dRow: -1, dCol: 1, calories: 70, color: "chartreuse" },
      { name: "Badger", glyph: "A", row: 7, col: 12, dRow: 1, dCol: 1, calories: 180, color: "gold" },
      { name: "Porcupine", glyph: "P", row: 18, col: 5, dRow: 0, dCol: -1, calories: 130, color: "tomato" },
      { name: "Skunk", glyph: "K", row: 14, col: 23, dRow: 1, dCol: 0, calories: 100, color: "cyan" },
      { name: "Lynx", glyph: "L", row: 4, col: 8, dRow: -1, dCol: 0, calories: 210, color: "dodgerblue" },
      { name: "Falcon", glyph: "N", row: 1, col: 29, dRow: 0, dCol: 1, calories: 160, color: "orangered" }
    ];
    this.creatures = creaturesInfo.map(info => new Creature(info));
  }

  draw(grid) {
    this.creatures.forEach(creature => creature.draw(grid));
  }

  erase(grid) {
    this.creatures.forEach(creature => creature.erase(grid));
  }

  takeTurns(rowCount, colCount) {
    this.creatures.forEach(creature => creature.takeTurn(rowCount, colCount));
  }

  creatureAtPosition(row, col) {
    return this.creatures.find(creature => creature.positionEquals(row, col));
  }

  removeCreature(creature) {
    this.creatures = this.creatures.filter(c => c != creature);
  }

  creatureCount() {
    return this.creatures.length;
  }

  toString() {
    return this.creatures.map(c => c.toString()).join('<br>')
  }
}
