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

function HumanController(game, player) {
  Controller.call(this, game, "human", player);
}
HumanController.prototype = Object.create(Controller.prototype);
HumanController.prototype.constructor = HumanController;
HumanController.prototype.takeTurn = function() {
  this.game.display.setMessage(this.player.name + "'s turn!");
};

function EasyController(game, player) {
  Controller.call(this, game, "easy", player);
}
EasyController.prototype = Object.create(Controller.prototype);
EasyController.prototype.constructor = HumanController;
EasyController.prototype.takeTurn = function() {
  this.game.display.setMessage(this.player.name + "'s turn! Easy!");
};


function Player(game, name, marker, controllerType) {
  this.game = game;
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
    } else {
      this.controller = null;
    }
  }
}

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

function Game($boardContainer, $displayContainer) {
  this.board = new Grid(this, 3, $boardContainer);
  this.display = new Display(this, $displayContainer);
  this.p1 = new Player(this, "Player 1", "X", "human");
  this.p2 = new Player(this, "Player 2", "O", "human");
  this.curPlayer = this.getPlayersByMarker("X").player;
}
Game.prototype = {
  constructor: Game,
  isValidMove: function(cell) {
    return !cell.hasValue();
  },
  activateCell: function(row, col) {
    //Attempt to activate or play in a cell
    if (this.curPlayer && this.curPlayer.controller.type === "human") {
      this.move(this.board.getCell(row, col));
    }
  },
  isWinner: function(player) {
    //Check for a winner
    var match = this.board.getMatchingSet();
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
    //Swap the current player and take their turn
    this.curPlayer = (this.curPlayer === this.p1) ? this.p2 : this.p1;
    this.curPlayer.controller.takeTurn();
  },
  move: function(cell) {
    //Attempt to move on a specified cell
    if (!this.isValidMove(cell)) {
      return false;
    }
    cell.setValue(this.curPlayer.marker);
    //Check for victory!
    if (this.isWinner(this.curPlayer)) {
      this.curPlayer.score++;
      this.display.setMessage(this.curPlayer.name + " wins!");
      this.curPlayer = null;
    } else {
      this.nextTurn();
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
