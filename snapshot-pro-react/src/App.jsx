import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import DrawingCanvas from './components/DrawingCanvas';

function App() {
  const [captureUrl, setCaptureUrl] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isFullScreenTab, setIsFullScreenTab] = useState(false);

  // Determine view mode immediately on render (Your original working logic)
  useEffect(() => {
    const isTab = window.location.search.includes('fullscreen=true') || window.innerWidth > 500;
    
    if (isTab) {
      setIsFullScreenTab(true);

      // Check Chrome local storage for the cached image string
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['tempScreenshot'], (result) => {
          if (result && result.tempScreenshot) {
            setCaptureUrl(result.tempScreenshot);
            chrome.storage.local.remove('tempScreenshot'); // Clear cache
          }
        });
      }
    }
  }, []);

  const handleCapture = (e) => {
    if (e) e.preventDefault();

    if (typeof chrome === 'undefined' || !chrome.runtime) {
      alert("Extension environment not detected. Please load this extension in chrome://extensions!");
      return;
    }

    try {
      // Direct message execution to background runner (Your original message name)
      chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime message error:", chrome.runtime.lastError.message);
        }
      });
      
      // Close popup smoothly
      setTimeout(() => {
        window.close();
      }, 50);
    } catch (err) {
      console.error("Capture trigger block failure:", err);
    }
  };

  const handleClear = () => {
    setCaptureUrl(null);
    setClearTrigger(prev => prev + 1);
  };

  // --- POPUP VIEW LAUNCHER ---
  if (!isFullScreenTab) {
    return (
      <div style={{ 
        width: '280px', 
        padding: '20px', 
        backgroundColor: '#0f111a', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#fff', fontWeight: '600' }}>📸 SnapShot Pro</h3>
        <button 
          onClick={handleCapture}
          style={{ 
            width: '100%', 
            padding: '12px 16px', 
            backgroundColor: '#4f46e5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: '600', 
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}
        >
          Open Workspace Tab
        </button>
      </div>
    );
  }

  // --- FULL WIDESCREEN WORKSPACE VIEW ---
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      padding: '24px', 
      backgroundColor: '#0f111a', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#f8f9fa',
      boxSizing: 'border-box',
      overflow: 'scroll' /* 🌟 FIXED: Allows the entire window view to scroll up and down if the canvas is huge */
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>📸</span>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SnapShot Pro <span style={{ fontSize: '11px', color: '#6366f1', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '4px', marginLeft: '6px' }}>Editor</span>
        </h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Toolbar onCapture={handleCapture} onClear={handleClear} />
        {/* 🌟 FIXED: Re-enabled standard centered canvas container */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <DrawingCanvas captureTrigger={captureUrl} clearTrigger={clearTrigger} />
        </div>
      </div>
    </div>
  );
}

export default App;