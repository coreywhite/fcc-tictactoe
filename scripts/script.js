function Cell($element) {
  this.element = $element;
  this.symbol = "";
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
      this.cells[i][j] = new Cell($("<div />", {
        class: "cell",
        "data-row": i,
        "data-col": j,
      }));
      $row.append(this.cells[i][j].element);
    }
    this.container.append($row);
  }
}

//*********************************************************************
//* Run code when page is ready
//*********************************************************************
$(document).ready(function() {
  var board = new Grid(3, $(".board-container"));
});
