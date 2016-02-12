/******************************************************************************
/* Object definitions for grid and cells
******************************************************************************/
function Cell(game, row, col, $element) {
  this.game = game;
  this.row = row;
  this.col = col;
  this.$element = $element;
  this.value = null;
}
Cell.prototype = {
  constructor: Cell,
  hasValue: function() {
    return this.value !== null;
  },
  setValue: function(mark) {
    this.value = mark;
    this.$element.text(this.value);
  }
};

function Grid(game, size, $container) {
  this.game = game;
  this.size = size;
  this.container = $container;
  this.cells = [];
  //Initialize the cells array and render the grid
  for (var i = 0; i < this.size; i++) {
    //Create row
    this.cells[i] = [];
    var $row = $("<div />", {
      class: "row",
      "data-row": i
    });
    //Fill columns with cells
    for (var j = 0; j < this.size; j++) {
      var $cell = $("<div />", {
        class: "cell",
        "data-row": i,
        "data-col": j
      });
      $row.append($cell);
      this.cells[i][j] = new Cell(this.game, i, j, $cell);
    }
    this.container.append($row);
  }
}
Grid.prototype = {
  constructor: Grid,
  getCell: function(row, col) {
    return this.cells[row][col];
  },
  getRow: function(i) {
    return this.cells[i];
  },
  getCol: function(i) {
    return this.cells.map(function(row, idx) {
      return row[i];
    });
  },
  getDiag: function(i) {
    //Valid diagonal indices are 0 (down-right) & 1 (up-right)
    return this.cells.map(function(row, idx) {
      return row[i === 0 ? idx : row.length - idx - 1];
    });
  },
  getMatchingSet: function() {
    //Return a row, column, or main diagonal for which all cells match
    function allMatch(arr) {
      var first = arr[0].value;
      return arr.every(function(el) {
        return first !== null && el.value === first;
      });
    }
    for (var i = 0; i < this.size; i++) {
      if (allMatch(this.getRow(i))) {
        return this.getRow(i);
      }
      if (allMatch(this.getCol(i))) {
        return this.getCol(i);
      }
      if ((i === 0 || i === 1) && allMatch(this.getDiag(i))) {
        return this.getDiag(i);
      }
    }
    return null;
  }
};

/******************************************************************************
/* Object defintions for Game, Player, and Controllers
******************************************************************************/

function Controller(game, type) {
  this.game = game;
  this.type = type;
  this.player = null;
}
Controller.prototype = {
  constructor: Controller,
  setPlayer: function(player) {
    this.player = player;
  },
  takeTurn: function() {
  }
};

function HumanController(game) {
  Controller.call(this, game, "Human");
}
HumanController.prototype = Object.create(Controller.prototype);
HumanController.prototype.constructor = HumanController;
HumanController.prototype.takeTurn = function() {
  this.game.display.message(this.player.name + "'s turn!");
};

function Player(name, marker, controller) {
  this.name = name;
  this.marker = marker;
  this.controller = controller;
  this.controller.setPlayer(this);
  this.score = 0;
}

function Display($displayContainer) {
  this.displayContainer = $displayContainer;
}
Display.prototype = {
  constructor: Display,
  message: function(msg) {
    this.displayContainer.find("#message").html(msg);
  }
};

function Game($boardContainer, $displayContainer) {
  this.board = new Grid(this, 3, $boardContainer);
  this.display = new Display($displayContainer);
  this.p1 = new Player("Player 1", "X", new HumanController(this));
  this.p2 = new Player("Player 2", "O", new HumanController(this));
  this.curPlayer = this.p1;
}
Game.prototype = {
  constructor: Game,
  isValidMove: function(cell) {
    return !cell.hasValue();
  },
  activateCell: function(row, col) {
    if (this.curPlayer && this.curPlayer.controller.type === "Human") {
      this.move(this.board.getCell(row, col));
    }
  },
  isWinner: function(player) {
    var match = this.board.getMatchingSet();
    return (Array.isArray(match) && match[0].value === player.marker);
  },
  togglePlayer: function() {
    this.curPlayer = (this.curPlayer === this.p1) ? this.p2 : this.p1;
    this.curPlayer.controller.takeTurn();
  },
  move: function(cell) {
    if (!this.isValidMove(cell)) {
      return false;
    }
    cell.setValue(this.curPlayer.marker);
    //Check for victory!
    if (this.isWinner(this.curPlayer)) {
      this.curPlayer.score++;
      this.display.message(this.curPlayer.name + " wins!");
      this.curPlayer = null;
    } else {
      this.togglePlayer();
    }
  }
};


/******************************************************************************
/* Run code when page is ready to instantiate objects and hook up the UI
******************************************************************************/
$(document).ready(function() {
  var game = new Game($(".board-container"), $(".display-container"));

  $(".board-container").on("click", ".cell", function() {
    game.activateCell($(this).data("row"), $(this).data("col"));
  })
});
