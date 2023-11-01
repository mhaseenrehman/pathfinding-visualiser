let visualiser = document.getElementById("visualiser");
let pathfindButton = document.getElementById("pathfind-button");
let pathfindAlgorithmSelection = document.getElementById("pathfind-algorithm-selection");

let numRows = 16;
let numCols = 32;
var grid = Array.from(Array(numRows), () => new Array(numCols));

var startNode;
var endNode;

var isMouseDown = false;
var movingStart = false;
var movingEnd = false;


// ASYNC SLEEP PROMISE
function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

// SEARCH ALGORITHMS
function heuristic(node) {
    let sx = getComputedStyle(node).getPropertyValue('--grid-x');
    let sy = getComputedStyle(node).getPropertyValue('--grid-y');
    let gx = getComputedStyle(endNode).getPropertyValue('--grid-x');
    let gy = getComputedStyle(endNode).getPropertyValue('--grid-y');
    
    return Math.abs(sx-gx)+Math.abs(sy-gy);
}

// GET LOWEST G-SCORE NODE
function getLowestNode(nodeSet) {
    let minNode = nodeSet[0];
    for (i = 0, l = nodeSet.length; i<l; i++) {
        let minF = getComputedStyle(minNode).getPropertyValue('--f-score');
        let minNew = getComputedStyle(nodeSet[i]).getPropertyValue('--f-score');
        if (minNew < minF) {
            minNode = nodeSet[i];
        }
    }
    return minNode;
}

// GET NEIGHBOURING NODES IN GRID
function getNeighbours(row, col) {
    let neighbours = [];
    if (row+1 < numRows) {
        if (getComputedStyle(grid[row+1][col]).getPropertyValue('--solidity') === "False") {neighbours.push(grid[row+1][col]);}
    }
    if (col+1 < numCols) {
        if (getComputedStyle(grid[row][col+1]).getPropertyValue('--solidity') === "False") {neighbours.push(grid[row][col+1]);}
    }
    if (row-1 >= 0) {
        if (getComputedStyle(grid[row-1][col]).getPropertyValue('--solidity') === "False") {neighbours.push(grid[row-1][col]);}
    }
    if (col-1 >= 0) {
        if (getComputedStyle(grid[row][col-1]).getPropertyValue('--solidity') === "False") {neighbours.push(grid[row][col-1]);}
    }

    return neighbours;
}

// RECONSTRUCT PATH
async function getPathToGoal(nodePath, current) {
    var path = [];

    path.push(current);
    current.style.backgroundColor = "yellow";

    while (nodePath[getComputedStyle(current).getPropertyValue('--node-id')] !== undefined) {
        current = nodePath[getComputedStyle(current).getPropertyValue('--node-id')];
        path.push(current);
        current.innerHTML = "";
        current.style.backgroundColor = "yellow";
        await sleep(30);
    }
    return path;
}

// A* ALGORITHM
async function aStarSearch(start, goal) {
    var openSet = [];
    openSet.push(start);

    var cameFrom = {};

    start.style.setProperty('--g-score', 0);
    start.style.setProperty('--f-score', heuristic(start));

    while (Array.isArray(openSet) && openSet.length) {
        let current = getLowestNode(openSet);
        if (getComputedStyle(current).getPropertyValue('--node-id') === getComputedStyle(goal).getPropertyValue('--node-id')) {
            return getPathToGoal(cameFrom, current);
        }

        // Remove Current From the Open Set
        const index = openSet.indexOf(current);
        openSet.splice(index, 1);

        // Get Neighbours
        let row = Number(getComputedStyle(current).getPropertyValue('--grid-x'));
        let col = Number(getComputedStyle(current).getPropertyValue('--grid-y'));
        let neighbours = getNeighbours(row, col);

        // Iterate through Neighbours
        for (let n = 0; n < neighbours.length; n++) {
            let neighbour = neighbours[n];
            let t_gScore = Number(getComputedStyle(current).getPropertyValue('--g-score')) + 1;
            let n_gScore = Number(getComputedStyle(neighbour).getPropertyValue('--g-score'));
            if (t_gScore < n_gScore) {
                cameFrom[getComputedStyle(neighbour).getPropertyValue('--node-id')] = current;
                neighbour.style.setProperty('--g-score', t_gScore);
                neighbour.style.setProperty('--f-score', t_gScore+heuristic(neighbour));
                if (!(openSet.includes(neighbour))) {
                    openSet.push(neighbour);
                    
                    let checkAnim = document.createElement("div");
                    checkAnim.classList.add('check');
                    neighbour.appendChild(checkAnim);
            
                }
            }
        }
        await sleep(30);
    }

    return false;
}


