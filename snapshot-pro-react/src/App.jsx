import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Toolbar from './components/Toolbar';
import DrawingCanvas from './components/DrawingCanvas';
import { useScreenshot } from './context/ScreenshotContext';

function App() {
  const [activeView, setActiveView] = useState('workspace');
  const [captureUrl, setCaptureUrl] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const { saveToHistory } = useScreenshot();

  const handleCapture = () => {
    if (!window.chrome || !chrome.runtime) {
      alert("Extension context missing. Build and run inside Chrome!");
      return;
    }

    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "CAPTURE_TAB" }, (response) => {
        if (chrome.runtime.lastError) {
          alert(`Chrome Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response && response.status === "success") {
          setCaptureUrl(response.dataUrl);
          saveToHistory(response.dataUrl);
        } else {
          alert("Background script failed to send back an image.");
        }
      });
    }, 100);
  };

  const handleClear = () => {
    setCaptureUrl(null);
    setClearTrigger(prev => prev + 1);
  };

  return (
    <div style={{ 
      width: '460px', 
      padding: '20px', 
      backgroundColor: '#0f111a', // 🌟 Deep rich dashboard slate dark mode
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#f8f9fa',
      boxSizing: 'border-box'
    }}>
      {/* Glowing Header Layout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px #3b5bdb)' }}>📸</span>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SnapShot Pro <span style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '1px', textTransform: 'uppercase', marginLeft: '6px', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '4px' }}>v2.0</span>
        </h2>
      </div>
      
      <Navigation activeView={activeView} setActiveView={setActiveView} />

      {activeView === 'workspace' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Toolbar onCapture={handleCapture} onClear={handleClear} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DrawingCanvas captureTrigger={captureUrl} clearTrigger={clearTrigger} />
          </div>
        </div>
      ) : (
        <div style={{ background: '#1e2030', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#94a3b8' }}>
          <h3 style={{ color: '#fff', marginTop: 0 }}>Saved History Logs</h3>
          <p style={{ fontSize: '13px' }}>Your captures will stack down here automatically.</p>
        </div>
      )}
    </div>
  );
}

export default App;