var canvas;
var isMouseDown = false;
var cellStart = null;
var lastCellLine = [];

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

// TODO: it's bwoke
function getCellLine(canvas, startCell, endCell) {
    function getCoord(cell) {
        return {x: +cell.getAttribute("data-x"), y: +cell.getAttribute("data-y")};
    }
    var start = getCoord(startCell);
    var end = getCoord(endCell);
    var v = {x: end.x-start.x, y: end.y-start.y};
    var len = Math.sqrt(v.x*v.x + v.y*v.y);

    // normalize
    v.x /= len;
    v.y /= len;

    var line = []
    for (var t = 0; t < len; t++) {
        var x = Math.floor(start.x + (v.x * t));
        var y = Math.floor(start.y + (v.y * t));
        var cell = canvas.children[y].children[x];
        line.push(cell);
    }
    return line;
}

function addHandlers(canvas, cell) {
    cell.onmousedown = function(e) {
        isMouseDown = true;
        toggleClass(cell, "selected");
        cellStart = e.target;
    }
    cell.onmouseover = function(e) {
        if (!isMouseDown)
            return;

        lastCellLine.forEach(function(cell) {
            removeClass(cell, "selected");
        });

        var cellEnd = e.target;
        var cells = getCellLine(canvas, cellStart, cellEnd);
        cells.forEach(function(cell) {
            addClass(cell, "selected");
        });
        lastCellLine = cells;
    }
    cell.onmouseup = function() {
        isMouseDown = false;
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

window.onload = function() {
    var cells = document.querySelectorAll(".canvas > .row > span");
    canvas = document.querySelector(".canvas");
    setContents(canvas, "testing 1 2 3 4\naaaaaaaaaa a a a a\nblah alalblb blahb\n123123", 80, 20);
}

