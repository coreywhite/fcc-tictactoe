function Cell(row, col, $element) {
  this.row = row;
  this.col = col;
  this.element = $element;
  this.symbol = "";
  this.Select = function() {
    this.element.toggleClass("white");
  }
}

function Grid(size, $container) {
  this.size = size;
  this.container = $container;
  this.cells = [];
  //Initialize the cells array and render the grid
  for (var i = 0; i < this.size; i++) {
    this.cells[i] = [];
    var $row = $("<div />", {
      class: "row",
      "data-row": i
    });
    for (var j = 0; j < this.size; j++) {
      this.cells[i][j] = new Cell(i, j, $("<div />", {
        class: "cell",
        "data-row": i,
        "data-col": j
      }));
      $row.append(this.cells[i][j].element);
    }
    this.container.append($row);
  }
}

Grid.prototype.GetCell= function(row, col) {
  return this.cells[row][col];
};

//*********************************************************************
//* Run code when page is ready
//*********************************************************************
$(document).ready(function() {
  var board = new Grid(3, $(".board-container"));
  $(".board-container").on("click", ".cell", function() {
    //alert("Row: " + $(this).data("row") + " Col: " + $(this).data("col"));
    var cell = board.GetCell($(this).data("row"), $(this).data("col")).Select();

  })
});
