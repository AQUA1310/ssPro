import React, { useRef, useState, useEffect } from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function DrawingCanvas({ captureTrigger, clearTrigger }) {
  const { activeTool, saveToHistory } = useScreenshot();
  const canvasRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);
  const [rectCoordinates, setRectCoordinates] = useState(null);

  // --- Listen for Parent Capture Events ---
  useEffect(() => {
    if (!captureTrigger) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return; // Guard clause to ensure canvas is fully mounted

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Force reset any global transform matrix styles
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Paint the snapshot layer perfectly onto the pixel canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Cache the initial clean state so shape drawing tools work smoothly right away
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasSnapshot(snapshot);
    };
    
    // Cross-origin attribute fixes potential canvas taint bugs
    img.crossOrigin = "anonymous"; 
    img.src = captureTrigger;
    
    setRectCoordinates(null); // Reset crop box tracking
  }, [captureTrigger]);

  // --- Listen for Parent Clear Actions ---
  useEffect(() => {
    if (clearTrigger === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRectCoordinates(null);
  }, [clearTrigger]);

  // --- 1. Mouse Down Handler ---
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    // Cache current canvas pixel layer
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasSnapshot(snapshot);

    if (activeTool === 'pen' || activeTool === 'highlight') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  // --- 2. Mouse Move Handler ---
  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bounds = canvas.getBoundingClientRect();
    const currentX = e.clientX - bounds.left;
    const currentY = e.clientY - bounds.top;

    // Wipe trailing strokes for vectorized shapes
    if (['rect', 'arrow', 'blur'].includes(activeTool) && canvasSnapshot) {
      ctx.putImageData(canvasSnapshot, 0, 0);
    }

    if (activeTool === 'pen') {
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "#fa5252";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    } 
    else if (activeTool === 'highlight') {
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "rgba(255, 224, 0, 0.4)";
      ctx.lineWidth = 14;
      ctx.stroke();
    } 
    else if (activeTool === 'rect') {
      ctx.strokeStyle = "#228be6";
      ctx.lineWidth = 3;
      ctx.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
    } 
    else if (activeTool === 'arrow') {
      ctx.strokeStyle = "#12b886";
      ctx.lineWidth = 3;
      ctx.fillStyle = "#12b886";
      drawVectorArrow(ctx, startPos.x, startPos.y, currentX, currentY);
    }
    else if (activeTool === 'blur') {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
      ctx.setLineDash([]);
    }
  };

  // --- 3. Mouse Up Handler (Apply Crop Storage or Blurs) ---
  const handleMouseUp = (e) => {
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

    if (activeTool === 'rect') {
      setRectCoordinates({ x, y, width, height });
    }

    if (activeTool === 'blur' && width > 5 && height > 5) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

      ctx.filter = 'blur(6px)';
      ctx.drawImage(tempCanvas, x, y);
      ctx.filter = 'none';
    }
  };

  // --- 4. Export Download Handler ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    let targetCanvas = canvas;

    if (rectCoordinates && rectCoordinates.width > 5 && rectCoordinates.height > 5) {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = rectCoordinates.width;
      cropCanvas.height = rectCoordinates.height;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(
        canvas,
        rectCoordinates.x, rectCoordinates.y, rectCoordinates.width, rectCoordinates.height,
        0, 0, rectCoordinates.width, rectCoordinates.height
      );
      targetCanvas = cropCanvas;
    }

    const imageURI = targetCanvas.toDataURL("image/png");
    const virtualLink = document.createElement('a');
    virtualLink.download = `snapshot-react-${Date.now()}.png`;
    virtualLink.href = imageURI;
    virtualLink.click();
  };

  // Mathematical vector helper
  const drawVectorArrow = (context, fromX, fromY, toX, toY) => {
    const headLength = 14;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fill();
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
      <button
        onClick={handleDownload}
        style={{
          marginTop: '15px',
          padding: '10px 0',
          backgroundColor: '#f59f00',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          width: '100%',
          maxWidth: '500px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        💾 Download Screenshot (PNG)
      </button>
    </div>
  );
}