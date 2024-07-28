let visualiser = document.getElementById("visualiser");
let pathfindButton = document.getElementById("pathfind-button");
let pathfindAlgorithmSelection = document.getElementById("pathfind-algorithm-selection");

let mazeGenButton = document.getElementById("maze-gen-button");
let mazeGenAlgorithmSelection = document.getElementById("maze-algorithm-selection");

let resetGridButton = document.getElementById("reset-grid-button");
let changeGridButton = document.getElementById("change-grid-button");

let gridSize = document.getElementById("grid-size-text");
let gridSizeSlider = document.getElementById("grid-size-slider");

let numRows = 35;
let numCols = 75;
var grid;

var startNode;
var endNode;

var isMouseDown = false;
var movingStart = false;
var movingEnd = false;

// --------------------------------------------------------------------------- Data Structure Utility --------------------------------------------------------------------------

class tree {
    constructor(root, id) {
        this.id = id;

        this.root = this;
        this.node = root;

        this.treeSet = [];
        this.treeSet.push(this.root);
    }

    getID() {
        // return id of tree
        return this.id;
    }

    getNode() {
        // return root node
        return this.node; 
    }

    getRoot() {
        // return true root
        return this.root;
    }

    getTreeSet() {
        // return treeSet
        return this.treeSet;
    }

    addTree(tree) {
        let newTreeSet = tree.getTreeSet()
        this.treeSet.push(...newTreeSet);
    }

    setRoot(newRoot) {
        this.root = newRoot;
    }

}

// ----------------------------------------------------------------------------- Algorithm Utility -----------------------------------------------------------------------------

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

// GET LOWEST F-SCORE NODE
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

// GET LOWEST G-SCORE NODE
function getLowestNodeDijkstra(nodeSet) {
    let minNode = nodeSet[0];
    for (i = 0; i < nodeSet.length; i++) {
        if (Number(getComputedStyle(minNode).getPropertyValue('--g-score')) > Number(getComputedStyle(nodeSet[i]).getPropertyValue('--g-score'))) {
            minNode = nodeSet[i];
        }
    }
    return minNode;
}

// GET NEIGHBOURING NODES IN GRID
function getNeighbours(row, col, maze) {
    let offset = maze ? 2 : 1;
    let condition = maze ? "True" : "False";
    let neighbours = [];
    if (row+offset < numRows) {
        if (getComputedStyle(grid[row+offset][col]).getPropertyValue('--solidity') === condition) {neighbours.push(grid[row+offset][col]);}
    }
    if (col+offset < numCols) {
        if (getComputedStyle(grid[row][col+offset]).getPropertyValue('--solidity') === condition) {neighbours.push(grid[row][col+offset]);}
    }
    if (row-offset >= 0) {
        if (getComputedStyle(grid[row-offset][col]).getPropertyValue('--solidity') === condition) {neighbours.push(grid[row-offset][col]);}
    }
    if (col-offset >= 0) {
        if (getComputedStyle(grid[row][col-offset]).getPropertyValue('--solidity') === condition) {neighbours.push(grid[row][col-offset]);}
    }

    return neighbours;
}

// RECONSTRUCT PATH
async function getPathToGoal(nodePath, current) {
    var path = [];

    path.push(current);
    current.style.backgroundColor = "orange";

    while (nodePath[getComputedStyle(current).getPropertyValue('--node-id')] !== undefined) {
        current = nodePath[getComputedStyle(current).getPropertyValue('--node-id')];
        path.push(current);
        current.innerHTML = "";
        current.style.backgroundColor = "orange";
        await sleep(30);
    }
    return path;
}

// ----------------------------------------------------------------------------- Search Algorithms -------------------------------------------------------------------------

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
        let neighbours = getNeighbours(row, col, false);

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

