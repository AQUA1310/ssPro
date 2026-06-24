import React, { useRef, useState, useEffect } from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function DrawingCanvas({ captureTrigger, clearTrigger }) {
  const { activeTool, saveToHistory } = useScreenshot();
  const canvasRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);

  // --- Listen for Parent Capture Events ---
  useEffect(() => {
    if (!captureTrigger) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Paint the snapshot layer perfectly onto the pixel canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Cache the initial clean state
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasSnapshot(snapshot);
    };
    
    img.crossOrigin = "anonymous"; 
    img.src = captureTrigger;
  }, [captureTrigger]);

  // --- Listen for Parent Clear Actions ---
  useEffect(() => {
    if (clearTrigger === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasSnapshot(null);
  }, [clearTrigger]);

  // --- 1. Mouse Down Handler ---
  const handleMouseDown = (e) => {
    if (!canvasSnapshot) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    // 🌟 ONE BOX RULE: Wipe out previous boxes by restoring the clean snapshot immediately
    ctx.putImageData(canvasSnapshot, 0, 0);
  };

  // --- 2. Mouse Move Handler ---
  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const currentX = e.clientX - bounds.left;
    const currentY = e.clientY - bounds.top;

    // Wipe trailing preview frames while dragging
    if (canvasSnapshot) {
      ctx.putImageData(canvasSnapshot, 0, 0);
    }

    if (activeTool === 'rect') {
      ctx.strokeStyle = "#228be6";
      ctx.lineWidth = 3;
      ctx.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
    } 
    else if (activeTool === 'blur') {
      ctx.strokeStyle = "#ae3ec9";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
      ctx.setLineDash([]);
    }
  };

// --- 3. Mouse Up Handler (Instant Crop & Auto-Download without outlines) ---
// --- 3. Mouse Up Handler (With Deep Troubleshooting) ---
  const handleMouseUp = (e) => {
    // 🔍 Test 1: Is the component tracking that you are currently drawing?
    console.log("MouseUp detected! isDrawing state is:", isDrawing);
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const endX = e.clientX - bounds.left;
    const endY = e.clientY - bounds.top;

    const x = Math.min(startPos.x, endX);
    const y = Math.min(startPos.y, endY);
    const width = Math.abs(endX - startPos.x);
    const height = Math.abs(endY - startPos.y);

    // 🔍 Test 2: Print out the exact drawn box size dimensions
    console.log(`Calculated dimensions -> Width: ${width}px, Height: ${height}px, activeTool: ${activeTool}`);

    if (width <= 5 || height <= 5) {
      console.warn("Box size too tiny! Exiting early to prevent accidental clicks.");
      if (canvasSnapshot) ctx.putImageData(canvasSnapshot, 0, 0);
      return;
    }

    if (activeTool === 'rect') {
      ctx.putImageData(canvasSnapshot, 0, 0);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = width;
      cropCanvas.height = height;
      const cropCtx = cropCanvas.getContext('2d');

      cropCtx.drawImage(
        canvas,
        x, y, width, height, 
        0, 0, width, height  
      );

      const imageURI = cropCanvas.toDataURL("image/png");

      // Trigger automatic background link download instantly
      const virtualLink = document.createElement('a');
      virtualLink.download = `crop-${Date.now()}.png`;
      virtualLink.href = imageURI;
      virtualLink.click();
    }

    if (activeTool === 'blur') {
      console.log("Entering 'blur' branch...");
      ctx.putImageData(canvasSnapshot, 0, 0);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

      ctx.filter = 'blur(6px)';
      ctx.drawImage(tempCanvas, x, y);
      ctx.filter = 'none';

      const updatedSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasSnapshot(updatedSnapshot);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={350}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
        style={{
          border: '1px solid #ced4da',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          cursor: 'crosshair'
        }}
      />
    </div>
  );
}