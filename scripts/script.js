function Cell(game, row, col, $element) {
  this.game = game;
  this.row = row;
  this.col = col;
  this.element = $element;
  this.marker = "";
}
Cell.prototype = {
  constructor: Cell,
  setMarker: function(mark) {
    this.marker = mark;
    this.element.text(this.marker);
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
  }
};

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
    return cell.marker === "";
  },
  activateCell: function(row, col) {
    if (this.curPlayer.controller.type === "Human") {
      this.move(this.board.getCell(row, col));
    }
  },
  togglePlayer() {
    this.curPlayer = (this.curPlayer === this.p1) ? this.p2 : this.p1;
    this.curPlayer.controller.takeTurn();
  },
  move: function(cell) {
    if (this.isValidMove(cell)) {
      cell.setMarker(this.curPlayer.marker);
      this.togglePlayer();
    }
  }
};


//*********************************************************************
//* Run code when page is ready
//*********************************************************************
$(document).ready(function() {
  var game = new Game($(".board-container"), $(".display-container"));

  $(".board-container").on("click", ".cell", function() {
    game.activateCell($(this).data("row"), $(this).data("col"));
  })
});
