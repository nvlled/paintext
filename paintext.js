var canvas;
var isMouseDown = false;
var cellStart = null;
var cellEnd = null;
var cellCursor = null;
var lastSelectedCells = [];
var selectionHandler = {};

function repeat(x, n) {
    var xs = [];
    for (var i = 0; i < n; i++)
        xs.push(x);
    return xs;
}

function rightpad(str, n, c) {
    var chars = [];
    for (var i = 0; i < n-str.length; i++)
        chars.push(c);
    return str + chars.join("");
}

function removeClass(node, className) {
    if (node)
        node.classList.remove(className);
    return node;
}

function addClass(node, className) {
    if (node)
        node.classList.add(className);
    return node;
}

function toggleClass(node, className) {
    if (node)
        node.classList.toggle(className);
}

function getCell(canvas, x, y) {
    return canvas.children[y].children[x];
}

function clearLastSelectedCells() {
    lastSelectedCells.forEach(function(cellEnd) {
        removeClass(cellEnd, "selected");
    });
    if (cellStart)
        removeClass(cellStart, "selected");
    if (cellEnd)
        removeClass(cellEnd, "selected");
}

function getCellCoord(cell) {
    return {x: +cell.getAttribute("data-x"), y: +cell.getAttribute("data-y")};
}

function getCellLine(canvas, startCell, endCell) {
    var start = getCellCoord(startCell);
    var end = getCellCoord(endCell);
    var v = {x: end.x-start.x, y: end.y-start.y};
    var len = Math.sqrt(v.x*v.x + v.y*v.y);

    // normalize
    v.x /= len;
    v.y /= len;

    var line = []
    for (var t = 0; t <= len; t++) {

        var x;
        var y;

        // the check for negative values fixes diagonal lines
        if (v.x < 0)
            x = Math.ceil(start.x + (v.x * t));
        else
            x = Math.floor(start.x + (v.x * t));

        if (v.y < 0)
            y = Math.ceil(start.y + (v.y * t));
        else
            y = Math.floor(start.y + (v.y * t));

        var cell = getCell(canvas, x, y);
        line.push(cell);
    }
    line.push(endCell);
    return line;
}

function setCursor(cell) {
    if (cellCursor) {
        removeClass(cellCursor, "cursor");
    }
    cellCursor = cell;
    addClass(cellCursor, "cursor");
}

function getCellBlock(canvas, startCell, endCell) {
    var p0 = getCellCoord(startCell);
    var p1 = getCellCoord(endCell);
    var cells = [];

    var startX = Math.min(p0.x, p1.x);
    var startY = Math.min(p0.y, p1.y);
    var endX = Math.max(p0.x, p1.x);
    var endY = Math.max(p0.y, p1.y);

    for (var x = startX; x <= endX; x++) {
        for (var y = startY; y <= endY; y++) {
            var cell = getCell(canvas, x, y);
            cells.push(cell);
        }
    }
    return cells;
}

var selHandlers = {
    line: {
        onmousedown: function(e) {
            isMouseDown = true;
            clearLastSelectedCells();
            cellStart = e.target;

            toggleClass(cellStart, "selected");
            setCursor(cellStart);

        },
        onmouseover: function(e) {
            if (!isMouseDown)
                return;

            cellEnd = e.target;
            clearLastSelectedCells();

            var cells = getCellLine(canvas, cellStart, cellEnd);
            cells.forEach(function(cell) {
                addClass(cell, "selected");
            });
            lastSelectedCells = cells;
        },
        onmouseup: function() {
            isMouseDown = false;
        },
    },

    block: {
        onmousedown: function(e) {
            isMouseDown = true;
            clearLastSelectedCells();
            cellStart = e.target;

            toggleClass(cellStart, "selected");
            setCursor(cellStart);
        },
        onmouseover: function(e) {
            if (!isMouseDown)
                return;


            cellEnd = e.target;
            lastSelectedCells.forEach(function(cellEnd) {
                removeClass(cellEnd, "selected");
            });

            var cells = getCellBlock(canvas, cellStart, cellEnd);
            cells.forEach(function(cell) {
                addClass(cell, "selected");
            });
            lastSelectedCells = cells;
        },
        onmouseup: function() {
            isMouseDown = false;
        },
    },

    serial: {
        lastCell: null,
        onmousedown: function(e) {
            isMouseDown = true;
            clearLastSelectedCells();
            cellStart = e.target;

            toggleClass(cellStart, "selected");
            setCursor(cellStart);
            this.lastCell = cellStart;
        },
        onmouseover: function(e) {
            if (!isMouseDown)
                return;
            cellEnd = e.target;
            var cells = [];
            var p0 = getCellCoord(this.lastCell);
            var p1 = getCellCoord(cellEnd);
            cells = getCellLine(canvas, this.lastCell, cellEnd);
            cells.forEach(function(cell) {
                addClass(cell, "selected");
            });
            lastSelectedCells = lastSelectedCells.concat(cells);
            this.lastCell = cellEnd;
        },
        onmouseup: function() {
            isMouseDown = false;
            this.lastCell = null;
        },
    },
}

function addHandlers(canvas, cell) {
    cell.onmousedown = function(e) {
        if (selectionHandler)
            selectionHandler.onmousedown(e);
    }
    cell.onmouseover = function(e) {
        if (selectionHandler)
            selectionHandler.onmouseover(e);
    }
    cell.onmouseup = function(e) {
        if (selectionHandler)
            selectionHandler.onmouseup(e);
    }
}

function setContents(canvas, text, minw, minh, voidc) {
    voidc = voidc || "~";
    canvas.innerHTML = "";

    text += repeat(voidc+"\n", minh-text.split("\n").length).join("");
    var lines = text.split("\n");
    var maxlen = lines.reduce(function(max, line) { return line.length > max ? line.length : max  }, 0);
    minw = Math.max(minw, maxlen);

    lines.forEach(function(line, y) {
        var row = addClass(document.createElement("div"), "row");
        line = rightpad(line, minw, voidc);

        line.split("").forEach(function(ch, x) {
            var cell = document.createElement("span");
            cell.innerHTML = ch == " " ? "&nbsp;" : ch;
            cell.setAttribute("data-x", x);
            cell.setAttribute("data-y", y);
            row.appendChild(cell);
            addHandlers(canvas, cell);
        });
        canvas.appendChild(row);
    });
}

function initButtonHandlers() {
    var buttons = document.querySelectorAll(".select-btns > button");
    function clearToggle() {
        for (var i = 0; i < buttons.length; i++) {
            removeClass(buttons[i], "toggled");
        }
    }
    for (var i = 0; i < buttons.length; i++) {
        (function(btn) {
            btn.onclick = function() {
                var fn = selHandlers[btn.name];
                if (!fn)
                    return;
                selectionHandler = fn;
                clearToggle();
                addClass(btn, "toggled");
            }
        })(buttons[i]);
    }
}

window.onload = function() {
    initButtonHandlers();
    selectionHandler = selHandlers["serial"];

    var cells = document.querySelectorAll(".canvas > .row > span");
    canvas = document.querySelector(".canvas");
    setContents(canvas, "testing 1 2 3 4\naaaaaaaaaa a a a a\nblah alalblb blahb\n123123", 80, 20);
}



