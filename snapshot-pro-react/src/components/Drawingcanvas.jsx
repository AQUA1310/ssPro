import React, { useRef, useState, useEffect } from 'react';
import { useScreenshot } from '../context/ScreenshotContext';

export default function DrawingCanvas({ captureTrigger, clearTrigger }) {
  const { activeTool } = useScreenshot();
  const canvasRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);

  // Keep references to access the latest state values inside window event listeners
  const stateRef = useRef({ isDrawing: false, startPos: { x: 0, y: 0 }, canvasSnapshot: null, activeTool });
  
  useEffect(() => {
    stateRef.current = { isDrawing, startPos, canvasSnapshot, activeTool };
  }, [isDrawing, startPos, canvasSnapshot, activeTool]);

  // --- Listen for Parent Capture Events ---
  useEffect(() => {
    if (!captureTrigger) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const maxLayoutWidth = window.innerWidth - 80;
      const scaleFactor = Math.min(1, maxLayoutWidth / img.width);
      
      const displayWidth = img.width * scaleFactor;
      const displayHeight = img.height * scaleFactor;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      
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

  // --- Mouse Down Handler ---
  const handleMouseDown = (e) => {
    if (!canvasSnapshot) return;

    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.putImageData(canvasSnapshot, 0, 0);
  };

  // --- 🌟 GLOBAL WINDOW DRAG & DROP LISTENERS ---
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const current = stateRef.current;
      if (!current.isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const bounds = canvas.getBoundingClientRect();
      
      const currentX = e.clientX - bounds.left;
      const currentY = e.clientY - bounds.top;

      // Reset to pristine canvas before drawing current box
      if (current.canvasSnapshot) {
        ctx.putImageData(current.canvasSnapshot, 0, 0);
      }

      const rectX = current.startPos.x;
      const rectY = current.startPos.y;
      const rectW = currentX - current.startPos.x;
      const rectH = currentY - current.startPos.y;

      // 🔵 CROP SELECTION MODE (Dotted Blue/White Line)
      if (current.activeTool === 'rect') {
        ctx.lineWidth = 2;
        
        // Layer 1: White background track to prevent dark background invisibility
        ctx.strokeStyle = "#ffffff";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(rectX, rectY, rectW, rectH);

        // Layer 2: Offset color dash overlay
        ctx.strokeStyle = "#228be6";
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = 4;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.lineDashOffset = 0;
      } 
      // 🟣 DARK BLUR SELECTION MODE (Dotted Purple/White Line)
      else if (current.activeTool === 'blur') {
        ctx.lineWidth = 2;

        // Layer 1: White baseline track
        ctx.strokeStyle = "#ffffff";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(rectX, rectY, rectW, rectH);

        // Layer 2: Neon Purple dash overlay
        ctx.strokeStyle = "#e040fb";
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = 4;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.lineDashOffset = 0;
      }
    };

    const handleGlobalMouseUp = (e) => {
      const current = stateRef.current;
      if (!current.isDrawing) return;
      
      setIsDrawing(false);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const bounds = canvas.getBoundingClientRect();
      
      const endX = Math.max(0, Math.min(canvas.width / (window.devicePixelRatio || 1), e.clientX - bounds.left));
      const endY = Math.max(0, Math.min(canvas.height / (window.devicePixelRatio || 1), e.clientY - bounds.top));

      const x = Math.min(current.startPos.x, endX);
      const y = Math.min(current.startPos.y, endY);
      const width = Math.abs(endX - current.startPos.x);
      const height = Math.abs(endY - current.startPos.y);

      // Clean up dotted guidelines immediately
      if (current.canvasSnapshot) {
        ctx.putImageData(current.canvasSnapshot, 0, 0);
      }

      if (width <= 5 || height <= 5) return;

      // ✂️ EXECUTE CROP SELECTION
      if (current.activeTool === 'rect') {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width * (window.devicePixelRatio || 1);
        cropCanvas.height = height * (window.devicePixelRatio || 1);
        const cropCtx = cropCanvas.getContext('2d');

        cropCtx.drawImage(
          canvas,
          x * (window.devicePixelRatio || 1), y * (window.devicePixelRatio || 1), 
          width * (window.devicePixelRatio || 1), height * (window.devicePixelRatio || 1), 
          0, 0, cropCanvas.width, cropCanvas.height  
        );

        const imageURI = cropCanvas.toDataURL("image/png");
        const virtualLink = document.createElement('a');
        virtualLink.download = `crop-${Date.now()}.png`;
        virtualLink.href = imageURI;
        virtualLink.click();
      }

      // 🕶️ EXECUTE DARK BLUR TINT MASK
      if (current.activeTool === 'blur') {
        const dpr = window.devicePixelRatio || 1;
        
        // 1. Isolate target image selection onto internal staging buffer canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * dpr;
        tempCanvas.height = height * dpr;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(
          canvas, 
          x * dpr, y * dpr, width * dpr, height * dpr, 
          0, 0, tempCanvas.width, tempCanvas.height
        );

        // 2. Inject Dark slate overlay tint mask directly on master canvas layout
        ctx.fillStyle = "rgba(26, 27, 38, 0.85)";
        ctx.fillRect(x, y, width, height);

        // 3. Re-draw staging asset using complex filters
        ctx.filter = 'blur(25px) brightness(0.4)';
        ctx.drawImage(tempCanvas, x, y, width, height);
        ctx.filter = 'none'; // Unbind filter state

        // Save updated canvas matrix state to memory cache
        const updatedSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setCanvasSnapshot(updatedSnapshot);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        style={{
          border: '1px solid #ced4da',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'crosshair',
          maxWidth: '100%',
          userSelect: 'none'
        }}
      />
    </div>
  );
}