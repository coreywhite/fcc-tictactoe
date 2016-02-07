function Cell(game, row, col, $element) {
  this.game = game;
  this.row = row;
  this.col = col;
  this.element = $element;
  this.marker = "";
}

Cell.prototype.SetMarker = function(mark) {
  this.marker = mark;
  this.element.text(this.marker);
}

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

Grid.prototype.GetCell = function(row, col) {
  return this.cells[row][col];
};

function Player(name, marker, controller) {
  this.name = name;
  this.marker = marker;
  this.controller = controller;
}


function Game($boardContainer, $playerContainer) {
  this.board = new Grid(this, 3, $boardContainer);
  this.p1 = new Player("Player 1", "X", "Human");
  this.p2 = new Player("Player 2", "O", "Human");
  this.curPlayer = this.p1;
}

Game.prototype.Move = function(row, col) {
  var cell = this.board.GetCell(row, col);
  if (cell.marker === "") {
      cell.SetMarker(this.curPlayer.marker);
      this.curPlayer = (this.curPlayer === this.p1) ? this.p2 : this.p1;
  }
};




//*********************************************************************
//* Run code when page is ready
//*********************************************************************
$(document).ready(function() {
  var game = new Game($(".board-container"));

  $(".board-container").on("click", ".cell", function() {
    game.Move($(this).data("row"), $(this).data("col"));
  })
});
