const captureBtn = document.getElementById('capture-btn');
const clearBtn = document.getElementById('clear-btn');
const canvas = document.getElementById('screenshot-canvas');
const ctx = canvas.getContext('2d');

const tools = {
  pen: document.getElementById('tool-pen'),
  rect: document.getElementById('tool-rect'),
  arrow: document.getElementById('tool-arrow'),
  highlight: document.getElementById('tool-highlight'),
  blur: document.getElementById('tool-blur')
};

let currentTool = 'pen';
let isDrawing = false;
let startX, startY;
let canvasSnapshot;
let rectCoordinates = null; // NEW: Holds the final cropped coordinates

// --- Tool Switching Logic ---
Object.keys(tools).forEach(toolName => {
  tools[toolName].addEventListener('click', () => {
    Object.values(tools).forEach(btn => btn.classList.remove('active'));
    tools[toolName].classList.add('active');
    currentTool = toolName;
  });
});

// --- Capture Logic ---
captureBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
    if (response && response.status === "success") {
      const img = new Image();
      img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = response.dataUrl;
    }
  });
});

// --- Canvas Draw Engine ---
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;

  // Cache canvas state to handle live rendering previews cleanly
  canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (currentTool === 'pen' || currentTool === 'highlight') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const currentX = e.offsetX;
  const currentY = e.offsetY;

  // Restore snapshot for tools that need to wipe tracking paths
  if (currentTool === 'rect' || currentTool === 'arrow' || currentTool === 'blur') {
    ctx.putImageData(canvasSnapshot, 0, 0);
  }

  if (currentTool === 'pen') {
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = "#fa5252";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  } 
  else if (currentTool === 'highlight') {
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = "rgba(255, 224, 0, 0.4)";
    ctx.lineWidth = 14;
    ctx.lineCap = "square";
    ctx.stroke();
  } 
  else if (currentTool === 'rect') {
    ctx.strokeStyle = "#228be6";
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
  } 
  else if (currentTool === 'arrow') {
    ctx.strokeStyle = "#12b886";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#12b886";
    drawArrow(startX, startY, currentX, currentY);
  }
  else if (currentTool === 'blur') {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    ctx.setLineDash([]);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return;
  isDrawing = false;

// --- Capture Crop Coordinates for Rectangle Tool ---
  if (currentTool === 'rect') {
    const endX = e.offsetX;
    const endY = e.offsetY;

    rectCoordinates = {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    };
  }

  if (currentTool === 'blur') {
    const endX = e.offsetX;
    const endY = e.offsetY;
    
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    if (width > 5 && height > 5) {
      // Isolate bounding box area onto temporary layer
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

      // Render blurred layer context over primary layout canvas
      ctx.filter = 'blur(6px)';
      ctx.drawImage(tempCanvas, x, y);
      ctx.filter = 'none';
    }
  }
});

canvas.addEventListener('mouseleave', () => isDrawing = false);

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rectCoordinates = null;
});

// Arrowhead calculations using trigonometry vectors
function drawArrow(fromX, fromY, toX, toY) {
  const headLength = 14;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// --- 5. Export / Download Mechanics ---
const downloadBtn = document.getElementById('download-btn');

downloadBtn.addEventListener('click', () => {
  let downloadCanvas = canvas; // Default to whole canvas

  // If a rectangle box was drawn, create a cropped canvas subset
  if (rectCoordinates && rectCoordinates.width > 5 && rectCoordinates.height > 5) {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = rectCoordinates.width;
    cropCanvas.height = rectCoordinates.height;
    const cropCtx = cropCanvas.getContext('2d');

    // Slice out the exact rectangle portion from the main canvas
    cropCtx.drawImage(
      canvas,
      rectCoordinates.x, rectCoordinates.y, rectCoordinates.width, rectCoordinates.height, // Source positions
      0, 0, rectCoordinates.width, rectCoordinates.height // Destination positions
    );

    downloadCanvas = cropCanvas; // Change download target to our crop slice
  }

  // Convert target canvas to file data
  const imageURI = downloadCanvas.toDataURL("image/png");
  const virtualLink = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  virtualLink.download = `snapshot-${timestamp}.png`;
  virtualLink.href = imageURI;
  virtualLink.click();
});

// --- 6. Tab Navigation Logic ---
const btnWorkspace = document.getElementById('btn-view-workspace');
const btnHistory = document.getElementById('btn-view-history');
const panelWorkspace = document.getElementById('panel-workspace');
const panelHistory = document.getElementById('panel-history');

btnWorkspace.addEventListener('click', () => {
  btnWorkspace.classList.add('active-tab');
  btnHistory.classList.remove('active-tab');
  panelWorkspace.classList.add('active-view');
  panelHistory.classList.remove('active-view');
});

btnHistory.addEventListener('click', () => {
  btnHistory.classList.add('active-tab');
  btnWorkspace.classList.remove('active-tab');
  panelHistory.classList.add('active-view');
  panelWorkspace.classList.remove('active-view');
  renderHistoryList(); // Load history items when opening tab
});


// --- 7. History Storage Processing Engine ---
const historyContainer = document.getElementById('history-container');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Modify the old image loader inside your "captureBtn" click handler to also save items!
// Find your existing captureBtn click block and add the saveToHistory function inside it:
/* img.onload = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    saveToHistory(response.dataUrl); // <-- ADD THIS LINE INSIDE YOUR EXISTING CAPTURE CAPTURE CORNER BLOCK
  };
*/

function saveToHistory(dataUrl) {
  chrome.storage.local.get({ screenshotHistory: [] }, (result) => {
    let history = result.screenshotHistory;
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      image: dataUrl
    };
    
    history.unshift(newItem); // Put newer images on top
    
    // Limit to last 10 snapshots to stay within Chrome Local storage quotas comfortably
    if (history.length > 10) history.pop();

    chrome.storage.local.set({ screenshotHistory: history });
  });
}

function renderHistoryList() {
  chrome.storage.local.get({ screenshotHistory: [] }, (result) => {
    const history = result.screenshotHistory;
    if (history.length === 0) {
      historyContainer.innerHTML = "No screenshots saved yet.";
      return;
    }

    historyContainer.innerHTML = ""; // Clear loader text
    history.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = "history-item";
      
      itemRow.innerHTML = `
        <img src="${item.image}" class="history-thumb" alt="thumb">
        <div>
          <small style="display:block; color:#666;">${item.timestamp}</small>
          <button class="load-hist-btn" data-id="${item.id}" style="padding:4px 8px; font-size:11px; background:#228be6; color:white;">🎨 Load</button>
        </div>
      `;
      
      // Wire up target click to restore canvas contents on demand
      itemRow.querySelector('.load-hist-btn').addEventListener('click', () => {
        const img = new Image();
        img.onload = function() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          btnWorkspace.click(); // Redirect context back to canvas viewer panel
        };
        img.src = item.image;
      });

      historyContainer.appendChild(itemRow);
    });
  });
}

clearHistoryBtn.addEventListener('click', () => {
  chrome.storage.local.set({ screenshotHistory: [] }, () => {
    renderHistoryList();
  });
});