// DIJKSTRA'S ALGORITHM
async function dijkstrasSearch(start, goal) {
    // Create an unexplored set and add starting node
    var unexplored = [];
    var cameFrom = {};
    unexplored.push(start);

    // Reset all nodes g-score and add to unexplored
    for (r = 0; r < numRows; r++) {
        for (c = 0; c < numCols; c++) {
            grid[r][c].style.setProperty('--g-score', 99999);
            unexplored.push(grid[r][c]);
        }
    }

    // Assign start node 0 value
    start.style.setProperty('--g-score', 0);

    // Loop - while unexplored set is not empty or only contains nodes that have infinite distance
    var current;
    while (unexplored.length > 0) {
        // Select current node that has smallest finite distance
        current = getLowestNodeDijkstra(unexplored);

        // Remove current from unexplored
        let current_index = unexplored.indexOf(current);
        unexplored.splice(current_index, 1);
        
        // If current node is goal node, then break loop and Reconstruct path
        if (getComputedStyle(current).getPropertyValue('--is-end') === getComputedStyle(goal).getPropertyValue('--is-end')) {
            return getPathToGoal(cameFrom, current);
        }

        // else Consider unvisited neighbours of current - update distance and check if newly calculated one is smaller than current
        // Get all Unvisited neighbours of current
        // Need to randomly select vertex that is already in the maze
        let neighbours = [];
        let row = Number(getComputedStyle(current).getPropertyValue('--grid-x'));
        let col = Number(getComputedStyle(current).getPropertyValue('--grid-y'));
        
        if (row+1 < numRows) {
            let currentNeighbour = grid[row+1][col];
            if (unexplored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }

        if (col+1 < numCols) {
            let currentNeighbour = grid[row][col+1];
            if (unexplored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }

        if (row-1 >= 0) {
            let currentNeighbour = grid[row-1][col];
            if (unexplored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }

        if (col-1 >= 0) {
            let currentNeighbour = grid[row][col-1];
            if (unexplored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }
        
        // Iterate through the neighbours
        for (let n = 0; n < neighbours.length; n++) {
            let neighbour = neighbours[n];
            let temp_distance = Number(getComputedStyle(current).getPropertyValue('--g-score')) + 1;

            // if alt < dist[v]
            if (temp_distance < Number(getComputedStyle(neighbour).getPropertyValue('--g-score'))) {
                neighbour.style.setProperty('--g-score', temp_distance);
                cameFrom[getComputedStyle(neighbour).getPropertyValue('--node-id')] = current;
                
                // Play animation for checking neighbour
                let checkAnim = document.createElement("div");
                checkAnim.classList.add('check');
                neighbour.appendChild(checkAnim);
            }
        }

        await sleep(30);

    }

    
}

// BREADTH-FRIST SEARCH
async function bfsSearch(start, goal) {
    let queue = [];
    let explored = [];
    let cameFrom = {};

    queue.push(start);
    explored.push(start);

    while (queue.length > 0) {
        // Dequeue - Reverse array and pop
        queue.reverse();
        let vertex = queue.pop();
        queue.reverse();

        // Check for Goal - If current node is goal node, then break loop and Reconstruct path
        if (getComputedStyle(vertex).getPropertyValue('--is-end') === getComputedStyle(goal).getPropertyValue('--is-end')) {
            return getPathToGoal(cameFrom, vertex);
        }

        // For all edges check them - Obtain neighbours of vertex but only the ones not in explored or stack
        let row = Number(getComputedStyle(vertex).getPropertyValue('--grid-x'));
        let col = Number(getComputedStyle(vertex).getPropertyValue('--grid-y'));

        if (row+1 < numRows) {
            let currentNeighbour = grid[row+1][col];
            if (!explored.includes(currentNeighbour)) {
                queue.push(currentNeighbour);
                cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                explored.push(currentNeighbour);
            }
        }

        if (col+1 < numCols) {
            let currentNeighbour = grid[row][col+1];
            if (!explored.includes(currentNeighbour)) {
                queue.push(currentNeighbour);
                cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                explored.push(currentNeighbour);
            }
        }

        if (row-1 >= 0) {
            let currentNeighbour = grid[row-1][col];
            if (!explored.includes(currentNeighbour)) {
                queue.push(currentNeighbour);
                cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                explored.push(currentNeighbour);
            }
        }

        if (col-1 >= 0) {
            let currentNeighbour = grid[row][col-1];
            if (!explored.includes(currentNeighbour)) {
                queue.push(currentNeighbour);
                cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                explored.push(currentNeighbour);
            }
        }

        // Play animation for checking neighbour
        let checkAnim = document.createElement("div");
        checkAnim.classList.add('check');
        vertex.appendChild(checkAnim);

        await sleep(30);
    }
}

// DEPTH-FIRST SEARCH
async function dfsSearch(start, goal) {
    let stack = [];
    let explored = [];
    let cameFrom = {};

    stack.push(start);

    while (stack.length > 0) {
        let vertex = stack.pop();
        if (!explored.includes(vertex)) {
            explored.push(vertex);
            
            // Check if explored is the goal
            if (getComputedStyle(vertex).getPropertyValue('--node-id') === getComputedStyle(goal).getPropertyValue('--node-id')) {
                return getPathToGoal(cameFrom, vertex);
            }

            // Obtain neighbours of vertex but only the ones not in explored or stack
            let row = Number(getComputedStyle(vertex).getPropertyValue('--grid-x'));
            let col = Number(getComputedStyle(vertex).getPropertyValue('--grid-y'));

            if (row+1 < numRows) {
                let currentNeighbour = grid[row+1][col];
                if (!explored.includes(currentNeighbour)) {
                    stack.push(currentNeighbour);
                    cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                }
            }

            if (col+1 < numCols) {
                let currentNeighbour = grid[row][col+1];
                if (!explored.includes(currentNeighbour)) {
                    stack.push(currentNeighbour);
                    cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                }
            }

            if (row-1 >= 0) {
                let currentNeighbour = grid[row-1][col];
                if (!explored.includes(currentNeighbour)) {
                    stack.push(currentNeighbour);
                    cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                }
            }

            if (col-1 >= 0) {
                let currentNeighbour = grid[row][col-1];
                if (!explored.includes(currentNeighbour)) {
                    stack.push(currentNeighbour);
                    cameFrom[getComputedStyle(currentNeighbour).getPropertyValue('--node-id')] = vertex;
                }
            }

            // Play animation for checking neighbour
            let checkAnim = document.createElement("div");
            checkAnim.classList.add('check');
            vertex.appendChild(checkAnim);
        }

        await sleep(30);
    }
}


// ------------------------------------------------------------------------------ Maze Algorithms -------------------------------------------------------------------------

// PRIM'S MAZE
async function primsMaze() {
    // Solidify entire maze and reset grid
    solidifyMazeGrid();

    // Explored Vertices
    var explored = [];
    var frontier = [];

    // Arbitrary Vertex from G and add to V
    let rand_vertex_index_row = Math.floor(((Math.random() * numRows) * 2) % 100);
    let rand_vertex_index_col = Math.floor(((Math.random() * numCols) * 2) % 100);
    var start_vertex = grid[rand_vertex_index_row][rand_vertex_index_col];
    explored.push(start_vertex);

    // Set start point for Prim's Maze
    start_vertex.style.backgroundColor = "#b1b1b1";
    start_vertex.innerHTML = '';
    start_vertex.style.setProperty('--solidity', "False");

    // Add neighbouring cells to frontier
    var neighb = getNeighbours(rand_vertex_index_row, rand_vertex_index_col, true);
    frontier = frontier.concat(neighb);

    // Repeat carving passages
    while (frontier.length > 0) {

        // Select random frontier node and add to explored
        let random_frontier_node = frontier[Math.floor(Math.random() * (frontier.length-1))];

        let row = Number(getComputedStyle(random_frontier_node).getPropertyValue("--grid-x"));
        let col = Number(getComputedStyle(random_frontier_node).getPropertyValue("--grid-y"));

        // Need to randomly select vertex that is already in the maze
        let non_explored_neighbours = [];
        let neighbours = [];

        if (row+2 < numRows) {
            let currentNeighbour = grid[row+2][col];
            if (explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            } else {
                if (!frontier.includes(currentNeighbour)) {
                    currentNeighbour.style.backgroundColor = "Red";
                    non_explored_neighbours.push(currentNeighbour);
                }
            }
        }

        if (col+2 < numCols) {
            let currentNeighbour = grid[row][col+2];
            if (explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            } else {
                if (!frontier.includes(currentNeighbour)) {
                    currentNeighbour.style.backgroundColor = "Red";
                    non_explored_neighbours.push(currentNeighbour);
                }
            }
        }

        if (row-2 >= 0) {
            let currentNeighbour = grid[row-2][col];
            if (explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            } else {
                if (!frontier.includes(currentNeighbour)) {
                    currentNeighbour.style.backgroundColor = "Red";
                    non_explored_neighbours.push(currentNeighbour);
                }
            }
        }

        if (col-2 >= 0) {
            let currentNeighbour = grid[row][col-2];
            if (explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            } else {
                if (!frontier.includes(currentNeighbour)) {
                    currentNeighbour.style.backgroundColor = "Red";
                    non_explored_neighbours.push(currentNeighbour);
                }
            }
        }

        // If we have some neighbours that are in the maze
        if (neighbours.length > 0) {

            // Get Random Neighbour
            let randomIndex = Math.floor(Math.random() * (neighbours.length-1));
            var node_picked = neighbours[randomIndex];
            
            // Get Node in middle
            let middle_row = Math.floor((Number(getComputedStyle(random_frontier_node).getPropertyValue("--grid-x")) + Number(getComputedStyle(node_picked).getPropertyValue("--grid-x")))/2);
            let middle_col = Math.floor((Number(getComputedStyle(random_frontier_node).getPropertyValue("--grid-y")) + Number(getComputedStyle(node_picked).getPropertyValue("--grid-y")))/2);
            let node_in_middle = grid[middle_row][middle_col];

            // Carve a passage + Animating wall removing
            random_frontier_node.style.backgroundColor = "#b1b1b1";
            random_frontier_node.innerHTML = '';
            random_frontier_node.classList.add('maze_wall');
            random_frontier_node.style.setProperty('--solidity', "False");
            random_frontier_node.style.animationPlayState = "running";

            // Middle node needs to be removed + Animating wall removing
            node_in_middle.style.backgroundColor = "#b1b1b1";
            node_in_middle.innerHTML = '';
            node_in_middle.classList.add('maze_wall');
            node_in_middle.style.setProperty('--solidity', "False");
            node_in_middle.style.animationPlayState = "running";

            // End node needs to be removed + Animating wall removing
            node_picked.style.backgroundColor = "#b1b1b1";
            node_picked.innerHTML = '';
            node_picked.classList.add('maze_wall');
            node_picked.style.setProperty('--solidity', "False");
            node_picked.style.animationPlayState = "running";
        }

        // Add frontier node to explored
        explored.push(random_frontier_node);

        // Add neighbours of frontier node that aren't in explored or frontier to frontier
        frontier = frontier.concat(non_explored_neighbours);

        // Remove frontier node from frontier
        let f_index = frontier.indexOf(random_frontier_node);
        frontier.splice(f_index, 1);

        // Sleep 1
        await sleep(1);
    }

    // Wait for animations to finish
    await sleep(1000);

    // Set Start and End Icons
    var start_row = 0;
    var start_col = 0;

    var end_row = 0;
    var end_col = 0;

    while (start_row === end_row && start_col === end_col) {
        let current_start_node = explored[Math.floor(Math.random() * (explored.length-1))];
        let current_end_node = explored[Math.floor(Math.random() * (explored.length-1))];

        if (getComputedStyle(current_start_node).getPropertyValue('--grid-x') !== getComputedStyle(current_end_node).getPropertyValue('--grid-x') ||
            getComputedStyle(current_start_node).getPropertyValue('--grid-y') !== getComputedStyle(current_end_node).getPropertyValue('--grid-y')) {
                start_row = getComputedStyle(current_start_node).getPropertyValue('--grid-x');
                start_col = getComputedStyle(current_start_node).getPropertyValue('--grid-y');

                end_row = getComputedStyle(current_end_node).getPropertyValue('--grid-x');
                end_col = getComputedStyle(current_end_node).getPropertyValue('--grid-y');

                setStartIcon(start_row, start_col);
                setEndIcon(end_row, end_col);

                break;
        }
    }


    // Cleanup
    cleanupMazeGrid();
}

// KRUSKAL'S MAZE
async function kruskalsMaze() {
    // Solidify entire maze and reset grid
    solidifyMazeGrid();
    
    // Create set of trees
    let dimRow = Math.floor((numRows+1)/2);
    let dimCol = Math.floor((numCols+1)/2);
    let trees = Array.from(Array(dimRow), () => new Array(dimCol));

    // Assign every inbetween node as a tree
    let counter = 0;
    for (r = 0; r < dimRow; r+=1) {
        for (c = 0; c < dimCol; c+=1) {
            let newTree = new tree(grid[r*2][c*2], counter);
            trees[r][c] = newTree;
            counter++;
        }
    }

    // Keep list of trees that are viable
    let setOfTrees = [];
    for (r = 0; r < dimRow; r+=1) {
        for (c = 0; c < dimCol; c+=1) {
            setOfTrees.push(trees[r][c]);
        }
    }

    let roots = dimRow * dimCol;

    // Whilst there are still trees to connect to
    while (roots > 1) {
        // Select random tree
        let randomTree = setOfTrees[Math.floor(Math.random() * (setOfTrees.length-1))];

        // Get row and column of random tree
        let row = Math.floor((Number(getComputedStyle(randomTree.getNode()).getPropertyValue('--grid-x'))+1)/2);
        let col = Math.floor((Number(getComputedStyle(randomTree.getNode()).getPropertyValue('--grid-y'))+1)/2);

        // Select random neighbouring trees
        let neighbours = [];
        if (row+1 < dimRow) {
            let currentTree = trees[row+1][col];
            neighbours.push(currentTree);
        }
        if (col+1 < dimCol) {
            let currentTree = trees[row][col+1];
            neighbours.push(currentTree);
        }
        if (row-1 >= 0) {
            let currentTree = trees[row-1][col];
            neighbours.push(currentTree);
        }
        if (col-1 >= 0) {
            let currentTree = trees[row][col-1];
            neighbours.push(currentTree);
        }

        // Randomly select neighbouring tree
        while (neighbours.length > 0) {
            let randomNeighbouringTree = neighbours[Math.floor(Math.random() * (neighbours.length-1))];

            // Check if these two nodes are not apart of the same tree - get ID's of both roots and then check they are not the same
            let firstID = randomTree.getRoot().getID();
            let secondID = randomNeighbouringTree.getRoot().getID();

            if (firstID !== secondID) {
                // Remove solidification of tree nodes
                let gridRow1 = Number(getComputedStyle(randomTree.getNode()).getPropertyValue('--grid-x'));
                let gridCol1 = Number(getComputedStyle(randomTree.getNode()).getPropertyValue('--grid-y'));

                let gridRow2 = Number(getComputedStyle(randomNeighbouringTree.getNode()).getPropertyValue('--grid-x'));
                let gridCol2 = Number(getComputedStyle(randomNeighbouringTree.getNode()).getPropertyValue('--grid-y'));
        
                let gridRowMiddle = Math.floor((gridRow1+gridRow2)/2);
                let gridColMiddle = Math.floor((gridCol1+gridCol2)/2);

                let middleTree = grid[gridRowMiddle][gridColMiddle];

                // Carve a passage + Animating wall removing
                randomTree.getNode().style.backgroundColor = "#b1b1b1";
                randomTree.getNode().innerHTML = '';
                randomTree.getNode().classList.add('maze_wall');
                randomTree.getNode().style.setProperty('--solidity', "False");
                randomTree.getNode().style.animationPlayState = "running";

                // Middle node needs to be removed + Animating wall removing
                middleTree.style.backgroundColor = "#b1b1b1";
                middleTree.innerHTML = '';
                middleTree.classList.add('maze_wall');
                middleTree.style.setProperty('--solidity', "False");
                middleTree.style.animationPlayState = "running";

                // End node needs to be removed + Animating wall removing
                randomNeighbouringTree.getNode().style.backgroundColor = "#b1b1b1";
                randomNeighbouringTree.getNode().innerHTML = '';
                randomNeighbouringTree.getNode().classList.add('maze_wall');
                randomNeighbouringTree.getNode().style.setProperty('--solidity', "False");
                randomNeighbouringTree.getNode().style.animationPlayState = "running";

                // Join the two trees - Add the neighbours tree set to current trees set and set root for all nodes in tree set
                randomTree.getRoot().addTree(randomNeighbouringTree.getRoot());
                let treeSet = randomTree.getRoot().getTreeSet();
                for (let t = 0; t < treeSet.length; t++) {
                    treeSet[t].setRoot(randomTree.getRoot());
                }

                roots--;

                // End loop
                break;
            }
            else {
                // Remove neighbour as it has the same root as the current node
                let index = neighbours.indexOf(randomNeighbouringTree);
                neighbours.splice(index, 1);
            }
        }

        await sleep(10);
    }

    // Cleanup
    cleanupMazeGrid();
}

// ALDOUS-BRODER'S MAZE
async function growingTreeMaze() {
    // Solidify entire maze and reset grid
    solidifyMazeGrid();

    // List of current cells & explored nodes
    let cells = [];
    let explored = [];
    let cameFrom = {};

    // Choose cell at random to select
    let row = Math.floor(Math.random() * numRows);
    let col = Math.floor(Math.random() * numCols);
    let start_cell = grid[row][col];

    cells.push(start_cell);

    // Repeat until all cells are visited
    while (cells.length > 0) {
        // Select newest cell from cells and mark as explored
        let currentCell = cells[cells.length-1];
        explored.push(currentCell);

        // Get row and column of random tree
        let row = Math.floor(Number(getComputedStyle(currentCell).getPropertyValue('--grid-x')));
        let col = Math.floor(Number(getComputedStyle(currentCell).getPropertyValue('--grid-y')));

        // Select neighbouring trees
        let neighbours = [];
        if (row+2 < numRows) {
            let currentNeighbour = grid[row+2][col];
            if (!explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }
        if (col+2 < numCols) {
            let currentNeighbour = grid[row][col+2];
            if (!explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }
        if (row-2 >= 0) {
            let currentNeighbour = grid[row-2][col];
            if (!explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }
        if (col-2 >= 0) {
            let currentNeighbour = grid[row][col-2];
            if (!explored.includes(currentNeighbour)) {
                neighbours.push(currentNeighbour);
            }
        }

        // If there are unvisited neighbours
        if (neighbours.length > 0) {
            // Select random neighbour
            let randomIndex = Math.floor(Math.random() * neighbours.length);
            var randomNeighbour = neighbours[randomIndex];
            cameFrom[getComputedStyle(randomNeighbour).getPropertyValue('--node-id')] = currentCell;
            cells.push(randomNeighbour);

            // Get Node in middle
            let middle_row = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-x")) + Number(getComputedStyle(randomNeighbour).getPropertyValue("--grid-x")))/2);
            let middle_col = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-y")) + Number(getComputedStyle(randomNeighbour).getPropertyValue("--grid-y")))/2);
            let node_in_middle = grid[middle_row][middle_col];

            // Carve a passage + Animating wall removing
            currentCell.innerHTML = '';
            currentCell.style.backgroundColor = "#00ffc8c9";
            currentCell.style.setProperty('--solidity', "False");

            node_in_middle.innerHTML = '';
            node_in_middle.style.backgroundColor = "#00ffc8c9";
            node_in_middle.style.setProperty('--solidity', "False");

            randomNeighbour.innerHTML = '';
            randomNeighbour.style.backgroundColor = "#00ffc8c9";
            randomNeighbour.style.setProperty('--solidity', "False");

        } else {
            // Remove current from cells and add explored to current cell
            cells.splice(cells.length-1,1);
            currentCell.style.backgroundColor = "#b1b1b1";

            // Colour middle node as well
            let originCell = cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')];

            // Get Node in middle
            let middle_row = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-x")) + Number(getComputedStyle(originCell).getPropertyValue("--grid-x")))/2);
            let middle_col = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-y")) + Number(getComputedStyle(originCell).getPropertyValue("--grid-y")))/2);
            let node_in_middle = grid[middle_row][middle_col];
            node_in_middle.style.backgroundColor = "#b1b1b1";
        }

        // Sleep for animation
        await sleep(30);
    }

    // Cleanup
    cleanupMazeGrid();
}

// WILSON'S MAZE
async function wilsonsMaze() {
    // Solidify entire maze and reset grid
    solidifyMazeGrid();

    // Setup UST
    let uniformSpanningTree = [];

    // Randomly add a cell to the maze - do this on the bottom level
    let startUSTCell = grid[numRows-1][0];
    let startUSTCell2 = grid[numRows-1][2];
    uniformSpanningTree.push(startUSTCell);
    uniformSpanningTree.push(startUSTCell2);

    // Get middle node between current and neighbour
    let middle_row = Math.floor((Number(getComputedStyle(startUSTCell).getPropertyValue("--grid-x")) + Number(getComputedStyle(startUSTCell2).getPropertyValue("--grid-x")))/2);
    let middle_col = Math.floor((Number(getComputedStyle(startUSTCell).getPropertyValue("--grid-y")) + Number(getComputedStyle(startUSTCell2).getPropertyValue("--grid-y")))/2);
    let node_in_middle = grid[middle_row][middle_col];

    startUSTCell.innerHTML = '';
    startUSTCell.style.backgroundColor = "#b1b1b1";
    startUSTCell.style.setProperty('--solidity', "False");

    node_in_middle.innerHTML = '';
    node_in_middle.style.backgroundColor = "#b1b1b1";
    node_in_middle.style.setProperty('--solidity', "False");

    startUSTCell2.innerHTML = '';
    startUSTCell2.style.backgroundColor = "#b1b1b1";
    startUSTCell2.style.setProperty('--solidity', "False");

    // Setup Values
    let currentRow = numRows-1;
    let currentCol = 4;
    let numberOfCells = Math.floor((numRows+1)/2) * Math.floor((numCols+1)/2);

    // Repeat till all cells have been added to UST
    while (uniformSpanningTree.length < numberOfCells) {
        // Select current cell
        let currentCell = grid[currentRow][currentCol];
        
        // Complete random walk while current cell is not apart of UST
        let cameFrom = {};
        cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')] = undefined;
        let randomWalk = [];

        while (!uniformSpanningTree.includes(currentCell)) {
            // Get row and col of current cell
            let row = Math.floor(Number(getComputedStyle(currentCell).getPropertyValue('--grid-x')));
            let col = Math.floor(Number(getComputedStyle(currentCell).getPropertyValue('--grid-y')));

            // Select neighbouring cells and make sure not to select cell that current came from
            let neighbours = [];
            if (row+2 < numRows) {
                let currentNeighbour = grid[row+2][col];
                if (cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')] !== currentNeighbour) {
                    neighbours.push(currentNeighbour);
                }
            }
            if (col+2 < numCols) {
                let currentNeighbour = grid[row][col+2];
                if (cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')] !== currentNeighbour) {
                    neighbours.push(currentNeighbour);
                }
            }
            if (row-2 >= 0) {
                let currentNeighbour = grid[row-2][col];
                if (cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')] !== currentNeighbour) {
                    neighbours.push(currentNeighbour);
                }
            }
            if (col-2 >= 0) {
                let currentNeighbour = grid[row][col-2];
                if (cameFrom[getComputedStyle(currentCell).getPropertyValue('--node-id')] !== currentNeighbour) {
                    neighbours.push(currentNeighbour);
                }
            }

            // Choose random neighbour
            let randomIndex = Math.floor(Math.random() * neighbours.length);
            var randomNeighbour = neighbours[randomIndex];

            // Get middle node between current and neighbour
            let middle_row = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-x")) + Number(getComputedStyle(randomNeighbour).getPropertyValue("--grid-x")))/2);
            let middle_col = Math.floor((Number(getComputedStyle(currentCell).getPropertyValue("--grid-y")) + Number(getComputedStyle(randomNeighbour).getPropertyValue("--grid-y")))/2);
            let node_in_middle = grid[middle_row][middle_col];

            // Carve a passage + Animating wall removing
            currentCell.innerHTML = '';
            currentCell.style.backgroundColor = "red";
            currentCell.style.setProperty('--solidity', "False");

            node_in_middle.innerHTML = '';
            node_in_middle.style.backgroundColor = "red";
            node_in_middle.style.setProperty('--solidity', "False");

            randomNeighbour.innerHTML = '';
            randomNeighbour.style.backgroundColor = "red";
            randomNeighbour.style.setProperty('--solidity', "False");

            // Add current cell to random walk
            randomWalk.push(currentCell);

            // Check if current cell selected cell on its own path
            if (randomWalk.includes(randomNeighbour)) {

                // Solidify random neighbour and middle node
                let currentBacktrack = currentCell;
                let tempCurrent = randomNeighbour;


                // Remove random neighbour from random walk
                let index = randomWalk.indexOf(tempCurrent);
                randomWalk.splice(index, 1);

                // Backtracking loop
                while (true) {
                    // Get middle node between current and backtracked cell
                    let middle_row = Math.floor((Number(getComputedStyle(tempCurrent).getPropertyValue("--grid-x")) + Number(getComputedStyle(currentBacktrack).getPropertyValue("--grid-x")))/2);
                    let middle_col = Math.floor((Number(getComputedStyle(tempCurrent).getPropertyValue("--grid-y")) + Number(getComputedStyle(currentBacktrack).getPropertyValue("--grid-y")))/2);
                    let node_in_middle = grid[middle_row][middle_col];

                    // Carve a passage + Animating wall removing
                    let wall = document.createElement("div");
                    wall.style.backgroundColor = "#162336";
                    wall.classList.add("intermediate_wall");

                    // Append wall
                    currentBacktrack.appendChild(wall);
                    currentBacktrack.style.backgroundColor = "#b1b1b1";
                    currentBacktrack.style.setProperty('--solidity', "True");
                    currentBacktrack.style.setProperty('--can-solidify', "False");

                    let wall2 = document.createElement("div");
                    wall2.style.backgroundColor = "#162336";
                    wall2.classList.add("intermediate_wall");

                    node_in_middle.appendChild(wall2);
                    node_in_middle.style.backgroundColor = "#b1b1b1";
                    node_in_middle.style.setProperty('--solidity', "True");
                    node_in_middle.style.setProperty('--can-solidify', "False");

                    let wall3 = document.createElement("div");
                    wall3.style.backgroundColor = "#162336";
                    wall3.classList.add("intermediate_wall");

                    tempCurrent.appendChild(wall3);
                    tempCurrent.style.backgroundColor = "#b1b1b1";
                    tempCurrent.style.setProperty('--solidity', "True");
                    tempCurrent.style.setProperty('--can-solidify', "False");

                    if (getComputedStyle(currentBacktrack).getPropertyValue('--node-id') === getComputedStyle(randomNeighbour).getPropertyValue('--node-id')) {
                        // Desolidify current cell
                        randomNeighbour.innerHTML = '';
                        randomNeighbour.style.backgroundColor = "red";
                        randomNeighbour.style.setProperty('--solidity', "False");
                        randomNeighbour.style.setProperty('--can-solidify', "True");
                        break;
                    }

                    // Remove current backtrack from Random Walk
                    let index = randomWalk.indexOf(currentBacktrack);
                    randomWalk.splice(index, 1);
                    
                    // Backtrack - go back and set current cell to node it has selected
                    tempCurrent = currentBacktrack;
                    currentBacktrack = cameFrom[getComputedStyle(currentBacktrack).getPropertyValue('--node-id')];
                }


            } else {
                // Set cameFrom for randomNeighbour
                cameFrom[getComputedStyle(randomNeighbour).getPropertyValue('--node-id')] = currentCell;
            }
            
            currentCell = randomNeighbour;

            // Sleep
            await sleep(10);
        }

        // Update colours of random walk
        for (let i = 1; i < randomWalk.length; i++) {
            let middle_row = Math.floor((Number(getComputedStyle(randomWalk[i]).getPropertyValue("--grid-x")) + Number(getComputedStyle(randomWalk[i-1]).getPropertyValue("--grid-x")))/2);
            let middle_col = Math.floor((Number(getComputedStyle(randomWalk[i]).getPropertyValue("--grid-y")) + Number(getComputedStyle(randomWalk[i-1]).getPropertyValue("--grid-y")))/2);
            let node_in_middle = grid[middle_row][middle_col];

            randomWalk[i].innerHTML = '';
            randomWalk[i].style.backgroundColor = "#b1b1b1";
            randomWalk[i].style.setProperty('--solidity', "False");

            node_in_middle.innerHTML = '';
            node_in_middle.style.backgroundColor = "#b1b1b1";
            node_in_middle.style.setProperty('--solidity', "False");

            randomWalk[i-1].innerHTML = '';
            randomWalk[i-1].style.backgroundColor = "#b1b1b1";
            randomWalk[i-1].style.setProperty('--solidity', "False");
        }

        // Update Colours of last two nodes for random walk and UST
        let middle_row = Math.floor((Number(getComputedStyle(randomWalk[randomWalk.length-1]).getPropertyValue("--grid-x")) + Number(getComputedStyle(currentCell).getPropertyValue("--grid-x")))/2);
        let middle_col = Math.floor((Number(getComputedStyle(randomWalk[randomWalk.length-1]).getPropertyValue("--grid-y")) + Number(getComputedStyle(currentCell).getPropertyValue("--grid-y")))/2);
        let node_in_middle = grid[middle_row][middle_col];

        randomWalk[randomWalk.length-1].innerHTML = '';
        randomWalk[randomWalk.length-1].style.backgroundColor = "#b1b1b1";
        randomWalk[randomWalk.length-1].style.setProperty('--solidity', "False");

        node_in_middle.innerHTML = '';
        node_in_middle.style.backgroundColor = "#b1b1b1";
        node_in_middle.style.setProperty('--solidity', "False");

        currentCell.innerHTML = '';
        currentCell.style.backgroundColor = "#b1b1b1";
        currentCell.style.setProperty('--solidity', "False");

        // Add random walk to UST
        uniformSpanningTree.push(...randomWalk);

        // Update row
        while (uniformSpanningTree.includes(grid[currentRow][currentCol])) {
            currentCol += 2;
            if (currentCol > numCols) {
                currentRow -= 2;
                currentCol = 0;

                if (currentRow < 0) {
                    break;
                }
            }
        }
    }

    console.log("Completed Wilson's Algorithm");

    // Cleanup
    cleanupMazeGrid();
}

// ------------------------------------------------------------------------------- Grid Utility -------------------------------------------------------------------------

// GRID FUNCTIONS: Grid Creation, Set Start and Set End icons
function makeGrid(rows, cols) {
    grid = Array.from(Array(numRows), () => new Array(numCols));
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
                wall.style.animationPlayState = "running";
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
                            wall.style.animationPlayState = "running";
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

function resetGrid() {
    while (visualiser.lastChild) {
        visualiser.removeChild(visualiser.lastChild);
    }
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

function solidifyMazeGrid() {
    // Ensure visualiser cannot be tampered with during animation
    visualiser.style.pointerEvents = "none";

    // Solidify entire maze and reset grid
    for (r = 0; r < numRows; r++) {
        for (c = 0; c < numCols; c++) {
            let node = grid[r][c];
            node.style.setProperty('--solidity', "False");
            if (getComputedStyle(node).getPropertyValue('--is-start') === "True" || getComputedStyle(node).getPropertyValue('--is-end') === "True") {
                node.style.backgroundColor = "#b1b1b1";
                node.style.setProperty('--is-start', "False");
                node.style.setProperty('--is-end', "False");
            }

            let wall = document.createElement("div");
            wall.style.backgroundColor = "#162336";
            wall.classList.add("intermediate_wall");
            node.appendChild(wall);
            node.style.setProperty('--solidity', "True");
            node.style.setProperty('--can-solidify', "False");
        }
    }
}

function cleanupMazeGrid() {
    // Cleanup
    for (i = 0; i < numRows; i++) {
        for (j = 0; j < numCols; j++) {
            if (grid[i][j].classList.contains("maze_wall")) {
                grid[i][j].classList.remove("maze_wall");
            }

            if (grid[i][j].classList.contains("intermediate_wall")) {
                grid[i][j].classList.remove("intermediate_wall");
            }
        }
    }

    // Reset Pointer events
    visualiser.style.pointerEvents = "auto";
}

// INITIATION FUNCTION: Set Grid to be 16 x 32 size with start at (8, 8) and end at (8, 24)
function initiation() {
    makeGrid(numRows, numCols);
    setStartIcon(17, 20);
    setEndIcon(17, 50);
}

// ----------------------------------------------------------------------------- Event Listeners -------------------------------------------------------------------------

// CALL INITIATION
pathfindButton.addEventListener("click", async function() {
    var selectedAlgorithm = pathfindAlgorithmSelection.value;
    if (selectedAlgorithm == "A* Search") {
        console.log("A* Search Started");
        aStarSearch(startNode, endNode);
        console.log("A* Search Finished");
    } 
    else if (selectedAlgorithm == "BFS Search") {
        console.log("BFS Search Started");
        bfsSearch(startNode, endNode);
        console.log("BFS Search Finished");
    }
    else if (selectedAlgorithm == "DFS Search") {
        console.log("DFS Search Started");
        await dfsSearch(startNode, endNode);
        console.log("DFS Search Finished");
    }
    else if (selectedAlgorithm == "Dijkstra's Search") {
        console.log("Dijkstra's Search Started");
        dijkstrasSearch(startNode, endNode);
        console.log("Dijkstra's Search Finished");
    }
    else {
        console.log("INVALID PATHFINDING CHOICE");
    }
});

mazeGenButton.addEventListener("click", async function() {
    var selectedAlgorithm = mazeGenAlgorithmSelection.value;
    if (selectedAlgorithm == "Prim's Maze") {
        console.log("Prim's Maze Started");
        await primsMaze();
        console.log("Prim's Maze Finished");
    } else if (selectedAlgorithm == "Kruskal's Maze") {
        console.log("Kruskal's Maze Started");
        await kruskalsMaze();
        console.log("Kruskal's Maze Finished");
    } else if (selectedAlgorithm == "Growing Tree Maze") {
        console.log("Growing Tree Maze Started");
        await growingTreeMaze();
        console.log("Growing Tree Maze Finished");
    } else if (selectedAlgorithm == "Wilson's Maze") {
        console.log("Wilson's Maze Started");
        await wilsonsMaze();
        console.log("Wilson's Maze Finished");
    } else {
        console.log("INVALID MAZE CHOICE");
    }
});

gridSizeSlider.addEventListener("input", function() {
    numCols = gridSizeSlider.value;
    numRows = Math.floor(numCols * (7/15));

    gridSize.textContent = "Current Grid Size: " + numCols;
});

changeGridButton.addEventListener("click", function() {
    resetGrid();
    makeGrid(numRows, numCols);
    
    row = Math.floor(numRows/2);
    col = Math.floor(numCols/4);
    col2 = Math.floor(3*numCols/4);
    setStartIcon(row, col);
    setEndIcon(row, col2);
})

resetGridButton.addEventListener("click", function() {
    resetGrid();
    makeGrid(numRows, numCols);
    
    row = Math.floor(numRows/2);
    col = Math.floor(numCols/4);
    col2 = Math.floor(3*numCols/4);
    setStartIcon(row, col);
    setEndIcon(row, col2);
});


// Main Initiation Function Call
initiation();