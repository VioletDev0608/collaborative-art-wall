const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearButton = document.getElementById('clearCanvas');

let isDrawing = false;
let currentColor = '#000000';
let currentSize = 5;

// Set up canvas
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw locally
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Send drawing data to other users
    socket.emit('drawing', {
        x: x,
        y: y,
        color: currentColor,
        size: currentSize,
        drawing: true
    });
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    
    // Tell other users we stopped drawing
    socket.emit('drawing', {
        drawing: false
    });
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Tool event listeners
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
});

brushSize.addEventListener('change', (e) => {
    currentSize = e.target.value;
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-canvas');
});

// Socket events for receiving drawings from other users
socket.on('drawing', (data) => {
    if (!data.drawing) {
        ctx.beginPath();
        return;
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
});

socket.on('clear-canvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Touch event helpers
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function startTouchDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getTouchPos(e);
    ctx.moveTo(pos.x, pos.y);
    drawTouch(e);
}

function drawTouch(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getTouchPos(e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    socket.emit('drawing', {
        x: pos.x,
        y: pos.y,
        color: currentColor,
        size: currentSize,
        drawing: true
    });
}

function stopTouchDrawing(e) {
    if (!isDrawing) return;
    e.preventDefault();
    isDrawing = false;
    ctx.beginPath();
    socket.emit('drawing', {
        drawing: false
    });
}

// Add touch event listeners
canvas.addEventListener('touchstart', startTouchDrawing, { passive: false });
canvas.addEventListener('touchmove', drawTouch, { passive: false });
canvas.addEventListener('touchend', stopTouchDrawing, { passive: false });
canvas.addEventListener('touchcancel', stopTouchDrawing, { passive: false });

const presetColors = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#800000", "#008000",
    "#000080", "#808000", "#800080", "#008080", "#C0C0C0",
    "#808080", "#FFA500", "#A52A2A", "#8A2BE2", "#5F9EA0"
];

const colorPalette = document.getElementById('colorPalette');

// Generate color buttons
presetColors.forEach(color => {
    const btn = document.createElement('button');
    btn.style.background = color;
    btn.style.width = '30px';
    btn.style.height = '30px';
    btn.style.border = '2px solid #fff';
    btn.style.borderRadius = '50%';
    btn.style.cursor = 'pointer';
    btn.title = color;
    btn.addEventListener('click', () => {
        currentColor = color;
        colorPicker.value = color; // Sync color picker
    });
    colorPalette.appendChild(btn);
});

// ...existing code...