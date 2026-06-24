const captureBtn = document.getElementById('capture-btn');
const clearBtn = document.getElementById('clear-btn');
const canvas = document.getElementById('screenshot-canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
captureBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
    if (response && response.status === "success") {
      const img = new Image();
      img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = response.dataUrl;
    } else {
      alert("Error capturing tab: " + (response?.message || "Unknown error"));
    }
  });
});
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = "#ff0000"; // Red pen
  ctx.lineWidth = 3;
  ctx.stroke();
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);
clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});