// INITIATION FUNCTIONS
function makeGrid(rows, cols) {
    visualiser.style.setProperty('--grid-rows', rows);
    visualiser.style.setProperty('--grid-cols', cols);
    var row = 0;
    var col = 0;
    for (c = 0; c < (rows*cols); c++) {
        let node = document.createElement("div");
        visualiser.appendChild(node).className = "node";
        node.style.setProperty('--node-id', c);
        node.style.setProperty('--grid-x', row);
        node.style.setProperty('--grid-y', col);
        
        node.addEventListener('mousedown', e => {
            if (getComputedStyle(node).getPropertyValue('--is-start') === "True") {
                movingStart = true;
            }
            if (getComputedStyle(node).getPropertyValue('--is-end') === "True") {
                movingEnd = true;
            }
            if (!movingStart && !movingEnd &&
                getComputedStyle(node).getPropertyValue('--can-solidify') === "False" && 
                getComputedStyle(node).getPropertyValue('--is-start') === "False" && 
                getComputedStyle(node).getPropertyValue('--is-end') === "False") {
                let wall = document.createElement("div");
                wall.style.backgroundColor = "#162336";
                wall.classList.add('wall');
                node.appendChild(wall);
                node.style.setProperty('--solidity', "True");
            } else {
                node.innerHTML = '';
                node.style.setProperty('--solidity', "False");
            }
            isMouseDown = true;
        });

        node.addEventListener('mousemove', e => {
            if (movingStart) {
                if (getComputedStyle(node).getPropertyValue('--node-id') !== getComputedStyle(startNode).getPropertyValue('--node-id') &&
                    getComputedStyle(node).getPropertyValue('--solidity') === "False" &&
                    getComputedStyle(node).getPropertyValue('--is-end') === "False") {
                    node.style.backgroundColor = "#5fb15f";
                    node.style.setProperty('--is-start', "True");

                    startNode.style.setProperty('--is-start', "False");
                    startNode.style.backgroundColor = "#b1b1b1";
                    startNode = node;
                }
            } else if (movingEnd) {
                if (getComputedStyle(node).getPropertyValue('--node-id') !== getComputedStyle(endNode).getPropertyValue('--node-id') &&
                    getComputedStyle(node).getPropertyValue('--solidity') === "False" &&
                    getComputedStyle(node).getPropertyValue('--is-start') === "False") {
                    node.style.backgroundColor = "#ff0000";
                    node.style.setProperty('--is-end', "True");

                    endNode.style.setProperty('--is-end', "False");
                    endNode.style.backgroundColor = "#b1b1b1";
                    endNode = node;
                }
            } else {
                if (!movingStart && !movingEnd &&
                    getComputedStyle(node).getPropertyValue('--can-solidify') === "False" && 
                    getComputedStyle(node).getPropertyValue('--is-start') === "False" && 
                    getComputedStyle(node).getPropertyValue('--is-end') === "False") {
                    if (isMouseDown === true) {
                        if (getComputedStyle(node).getPropertyValue('--solidity') === "False") {
                            let wall = document.createElement("div");
                            wall.style.backgroundColor = "#162336";
                            wall.classList.add('wall');
                            node.appendChild(wall);
                            node.style.setProperty('--solidity', "True");
                        } else {
                            node.innerHTML = '';
                            node.style.setProperty('--solidity', "False");
                        }
                    }
                    node.style.setProperty('--can-solidify', "True");
                    setTimeout(function () {
                        node.style.setProperty('--can-solidify', "False");
                    }, 1000)
                }
            }
        });

        node.addEventListener('mouseup', e => {
            if (isMouseDown === true) {
                isMouseDown = false;
            }
            if (movingStart === true) {
                movingStart = false;
            }
            if (movingEnd === true) {
                movingEnd = false;
            }
        });

        grid[row][col] = node;
        col++;
        if (col > cols-1) {
            col = 0;
            row++;
        }
    };
}
function setStartIcon(row, col) {
    let node = grid[row][col];
    node.style.backgroundColor = "#5fb15f";
    node.style.setProperty('--is-start', "True");
    startNode = node;
}
function setEndIcon(row, col) {
    let node = grid[row][col];
    node.style.backgroundColor = "#ff0000";
    node.style.setProperty('--is-end', "True");
    endNode = node;
}
function initiation() {
    makeGrid(numRows, numCols);
    setStartIcon(8, 8);
    setEndIcon(8, 24);
}

// CALL INITIATION
pathfindButton.addEventListener("click", function() {
    var selectedAlgorithm = pathfindAlgorithmSelection.value;
    if (selectedAlgorithm == "A* Search") {
        aStarSearch(startNode, endNode);
        console.log("FINISHED");
    }
})

initiation();