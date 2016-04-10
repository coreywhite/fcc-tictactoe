/******************************************************************************
/* Object definitions for grid and cells
******************************************************************************/

//A cell is an individual node in the grid. It can optionally be associated
//to a DOM element for display purposes.
function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.$element = null;
  this.value = null;
}
Cell.prototype = {
  constructor: Cell,
  hasValue: function() {
    return this.value !== null;
  },
  setValue: function(mark) {
    this.value = mark;
    if (this.$element) {
      this.$element.text(this.value);
    }
  },
  setDisplay: function($element) {
    this.$element = $element;
    this.$element.text(this.value);
  }
};

//A grid is a collection of cells arranged in a square of rows and columns.
function Grid(size) {
  this.size = size;
  this.cells = [];
  //Initialize the cells array and render the grid
  for (var i = 0; i < this.size; i++) {
    //Create row
    this.cells[i] = [];
    //Fill columns with cells
    for (var j = 0; j < this.size; j++) {
      this.cells[i][j] = new Cell(i, j);
    }
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
  getEmptyCells: function() {
    var emptyCells = [];
    for (var i = 0; i < this.cells.length; i++) {
      for (var j = 0; j < this.cells[i].length; j++) {
        if (!this.cells[i][j].hasValue()) {
          emptyCells.push(this.cells[i][j]);
        }
      }
    }
    return emptyCells;
  },
  getMatchingSet: function() {
    //Return a row, column, or main diagonal for which all cells match
    function allMatch(arr) {
      var first = arr[0];
      return arr.every(function(el) {
        return first.hasValue() && el.value === first.value;
      });
    }
    //Iterate over all rows, columns, and diagonals, returning the first
    //matching set encountered
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
  },
  clone: function() {
    //Create a deep clone of a grid, including clones of its cells
    var clone = new Grid(this.size);
    for (var i = 0; i < clone.cells.length; i++) {
      for (var j = 0; j < clone.cells[0].length; j++) {
        clone.cells[i][j].setValue(this.cells[i][j].value);
      }
    }
    return clone;
  },
  renderDisplay: function($displayContainer) {
    //Create DOM elements to display the grid
    this.$displayContainer = $displayContainer;
    for (var i = 0; i < this.cells.length; i++) {
      //Create row element
      var $row = $("<div />", {
        class: "row",
        "data-row": i
      });
      for (var j = 0; j < this.cells[0].length; j++) {
        //Fill columns with cells
        var $cell = $("<div />", {
          class: "cell",
          "data-row": i,
          "data-col": j
        });
        $row.append($cell);
        //Store a reference to the display in the grid cell
        this.cells[i][j].setDisplay($cell);
      }
      //Add the row to the DOM
      this.$displayContainer.append($row);
    }
  }
};


/******************************************************************************
/* Object definitions for Game, Player, and Controllers
******************************************************************************/

//A controller determines the behavior of a player and selects moves
function Controller(game, type, player) {
  this.game = game;
  this.type = type;
  this.player = player;
}
Controller.prototype = {
  constructor: Controller,
  takeTurn: function() {
  }
};

//The human controller waits for human input (grid clicks).
function HumanController(game, player) {
  Controller.call(this, game, "human", player);
}
HumanController.prototype = Object.create(Controller.prototype);
HumanController.prototype.constructor = HumanController;
HumanController.prototype.takeTurn = function() {
  this.game.display.setMessage(this.player.name + "'s turn!");
  return true;
};

//The easy controller plays randomly
function EasyController(game, player) {
  Controller.call(this, game, "easy", player);
}
EasyController.prototype = Object.create(Controller.prototype);
EasyController.prototype.constructor = EasyController;
EasyController.prototype.takeTurn = function() {
  var moves = this.game.board.getEmptyCells();
  if (moves.length > 0) {
    this.game.move(moves[Math.floor(Math.random()*moves.length)]);
    return true;
  }
};

//The "normal" controller attempts to win or block the opponent from winning,
//but only looks one move ahead.
function NormalController(game, player) {
  Controller.call(this, game, "normal", player);
}
NormalController.prototype = Object.create(Controller.prototype);
NormalController.prototype.constructor = NormalController;
NormalController.prototype.takeTurn = function() {
  var players = this.game.getPlayersById(this.player.id);
  var moves = this.game.board.getEmptyCells();
  //If it is possible to win this turn, do so:
  for (var i = 0; i < moves.length; i++) {
    var testBoard = this.game.board.clone();
    testBoard.getCell(moves[i].row, moves[i].col).setValue(players.player.marker);
    if (this.game.isWinner(testBoard, players.player)) {
      this.game.move(moves[i]);
      return true;
    }
  }
  //If the opponent will be able to win next turn, block them:
  for (var i = 0; i < moves.length; i++) {
    var testBoard = this.game.board.clone();
    testBoard.getCell(moves[i].row, moves[i].col).setValue(players.opponent.marker);
    if (this.game.isWinner(testBoard, players.opponent)) {
      this.game.move(moves[i]);
      return true;
    }
  }
  //Otherwise, move randomly:
  if (moves.length > 0) {
    this.game.move(moves[Math.floor(Math.random()*moves.length)]);
    return true;
  }
};

//The "hard" controller implements the Minimax algorithm to play perfectly
function HardController(game, player) {
  Controller.call(this, game, "hard", player);
}
HardController.prototype = Object.create(Controller.prototype);
HardController.prototype.constructor = HardController;
HardController.prototype.takeTurn = function() {
  var players = this.game.getPlayersById(this.player.id);
  this.move = null;
  //Call minimax, which will run recursively and set this.move to a value
  this.minimax(this.game.board.clone(), players, 0);
  //If successful, actually make the selected move
  if (this.move) {
    this.game.move(this.move);
  }
};
HardController.prototype.gradeBoard = function(board) {
  //Assign a "grade" to the board, returning 1 for a win, -1 for loss, and 0
  //for a draw. If the board is not in a terminal state, return null.
  var moves = board.getEmptyCells();
  if (this.game.isWinner(board, this.player)) {
    return 1;
  } else if (this.game.isWinner(board, this.player.getOpponent())) {
    return -1;
  } else if (moves.length === 0){
    return 0;
  } else {
    return null;
  }
};
HardController.prototype.minimax = function(board, players, depth) {
  //Minimax is a recursive algorithm that "grades" the boards resulting from all
  //possible moves. The current player seeks to maximize the grade, while the
  //opponent seeks to minimize it.
  //First, check if the game is complete and just return the grade if so:
  var grade = this.gradeBoard(board);
  if (grade !== null) {
    return {grade: grade, depth: depth};
  }
  //Otherwise, prepare to iterate over all available moves
  var moves = board.getEmptyCells();
  var grades = [];
  //Swap player and opponent for the next turn
  var nextPlayers = {player: players.opponent, opponent: players.player};
  for (var i = 0; i < moves.length; i++) {
    //Create a new board and take the current move
    var nextBoard = board.clone();
    var nextMove = nextBoard.getCell(moves[i].row, moves[i].col);
    nextMove.setValue(players.player.marker);
    //Recursively call minimax on the new state of the board
    grades.push(this.minimax(nextBoard, nextPlayers, depth + 1));
  }
  //Choose the "best" of the available moves based on their grades
  var bestMove = this.chooseGradedMove(moves, grades, players);
  //If we are currently grading the original (depth 0) board, store the move
  if (depth === 0) {
    this.move = this.game.board.getCell(bestMove.row, bestMove.col);
  }
  //Return the best grade and depth
  return {grade: bestMove.grade, depth: bestMove.depth};
};
HardController.prototype.chooseGradedMove = function(moves, grades, players){
  //The current player seeks to maximize the grade, whereas the opponent seeks
  //to minimize it. Both players seek to maximize depth (prolong the game).
  if (players.player === this.player) {
    var best = grades.reduce(function(prev, cur) {
      if (cur.grade > prev.grade || (cur.grade === prev.grade && cur.depth > prev.depth)) {
        return cur;
      } else {
        return prev;
      }
    });
  } else {
    var best = grades.reduce(function(prev, cur) {
      if (cur.grade < prev.grade || (cur.grade === prev.grade && cur.depth > prev.depth)) {
        return cur;
      } else {
        return prev;
      }
    });
  }
  //Randomly select one of the possible moves with the best grade and depth
  var possibleMoves = moves.filter(function(move, idx) {
    return grades[idx].grade === best.grade && grades[idx].depth === best.depth;
  });
  var move = possibleMoves[Math.floor(Math.random()*possibleMoves.length)];
  return {row: move.row, col: move.col, grade: best.grade, depth: best.depth};
};


//The Player object represents a player in the game (either human or AI)
function Player(game, id, name, marker, controllerType) {
  this.game = game;
  this.id = id;
  this.name = name;
  this.marker = marker;
  this.controller = null;
  this.setController(controllerType);
  this.score = 0;
}
Player.prototype = {
  constructor: Player,
  setMarker: function(marker) {
    if (this.marker !== marker) {
      this.marker = marker;
      return true;
    }
    return false;
  },
  setController: function(controllerType) {
    if (controllerType === "human") {
      this.controller = new HumanController(this.game, this);
    } else if (controllerType === "easy") {
      this.controller = new EasyController(this.game, this);
    } else if (controllerType === "normal") {
      this.controller = new NormalController(this.game, this);
    } else if (controllerType === "hard") {
      this.controller = new HardController(this.game, this);
    } else {
      this.controller = null;
    }
  },
  getOpponent: function() {
    return this.game.getPlayersById(this.id).opponent;
  }
}

//The Game object manages the game, owning player and board objects, along
//with a display handler to link between the game models and the GUI.
function Game($boardContainer, $displayContainer) {
  this.board = new Grid(3);
  this.display = new Display(this, $displayContainer);
  this.p1 = new Player(this, "p1", "Player 1", "X", "human");
  this.p2 = new Player(this, "p2", "Player 2", "O", "hard");
  this.curPlayer = this.getPlayersByMarker("X").player;
  this.board.renderDisplay($boardContainer);
  this.display.update();
}
Game.prototype = {
  constructor: Game,
  isValidMove: function(cell) {
    //Check whether it is possible to move on a particular cell
    return !cell.hasValue();
  },
  activateCell: function(row, col) {
    //Attempt to activate or play in a cell
    if (this.curPlayer && this.curPlayer.controller.type === "human") {
      this.move(this.board.getCell(row, col));
    }
  },
  isWinner: function(board, player) {
    //Check for a winner
    var match = board.getMatchingSet();
    return (Array.isArray(match) && match[0].value === player.marker);
  },
  getPlayersById: function(playerId) {
    //Return player and opponent by id
    if (playerId === "p1") {
      return {player: this.p1, opponent: this.p2};
    } else if (playerId === "p2") {
      return {player: this.p2, opponent: this.p1};
    } else {
      return null;
    }
  },
  getPlayersByMarker: function(marker) {
    //Return player and opponent by marker
    if (this.p1.marker === marker) {
      return {player: this.p1, opponent: this.p2};
    } else if (this.p2.marker === marker) {
      return {player: this.p2, opponent: this.p1};
    } else {
      return null;
    }
  },
  setPlayerMarker: function(playerId, marker) {
    //Attempt to set a player marker to X or O. If this is a change, also
    //toggle the other player's marker.
    var players = this.getPlayersById(playerId);
    if(players.player.setMarker(marker)) {
      players.opponent.setMarker(marker === "X" ? "O" : "X");
      this.display.update();
    }
  },
  setPlayerName: function(playerId, name) {
    //Set player's name
    this.getPlayersById(playerId).player.name = name;
  },
  setPlayerController: function(playerId, controllerType) {
    //Set player's controller
    var players = this.getPlayersById(playerId);
    players.player.setController(controllerType);
    //If the current player's controller has changed, take its turn.
    if(players.player === this.curPlayer) {
      this.curPlayer.controller.takeTurn();
    }
  },
  nextTurn: function() {
    //Check game state
    if (this.isWinner(this.board, this.curPlayer)) {
      //Victory!
      this.curPlayer.score++;
      this.display.setMessage(this.curPlayer.name + " wins!");
      this.curPlayer = null;
    } else if (this.board.getEmptyCells().length === 0) {
      //Draw
      this.curPlayer = null;
      this.display.setMessage("It's a draw.");
    } else {
      //Still playing, so toggle the current player and let it take its turn
      this.curPlayer = (this.curPlayer === this.p1) ? this.p2 : this.p1;
      this.curPlayer.controller.takeTurn();
    }
  },
  move: function(cell) {
    //Attempt to move on a specified cell
    if (!this.isValidMove(cell)) {
      return false;
    }
    cell.setValue(this.curPlayer.marker);
    this.nextTurn();
  }
};

/******************************************************************************
/* Set up for the display handler, to link game objects to UI
******************************************************************************/

function Display(game, $displayContainer) {
  this.game = game;
  this.$message = $displayContainer.find("#message");
  this.p1Display = this.registerPlayerDisplay($displayContainer.find("#p1"));
  this.p2Display = this.registerPlayerDisplay($displayContainer.find("#p2"));
}
Display.prototype = {
  constructor: Display,
  registerPlayerDisplay: function($playerContainer) {
    return {
      $name: $playerContainer.find(".player-input-name"),
      $marker: $playerContainer.find(".player-select-marker"),
      $controller: $playerContainer.find(".player-select-controller")
    };
  },
  setMessage: function(msg) {
    this.$message.html(msg);
  },
  updatePlayerDisplay: function(player, playerDisplay) {
    playerDisplay.$name.val(player.name);
    playerDisplay.$marker.val(player.marker);
  },
  update: function() {
    this.updatePlayerDisplay(this.game.p1, this.p1Display);
    this.updatePlayerDisplay(this.game.p2, this.p2Display);
  }
};

/******************************************************************************
/* Run code when page is ready to instantiate objects and hook up the UI
******************************************************************************/
$(document).ready(function() {
  var game = new Game($(".board-container"), $(".display-container"));

  $(".board-container").on("click", ".cell", function() {
    game.activateCell($(this).data("row"), $(this).data("col"));
  });

  $(".player-container").on("change", ".player-input-name", function() {
    game.setPlayerName($(this).data("player"), $(this).val());
  });
  $(".player-container").on("change", ".player-select-marker", function() {
    game.setPlayerMarker($(this).data("player"), $(this).val());
  });
  $(".player-container").on("change", ".player-select-controller", function() {
    game.setPlayerController($(this).data("player"), $(this).val());
  });
});
