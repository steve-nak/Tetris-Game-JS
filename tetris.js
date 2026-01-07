const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const restartButton = document.getElementById('restart');
const startPauseButton = document.getElementById('startPause');

const ROWS = 20;
const COLS = 12;
const BLOCK_SIZE = 20;

let board = [];
let score = 0;
let lines = 0;
let currentPiece = null;
let gameOver = false;
let isPaused = false;
let hasStarted = false;
let dropInterval;

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const COLORS = [
    '#00f0f0', // cyan
    '#f0f000', // yellow
    '#a000f0', // purple
    '#f0a000', // orange
    '#0000f0', // blue
    '#00f000', // green
    '#f00000'  // red
];

// Initialize game
function init() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    gameOver = false;
    isPaused = false;
    hasStarted = true;
    updateScore();
    spawnPiece();
    clearInterval(dropInterval);
    dropInterval = setInterval(drop, 1000);
    updateStartPauseLabel();
}

// Create a new piece
function spawnPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPiece = {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };
    
    if (collision()) {
        gameOver = true;
        clearInterval(dropInterval);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        hasStarted = false;
        updateStartPauseLabel();
    }
}

// Check collision
function collision(newX = currentPiece.x, newY = currentPiece.y, newShape = currentPiece.shape) {
    for (let row = 0; row < newShape.length; row++) {
        for (let col = 0; col < newShape[row].length; col++) {
            if (newShape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;
                
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }
                
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece to board
function merge() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check the same row again
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * linesCleared; // Bonus for multiple lines
        updateScore();
    }
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
    linesElement.textContent = lines;
}

// Rotate piece
function rotate() {
    const newShape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    
    if (!collision(currentPiece.x, currentPiece.y, newShape)) {
        currentPiece.shape = newShape;
    }
}

// Move piece
function move(dir) {
    const newX = currentPiece.x + dir;
    if (!collision(newX, currentPiece.y)) {
        currentPiece.x = newX;
    }
}

// Drop piece one row
function drop() {
    if (gameOver || isPaused) return;
    
    if (!collision(currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        merge();
        clearLines();
        spawnPiece();
    }
    draw();
}

// Hard drop
function hardDrop() {
    while (!collision(currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 2;
    }
    merge();
    clearLines();
    spawnPiece();
    updateScore();
    draw();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
    
    // Draw current piece
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    ctx.fillRect(
                        (currentPiece.x + col) * BLOCK_SIZE,
                        (currentPiece.y + row) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    // Draw pause overlay
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// Draw a centered message on a cleared canvas (idle state)
function drawMessage(message) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function updateStartPauseLabel() {
    if (!startPauseButton) return;
    if (!hasStarted || gameOver) {
        startPauseButton.textContent = 'Start Game';
    } else if (isPaused) {
        startPauseButton.textContent = 'Resume';
    } else {
        startPauseButton.textContent = 'Pause';
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (!hasStarted) return;
    
    if (e.key === 'p' || e.key === 'P') {
        isPaused = !isPaused;
        updateStartPauseLabel();
        draw();
        return;
    }
    
    if (isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
    draw();
});

// Restart button
restartButton.addEventListener('click', () => {
    init();
    draw();
});

// Start/Pause button
startPauseButton.addEventListener('click', () => {
    if (!hasStarted || gameOver) {
        init();
        draw();
        return;
    }

    // Toggle pause/resume
    isPaused = !isPaused;
    updateStartPauseLabel();
    draw();
});

// Initial idle screen
drawMessage('Press Start to Play');
updateStartPauseLabel();
